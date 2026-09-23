"""Terminal-level pytest coverage for ``card24.py``.

Most tests call ``main()`` with a fixed hand and simulated terminal input so
every result is deterministic.  The final test launches the script in a real
child process to verify its command-line entry point as well.
"""

from __future__ import annotations

import io
from pathlib import Path
import subprocess
import sys

import pytest

import card24


SCRIPT_PATH = Path(__file__).with_name("card24.py")


def run_terminal_round(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
    cards: list[int],
    terminal_input: str,
) -> str:
    """Run one deterministic terminal round and return its printed output."""

    monkeypatch.setattr(card24, "generate_cards", lambda: cards.copy())
    monkeypatch.setattr(sys, "stdin", io.StringIO(terminal_input))

    card24.main()

    captured = capsys.readouterr()
    assert captured.err == ""
    assert "Traceback" not in captured.out
    return captured.out


def test_terminal_accepts_correct_fractional_solution(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    output = run_terminal_round(
        monkeypatch,
        capsys,
        [3, 3, 8, 8],
        "8 / (3 - 8 / 3)\nn\n",
    )

    assert "Your cards: 3   3   8   8" in output
    assert "Correct! Your expression equals 24." in output
    assert "One solution:" not in output


def test_terminal_reports_incorrect_total(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    output = run_terminal_round(
        monkeypatch,
        capsys,
        [3, 3, 8, 8],
        "8 + 8 + 3 + 3\nno\n",
    )

    assert "That expression equals 22, not 24." in output


@pytest.mark.parametrize(
    "expression",
    [
        "8 + 8 + 8",
        "8 + 8 + 3 + 3 + 1",
    ],
    ids=["missing-and-duplicated-card", "extra-card"],
)
def test_terminal_rejects_incorrect_card_usage(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
    expression: str,
) -> None:
    output = run_terminal_round(
        monkeypatch,
        capsys,
        [3, 3, 8, 8],
        f"{expression}\nn\n",
    )

    assert "Use each displayed card exactly once" in output


@pytest.mark.parametrize(
    "expression",
    [
        "(8 + 3",
        "8 / (3 - 3) + 8",
    ],
    ids=["malformed-parentheses", "division-by-zero"],
)
def test_terminal_handles_invalid_expression_without_crashing(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
    expression: str,
) -> None:
    output = run_terminal_round(
        monkeypatch,
        capsys,
        [3, 3, 8, 8],
        f"{expression}\nn\n",
    )

    assert "Invalid expression:" in output


def test_terminal_never_executes_code_like_input(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    output = run_terminal_round(
        monkeypatch,
        capsys,
        [3, 3, 8, 8],
        "__import__('builtins').print('UNSAFE_EXECUTED')\nn\n",
    )

    assert "Invalid expression:" in output
    assert "UNSAFE_EXECUTED" not in output


def test_terminal_shows_a_solution_when_requested(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    output = run_terminal_round(
        monkeypatch,
        capsys,
        [3, 3, 8, 8],
        "8 + 8 + 3 + 3\nyes\n",
    )

    assert "One solution:" in output
    assert "= 24" in output


def test_terminal_reports_when_no_solution_exists(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    output = run_terminal_round(
        monkeypatch,
        capsys,
        [1, 1, 1, 1],
        "1 + 1 + 1 + 1\ny\n",
    )

    assert "No solution exists for these cards." in output


def test_terminal_reprompts_until_yes_or_no_is_entered(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    output = run_terminal_round(
        monkeypatch,
        capsys,
        [3, 3, 8, 8],
        "8 / (3 - 8 / 3)\nmaybe\nYES\n",
    )

    assert "Please enter yes or no." in output
    assert output.count("Would you like to see a solution?") == 2
    assert "One solution:" in output


def test_terminal_displays_face_card_names_and_values(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    output = run_terminal_round(
        monkeypatch,
        capsys,
        [1, 11, 12, 13],
        "1 + 11 + 12 + 13\nn\n",
    )

    assert "Your cards:" in output
    assert "A (1)" in output
    assert "J (11)" in output
    assert "Q (12)" in output
    assert "K (13)" in output


def test_terminal_handles_eof_at_expression_prompt(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    output = run_terminal_round(monkeypatch, capsys, [3, 3, 8, 8], "")

    assert "Game cancelled." in output


def test_terminal_handles_eof_at_solution_prompt(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    output = run_terminal_round(
        monkeypatch,
        capsys,
        [3, 3, 8, 8],
        "8 / (3 - 8 / 3)\n",
    )

    assert "Correct! Your expression equals 24." in output
    assert "Game ended without showing a solution." in output


def test_script_entry_point_runs_in_a_real_subprocess() -> None:
    completed = subprocess.run(
        [sys.executable, str(SCRIPT_PATH)],
        cwd=SCRIPT_PATH.parent,
        input="not arithmetic\nn\n",
        text=True,
        capture_output=True,
        timeout=15,
        check=False,
    )

    combined_output = completed.stdout + completed.stderr
    assert completed.returncode == 0
    assert "Card Game 24" in completed.stdout
    assert "Your cards:" in completed.stdout
    assert "Invalid expression:" in completed.stdout
    assert completed.stderr == ""
    assert "Traceback" not in combined_output
