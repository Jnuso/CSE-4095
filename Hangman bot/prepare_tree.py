"""Compile public-dictionary decisions and compare them locally.

No network calls are made. Completed-run words are used only as replay test
cases, never as training data. The bot trains exclusively on public word lists.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
import re
from time import perf_counter

from benchmark import read_word_files, simulate_game, summarize
from my_bot import MyBot
from tree_bot import ROOT, TreeBot


def play_cases(bot, entries, label):
    games = []
    for number, (word, difficulty) in enumerate(entries, 1):
        games.append(simulate_game(bot, word, difficulty))
        if number % 100 == 0:
            print(f"{label}: {number}/{len(entries)} tested", flush=True)
    print(f"{label}: {json.dumps(summarize(games))}", flush=True)
    return games


def main():
    started = perf_counter()
    log_path = Path("C:/Users/Jnuso/.codex/attachments/55b7f84d-d387-45b8-8828-b3ef8dcf98be/Pasted text.txt")
    log = log_path.read_text(encoding="utf-8-sig")
    rows = re.findall(r"^\s*(\d+)\.\s+(easy|medium|hard)\s+(won|lost)\s+word=([a-z]+)\s+guesses=\s*(\d+)\s+remaining=(\d+)\s+score=(\d+)\s*$", log, re.MULTILINE)
    assert len(rows) == 300
    replay = [(row[3], row[1]) for row in rows]
    bot = TreeBot(policy_path=ROOT / "results" / "no_prepared_policy.json")
    proof = {}
    for name, planner in bot.planners().items():
        print(f"Planning {name} ({len(planner.words)} public words)...", flush=True)
        proof[name] = planner.solve_bank(seconds=2.0 if name == "combined" else 6.0,
                                         node_limit=500000)
        print(f"{name}: {json.dumps(proof[name])}", flush=True)

    entries = read_word_files(sorted((ROOT / "bot_examples" / "words").glob("*.txt")))
    warmup_games = play_cases(bot, entries, "Tree / all public words")
    # The warmup completes further exact subtrees. Measure the settled policy,
    # rather than mixing early online fallback choices with prepared decisions.
    public_games = play_cases(bot, entries, "Prepared tree / all public words")
    assert len(public_games) == 633
    assert all(game["status"] == "won" for game in public_games)

    tree_replay = play_cases(bot, replay, "Tree / previous 300 games")
    baseline_replay = play_cases(MyBot(), replay, "Original / same 300 games")
    assert summarize(baseline_replay)["total_score"] == 45270
    assert summarize(tree_replay)["wins"] == 300
    assert summarize(tree_replay)["total_score"] > 45270

    # Store only exact states reached in these simulations. A cutoff state is
    # never exported as exact. Indexes are tied to sorted dictionary hashes.
    reached = {name: set() for name in bot.planners()}
    for game in warmup_games + public_games + tree_replay:
        for turn in game["trace"]:
            state = turn["state"]
            difficulty = state.get("difficulty")
            name = difficulty if difficulty in bot.by_difficulty else "combined"
            planner = bot.planners()[name]
            pattern, guessed, lives = planner._read_state(state)
            indexes = planner._candidate_indexes(pattern, guessed)
            value = planner._values.get((indexes, lives))
            if value and value[2] >= 0:
                reached[name].add((indexes, lives))
    document = {"version": 1, "training_source": "Public assignment word lists only",
                "objective": "maximize wins, then total remaining lives; uniform candidates",
                "banks": {}}
    for name, planner in bot.planners().items():
        rows = [[list(indexes), lives, *planner._values[indexes, lives]]
                for indexes, lives in sorted(reached[name])]
        document["banks"][name] = {"words_sha256": bot.word_fingerprint(planner), "states": rows}
    path = ROOT / "data" / "tree_policy.json"
    path.write_text(json.dumps(document, separators=(",", ":")) + "\n", encoding="utf-8")

    # Fresh process-equivalent instance must realize the same complete policy.
    fresh = TreeBot()
    print(f"Loaded {fresh.loaded_policy_states} prepared decisions ({path.stat().st_size} bytes)", flush=True)
    fresh_games = play_cases(fresh, entries, "Fresh prepared tree / all public words")
    assert [(g["status"], g["remaining_guesses"]) for g in fresh_games] == [
        (g["status"], g["remaining_guesses"]) for g in public_games]
    fresh_replay = play_cases(fresh, replay, "Fresh prepared tree / previous 300 games")
    assert [(g["status"], g["remaining_guesses"]) for g in fresh_replay] == [
        (g["status"], g["remaining_guesses"]) for g in tree_replay]

    evidence = {
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "training": "Only public dictionaries; completed-run output is used only for replay testing",
        "public_words": summarize(public_games), "previous_run_original": summarize(baseline_replay),
        "previous_run_tree": summarize(tree_replay), "fresh_tree": summarize(fresh_replay),
        "prepared_states": fresh.loaded_policy_states, "proof_by_bank_and_length": proof,
        "elapsed_seconds": perf_counter() - started,
        "limitations": "Dictionary-covered local simulations, not a new official evaluation or a guarantee on unseen words.",
    }
    (ROOT / "results" / "tree_improved_validation.json").write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    print(f"Verified improved tree; total preparation time {perf_counter() - started:.1f}s", flush=True)


if __name__ == "__main__":
    main()
