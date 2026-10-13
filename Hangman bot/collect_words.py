"""Complete one evaluation and save words revealed only after games end.

The strategy's training bank is frozen before starting. Collected answers are
not fed back to that strategy during the collection run. This records observed
words; a 300-game evaluation need not be the server's entire vocabulary.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import tempfile
import time
from typing import Callable

from bot_examples.api_client import HangmanApiClient, HangmanApiError
from bot_examples.runner import play_evaluation
from strategy_dictionary import DictionaryBot


ROOT = Path(__file__).resolve().parent
SERVER = "https://hangman-ex89.onrender.com"


def finished_word(state: dict) -> str:
    """Check terminal status BEFORE accessing the answer field."""
    if state.get("status") not in {"won", "lost"}:
        raise ValueError("words may only be collected after a win or loss")
    word = state.get("word")
    if not isinstance(word, str) or not word.isascii() or not word.isalpha():
        raise ValueError("finished game did not include an alphabetic answer")
    return word.lower()


def atomic_write_text(path: Path, text: str) -> None:
    """Replace a file, retrying brief Windows sharing/permission failures."""
    path.parent.mkdir(parents=True, exist_ok=True)
    # Each save owns its temporary file; other runs cannot overwrite it.
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent,
                                     prefix=f".{path.name}-", suffix=".tmp",
                                     delete=False) as stream:
        temporary = Path(stream.name)
        stream.write(text)
    try:
        for attempt in range(4):
            try:
                os.replace(temporary, path)
                return
            except OSError as error:
                transient = isinstance(error, PermissionError) or getattr(error, "winerror", None) in {5, 32, 33}
                if not transient or attempt == 3:
                    raise
                time.sleep(0.05 * (2 ** attempt))
    finally:
        try:
            temporary.unlink(missing_ok=True)
        except OSError:
            pass


class FinishedWordCollector:
    """Checkpoint completed games without inspecting any playing answer."""

    def __init__(self, bank_path: Path, checkpoint_path: Path, name: str, url: str,
                 *, backup_dir: Path | None = None,
                 warning: Callable[[str], None] | None = None):
        self.bank_path = bank_path
        self.checkpoint_path = checkpoint_path
        self.name, self.url = name, url
        workspace_key = hashlib.sha256(str(ROOT).encode()).hexdigest()[:12]
        self.backup_dir = backup_dir or Path(tempfile.gettempdir()) / f"hangman-bot-{workspace_key}"
        self.warning = warning or (lambda message: print(message, flush=True))
        self._warned: set[str] = set()
        self.saved_paths: dict[Path, Path] = {}
        self.evaluation_id: str | None = None
        self.completed = False
        self.official_results_path: Path | None = None
        self.games: list[dict] = []
        self.words: set[str] = set()
        for source in (bank_path, self.recovery_path(bank_path)):
            try:
                self.words.update(line.strip().lower() for line in source.read_text(encoding="utf-8").splitlines()
                                  if line.strip().isascii() and line.strip().isalpha())
            except FileNotFoundError:
                pass
            except OSError as error:
                self.warn_once(f"read:{source}", f"Could not read {source}: {error}. Continuing with other saved words.")

    def warn_once(self, key: str, message: str) -> None:
        if key not in self._warned:
            self._warned.add(key)
            self.warning(message)

    def recovery_path(self, path: Path) -> Path:
        key = hashlib.sha256(str(path.resolve()).encode()).hexdigest()[:12]
        return self.backup_dir / f"{key}_{path.name}"

    def save_text(self, path: Path, text: str) -> Path | None:
        """Storage errors never interrupt an active server game/evaluation."""
        try:
            atomic_write_text(path, text)
            self.saved_paths[path] = path
            return path
        except OSError as primary_error:
            recovery = self.recovery_path(path)
            try:
                atomic_write_text(recovery, text)
            except OSError as backup_error:
                self.warn_once(f"unsaved:{path}",
                    f"Could not save {path} or its recovery copy: {primary_error}; {backup_error}. "
                    "Continuing in memory; keep this terminal open until the evaluation finishes.")
                return None
            self.saved_paths[path] = recovery
            self.warn_once(f"recovery:{path}",
                f"Project file is unavailable: {path} ({primary_error}). "
                f"Continuing the evaluation; recovery copy: {recovery}")
            return recovery

    def save_json(self, path: Path, value) -> Path | None:
        return self.save_text(path, json.dumps(value, indent=2))

    def persist(self) -> None:
        self.save_text(self.bank_path, "\n".join(sorted(self.words)) + "\n")
        self.save_json(self.checkpoint_path, {
            "source": "answers revealed after completed evaluation games",
            "server": self.url, "name": self.name, "evaluation_id": self.evaluation_id,
            "evaluation_completed": self.completed, "observed_games": len(self.games),
            "unique_observed_this_run": len({g["word"] for g in self.games}),
            "unique_bank_words": len(self.words), "games": self.games,
            "official_results": str(self.official_results_path) if self.official_results_path else None,
        })

    def started(self, evaluation_id: str) -> None:
        self.evaluation_id = evaluation_id
        self.persist()

    def observe(self, state: dict) -> None:
        word = finished_word(state)
        self.games.append({"word": word, "status": state["status"],
                           "difficulty": state.get("difficulty"),
                           "remaining_guesses": state.get("remaining_guesses"),
                           "completed_games": state.get("completed_games")})
        self.words.add(word)
        self.persist()

    def finish(self, results: dict, results_path: Path) -> None:
        # A resumed run's final completed results include earlier finished games.
        games = validated_games(results)
        self.games = [{"word": finished_word(game), "status": game["status"],
                       "difficulty": game.get("difficulty"),
                       "remaining_guesses": game.get("remaining_guesses"),
                       "completed_games": index + 1} for index, game in enumerate(games)]
        self.words.update(game["word"] for game in self.games)
        self.evaluation_id = results.get("evaluation_id") or self.evaluation_id
        self.completed = True
        self.official_results_path = self.save_json(results_path, results)
        self.persist()


def validated_games(results: dict) -> list[dict]:
    """Validate every terminal game before importing or finalizing answers."""
    games = results.get("games")
    if not isinstance(games, list) or not games:
        raise ValueError("results must contain a nonempty games list")
    if results.get("evaluation_status", "completed") != "completed":
        raise ValueError("evaluation results are not completed")
    if results.get("total_games") != len(games):
        raise ValueError("results do not include every evaluation game")
    for game in games:
        finished_word(game)
    return games


def import_completed_results(results: dict, collector: FinishedWordCollector) -> None:
    """Validate the whole result before writing any imported words."""
    for game in validated_games(results):
        collector.observe(game)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default=SERVER)
    parser.add_argument("--name", default="JON17006")
    parser.add_argument("--bank", type=Path, default=ROOT / "data" / "observed_words.txt")
    parser.add_argument("--resume", metavar="EVALUATION_ID",
                        help="continue the same active evaluation; never automatically start a replacement")
    parser.add_argument("--import-results", type=Path,
                        help="import a completed results JSON locally, without contacting the server")
    args = parser.parse_args(argv)
    if args.resume and args.import_results:
        parser.error("--resume and --import-results cannot be combined")
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    checkpoint = ROOT / "results" / f"collection_{timestamp}.json"
    collector = FinishedWordCollector(args.bank, checkpoint, args.name, args.url)
    try:
        if args.import_results:
            results = json.loads(args.import_results.read_text(encoding="utf-8-sig"))
            import_completed_results(results, collector)
        else:
            # Exactly one server-assigned evaluation; no skipping or restarting.
            # Instantiate the bot once so collecting cannot alter its training.
            bot = DictionaryBot()
            client = HangmanApiClient(args.url)
            try:
                results = play_evaluation(client, bot, name=args.name,
                    progress=lambda message: print(message, flush=True),
                    on_game_finished=collector.observe, evaluation_id=args.resume,
                    on_evaluation_started=collector.started)
            finally:
                client.close()
        results_path = ROOT / "results" / f"official_{timestamp}.json"
        collector.finish(results, results_path)
    except (HangmanApiError, ValueError, OSError) as error:
        print(f"Collection stopped: {error}", flush=True)
        collector.persist()
        print("No automatic restart was attempted. Completed-game words remain in memory and available saved copies.", flush=True)
        if collector.evaluation_id:
            print(f"To resume if the server still considers it active: python collect_words.py --resume {collector.evaluation_id}", flush=True)
        return 1
    except KeyboardInterrupt:
        collector.persist()
        print("Interrupted. The official run may be abandoned; available recovery copies are preserved.")
        return 130
    print(f"Finished: {results.get('wins', '?')}/{results['total_games']} wins; "
          f"{len({g['word'] for g in collector.games})} unique words observed this run.")
    print(f"Observed bank: {collector.saved_paths.get(args.bank, 'NOT SAVED; see warnings')} ({len(collector.words)} unique words)")
    print(f"Official results: {collector.official_results_path or 'NOT SAVED; see warnings'}")
    print("This bank is observed vocabulary; it is not proof of the server's complete word list.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
