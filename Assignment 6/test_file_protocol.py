"""Smoke test: the game must work when index.html is opened straight from disk.

Opening a page through a file:// URL is how most people will "just double-click"
the submission. Browsers refuse to load ES modules over file://, so this test
loads index.html that way in headless Chromium and plays real games.

Run from this folder with:

    python -m pytest -q test_file_protocol.py

Requires Playwright (`pip install playwright && playwright install chromium`).
The test skips cleanly if Playwright or Chromium is unavailable.
"""

from __future__ import annotations

from pathlib import Path

import pytest

pytest.importorskip("playwright", reason="Playwright is optional for browser tests")
from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import sync_playwright

INDEX_URL = (Path(__file__).resolve().parent / "submission" / "index.html").as_uri()
assert INDEX_URL.startswith("file://")


@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as playwright:
        try:
            chromium = playwright.chromium.launch()
        except PlaywrightError as error:
            pytest.skip(f"Chromium could not start: {str(error).splitlines()[0]}")
        yield chromium
        chromium.close()


@pytest.fixture
def page(browser):
    context = browser.new_context(reduced_motion="reduce", viewport={"width": 1440, "height": 1100})
    page = context.new_page()
    problems: list[str] = []
    page.on("pageerror", lambda error: problems.append(f"pageerror: {error}"))
    page.on(
        "console",
        lambda message: problems.append(f"console.{message.type}: {message.text}")
        if message.type == "error"
        else None,
    )
    page.goto(INDEX_URL)
    page.wait_for_function(
        "document.getElementById('dp-table-rows').textContent === '13,125'"
        " && document.getElementById('dp-build-time').textContent !== 'Calculating…'"
    )
    page.problems = problems  # type: ignore[attr-defined]
    yield page
    context.close()


def level(page) -> str:
    return page.locator("#dp-current-level").inner_text()


def test_opens_from_file_url_without_errors(page) -> None:
    assert page.url.startswith("file://")
    assert page.locator("#status-title").inner_text() == "Your move · Player A"
    assert level(page) == "0 / 20"
    for hand in ("hand-a-left", "hand-a-right", "hand-b-left", "hand-b-right"):
        assert page.locator(f"#{hand}").get_attribute("data-count") == "1"
    assert page.problems == []


def test_human_attack_then_computer_replies(page) -> None:
    page.locator("#hand-a-left").click()
    page.locator("#hand-b-left").click()
    page.wait_for_function("document.getElementById('dp-current-level').textContent === '2 / 20'")
    assert page.locator("#history-list > li").count() == 2
    assert page.problems == []


def test_computer_moves_first_when_human_is_player_b(page) -> None:
    page.locator("#player-b").click()
    page.wait_for_function("document.getElementById('dp-current-level').textContent === '1 / 20'")
    assert page.problems == []


def test_ai_vs_ai_runs_to_the_depth_20_result_and_restart_works(page) -> None:
    page.locator("#mode-auto").click()
    for expected in range(1, 21):
        page.locator("#auto-step").click()
        page.wait_for_function(
            f"document.getElementById('dp-current-level').textContent === '{expected} / 20'"
        )
    assert "tie" in page.locator("#status-title").inner_text().lower()
    page.locator("#restart-button").click()
    page.wait_for_function("document.getElementById('dp-current-level').textContent === '0 / 20'")
    assert page.problems == []


def test_two_local_players_can_attack_and_redistribute(page) -> None:
    page.locator("#mode-local").click()
    page.locator("#split-button").click()
    page.locator("#move-options button.move-option").first.click()
    page.wait_for_function("document.getElementById('dp-current-level').textContent === '1 / 20'")
    assert page.locator("#status-title").inner_text() == "Player B's move"
    page.locator("#hand-b-left").click()
    page.locator("#hand-a-right").click()
    page.wait_for_function("document.getElementById('dp-current-level').textContent === '2 / 20'")
    assert page.locator("#history-list > li").count() == 2
    assert page.problems == []


def test_optional_depth_sound_and_ai_experiments_do_not_change_game(page) -> None:
    page.locator("#sound-toggle").click()
    assert page.locator("#sound-toggle").get_attribute("aria-pressed") == "true"
    page.locator("#search-depth").select_option("10")
    assert level(page) == "0 / 10"
    assert page.locator("#dp-table-rows").inner_text() == "6,875"
    page.locator("#advantage-details > summary").click()
    page.locator("#advantage-run").click()
    assert "B can force a win" in page.locator("#advantage-results").inner_text()
    page.locator("#comparison-details > summary").click()
    page.locator("#comparison-run").click()
    assert "Bottom-up DP" in page.locator("#comparison-results").inner_text()
    assert level(page) == "0 / 10"
    assert page.problems == []


def test_opponent_strength_can_deviate_while_perfect_mode_stays_optimal(page) -> None:
    page.evaluate("Math.random = () => 0.99")
    page.locator("#ai-strength").evaluate(
        "element => { element.value = '0'; element.dispatchEvent(new Event('input', { bubbles: true })); }"
    )
    assert "0%" in page.locator("#ai-strength-value").inner_text()
    page.locator("#player-b").click()
    page.wait_for_function("document.getElementById('dp-current-level').textContent === '1 / 20'")
    assert "splits" in page.locator("#history-list").inner_text()

    page.locator("#ai-strength").evaluate(
        "element => { element.value = '100'; element.dispatchEvent(new Event('input', { bubbles: true })); }"
    )
    page.locator("#restart-button").click()
    page.wait_for_function("document.getElementById('dp-current-level').textContent === '1 / 20'")
    assert "taps" in page.locator("#history-list").inner_text()
    assert page.problems == []
