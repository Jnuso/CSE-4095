"""Real-browser checks for the published Chopsticks game controls."""

from pathlib import Path

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select, WebDriverWait


@pytest.fixture(name="chopsticks")
def fresh_game(browser, site_root: Path):
    """Open a fresh game and wait for its minimax table to finish building."""
    browser.get((site_root / "demos" / "assignment-6" / "index.html").as_uri())
    WebDriverWait(browser, 15).until(
        lambda driver: driver.find_element(By.ID, "dp-table-rows").text == "13,125"
    )
    return browser


def wait_level(browser, level: int, depth: int = 20) -> None:
    """Wait until an animated move has committed and the UI has rendered."""
    WebDriverWait(browser, 10).until(
        lambda driver: driver.find_element(By.ID, "dp-current-level").text
        == f"{level} / {depth}"
    )


def test_modes_player_side_and_sound_buttons(chopsticks) -> None:
    page = chopsticks
    assert page.find_element(By.ID, "mode-human").get_attribute("aria-pressed") == "true"
    assert page.find_element(By.ID, "player-a").get_attribute("aria-pressed") == "true"

    sound = page.find_element(By.ID, "sound-toggle")
    sound.click()
    assert sound.get_attribute("aria-pressed") == "true"
    assert sound.text == "Sound on"
    sound.click()
    assert sound.get_attribute("aria-pressed") == "false"
    assert sound.text == "Sound off"

    page.find_element(By.ID, "mode-local").click()
    assert page.find_element(By.ID, "mode-local").get_attribute("aria-pressed") == "true"
    assert not page.find_element(By.ID, "player-controls").is_displayed()
    assert not page.find_element(By.ID, "ai-strength-controls").is_displayed()

    page.find_element(By.ID, "mode-human").click()
    page.find_element(By.ID, "player-b").click()
    assert page.find_element(By.ID, "player-b").get_attribute("aria-pressed") == "true"
    WebDriverWait(page, 10).until(
        lambda driver: driver.find_element(By.ID, "turn-count").text == "1 move played"
    )
    assert page.find_element(By.ID, "status-title").text == "Your move · Player B"
    page.find_element(By.ID, "player-a").click()
    wait_level(page, 0)
    assert page.find_element(By.ID, "player-a").get_attribute("aria-pressed") == "true"
    assert page.find_element(By.ID, "status-title").text == "Your move · Player A"


def test_hand_taps_and_restart_button(chopsticks) -> None:
    page = chopsticks
    page.find_element(By.ID, "mode-local").click()
    page.find_element(By.ID, "hand-a-left").click()
    assert "is-selected" in page.find_element(By.ID, "hand-a-left").get_attribute("class")
    page.find_element(By.ID, "hand-b-left").click()
    wait_level(page, 1)
    assert page.find_element(By.ID, "hand-b-left").get_attribute("data-count") == "2"
    assert "Turn 1" in page.find_element(By.ID, "history-list").text

    page.find_element(By.ID, "hand-b-left").click()
    page.find_element(By.ID, "hand-a-right").click()
    wait_level(page, 2)
    assert page.find_element(By.ID, "hand-a-right").get_attribute("data-count") == "3"
    assert len(page.find_elements(By.CSS_SELECTOR, "#history-list > li")) == 2

    page.find_element(By.ID, "restart-button").click()
    wait_level(page, 0)
    assert page.find_element(By.ID, "turn-count").text == "0 moves played"
    assert "No moves yet" in page.find_element(By.ID, "history-list").text
    for hand_id in ("hand-a-left", "hand-a-right", "hand-b-left", "hand-b-right"):
        assert page.find_element(By.ID, hand_id).get_attribute("data-count") == "1"


def test_split_button_choices_and_back_to_taps(chopsticks) -> None:
    page = chopsticks
    page.find_element(By.ID, "mode-local").click()
    split = page.find_element(By.ID, "split-button")
    assert split.is_enabled()
    split.click()
    assert split.get_attribute("aria-pressed") == "true"
    assert split.text == "Back to taps"
    assert len(page.find_elements(By.CSS_SELECTOR, "#move-options button.move-option")) == 2

    split.click()
    assert split.get_attribute("aria-pressed") == "false"
    assert split.text == "Split fingers"
    split.click()
    page.find_element(By.CSS_SELECTOR, "#move-options button.move-option").click()
    wait_level(page, 1)
    counts = (
        int(page.find_element(By.ID, "hand-a-left").get_attribute("data-count")),
        int(page.find_element(By.ID, "hand-a-right").get_attribute("data-count")),
    )
    assert sorted(counts) == [0, 2]
    assert "split" in page.find_element(By.ID, "history-list").text.lower()


def test_auto_step_play_pause_and_speed_controls(chopsticks) -> None:
    page = chopsticks
    page.find_element(By.ID, "mode-auto").click()
    assert page.find_element(By.ID, "auto-controls").is_displayed()
    assert page.find_element(By.ID, "mode-auto").get_attribute("aria-pressed") == "true"
    assert page.find_element(By.ID, "status-title").text == "Autonomous game paused"

    speed = page.find_element(By.ID, "auto-speed")
    speed.send_keys(Keys.END)
    assert speed.get_attribute("value") == "1800"
    assert page.find_element(By.ID, "auto-speed-label").text == "1.8 s / move"
    page.find_element(By.ID, "auto-step").click()
    wait_level(page, 1)
    assert len(page.find_elements(By.CSS_SELECTOR, "#history-list > li")) == 1

    play = page.find_element(By.ID, "auto-play")
    play.click()
    WebDriverWait(page, 3).until(lambda driver: play.text == "Pause AI vs AI")
    play.click()
    WebDriverWait(page, 3).until(lambda driver: play.text == "Start AI vs AI")
    assert page.find_element(By.ID, "status-title").text == "Autonomous game paused"


def test_ai_panel_and_tree_branch_preview_do_not_play_move(chopsticks) -> None:
    page = chopsticks
    toggle = page.find_element(By.ID, "ai-toggle")
    toggle.click()
    assert toggle.get_attribute("aria-expanded") == "false"
    assert not page.find_element(By.ID, "ai-analysis-content").is_displayed()
    toggle.click()
    assert toggle.get_attribute("aria-expanded") == "true"

    page.find_element(By.CSS_SELECTOR, "#ai-advanced-details > summary").click()
    WebDriverWait(page, 3).until(
        lambda driver: driver.find_element(By.ID, "ai-advanced-details").get_attribute("open")
        is not None
    )
    current = page.find_element(By.ID, "graph-current")
    original_key = current.get_attribute("data-tree-node-key")
    branch = page.find_element(By.CSS_SELECTOR, "#graph-choices button.tree-node")
    branch.click()
    assert branch.get_attribute("aria-pressed") == "true"
    assert "Preview only" in page.find_element(By.ID, "tree-impact").text
    assert page.find_elements(By.CSS_SELECTOR, "#tree-replies .tree-node")
    assert current.get_attribute("data-tree-node-key") == original_key
    assert page.find_element(By.ID, "turn-count").text == "0 moves played"


def test_depth_and_strength_controls_reset_and_update_analysis(chopsticks) -> None:
    page = chopsticks
    strength = page.find_element(By.ID, "ai-strength")
    strength.send_keys(Keys.HOME)
    assert strength.get_attribute("value") == "0"
    assert page.find_element(By.ID, "ai-strength-value").text == "0% · Beginner"
    strength.send_keys(Keys.END)
    assert strength.get_attribute("value") == "100"
    assert page.find_element(By.ID, "ai-strength-value").text == "100% · Perfect"

    page.find_element(By.ID, "mode-local").click()
    page.find_element(By.ID, "hand-a-left").click()
    page.find_element(By.ID, "hand-b-left").click()
    wait_level(page, 1)
    Select(page.find_element(By.ID, "search-depth")).select_by_value("10")
    wait_level(page, 0, 10)
    assert page.find_element(By.ID, "remaining-moves").text == "10 moves remaining"
    assert page.find_element(By.ID, "dp-table-rows").text == "6,875"
    assert page.find_element(By.ID, "turn-count").text == "0 moves played"
    Select(page.find_element(By.ID, "search-depth")).select_by_value("20")
    wait_level(page, 0)
    assert page.find_element(By.ID, "dp-table-rows").text == "13,125"


def test_experiment_buttons_populate_results(chopsticks) -> None:
    page = chopsticks
    page.find_element(By.CSS_SELECTOR, "#advantage-details > summary").click()
    page.find_element(By.ID, "advantage-run").click()
    WebDriverWait(page, 10).until(
        lambda driver: len(driver.find_elements(By.CSS_SELECTOR, "#advantage-results tr")) >= 4
    )
    results_text = page.find_element(By.ID, "advantage-results").get_attribute("textContent")
    assert "Opening score" in results_text
    assert page.find_elements(By.CSS_SELECTOR, "#advantage-results tr.is-current-depth")

    page.find_element(By.CSS_SELECTOR, "#comparison-details > summary").click()
    page.find_element(By.ID, "comparison-run").click()
    WebDriverWait(page, 10).until(
        lambda driver: len(driver.find_elements(By.CSS_SELECTOR, "#comparison-results tr")) == 3
    )
    comparison = page.find_element(By.ID, "comparison-results").text
    assert "Bottom-up DP" in comparison
    assert "Plain recursion" in comparison
    assert page.find_element(By.ID, "turn-count").text == "0 moves played"


def test_completed_game_tree_review_buttons_leave_game_unchanged(chopsticks) -> None:
    page = chopsticks
    Select(page.find_element(By.ID, "search-depth")).select_by_value("10")
    wait_level(page, 0, 10)
    page.find_element(By.ID, "mode-auto").click()
    for level in range(1, 11):
        page.find_element(By.ID, "auto-step").click()
        wait_level(page, level, 10)

    assert page.find_element(By.ID, "turn-count").text == "10 moves played"
    assert page.find_element(By.ID, "tree-review-controls").get_attribute("hidden") is None
    page.find_element(By.CSS_SELECTOR, "#ai-advanced-details > summary").click()
    current = page.find_element(By.ID, "graph-current")
    final_key = current.get_attribute("data-tree-node-key")
    assert final_key.endswith("|10")
    final_hands = tuple(
        page.find_element(By.ID, hand_id).get_attribute("data-count")
        for hand_id in ("hand-a-left", "hand-a-right", "hand-b-left", "hand-b-right")
    )

    page.find_element(By.ID, "tree-review-previous").click()
    WebDriverWait(page, 3).until(
        lambda driver: current.get_attribute("data-tree-node-key").endswith("|9")
    )
    page.find_element(By.ID, "tree-review-next").click()
    WebDriverWait(page, 3).until(
        lambda driver: current.get_attribute("data-tree-node-key") == final_key
    )
    page.find_element(By.CSS_SELECTOR, "#tree-played-path button.tree-route-node").click()
    WebDriverWait(page, 3).until(
        lambda driver: current.get_attribute("data-tree-node-key").endswith("|0")
    )
    page.find_element(By.ID, "tree-review-final").click()
    WebDriverWait(page, 3).until(
        lambda driver: current.get_attribute("data-tree-node-key") == final_key
    )
    assert page.find_element(By.ID, "turn-count").text == "10 moves played"
    assert tuple(
        page.find_element(By.ID, hand_id).get_attribute("data-count")
        for hand_id in ("hand-a-left", "hand-a-right", "hand-b-left", "hand-b-right")
    ) == final_hands
