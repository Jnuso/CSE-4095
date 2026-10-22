"""End-to-end button and form checks for the first three published demos."""

from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys


def open_demo(browser, site_root, assignment):
    """Open a published demo directly from the static site directory."""
    browser.get((site_root / "demos" / assignment / "index.html").as_uri())


def element(browser, element_id):
    """Return one element by its stable HTML id."""
    return browser.find_element(By.ID, element_id)


def replace_text(browser, element_id, value):
    """Type through the browser so input and keyboard handlers run."""
    field = element(browser, element_id)
    field.clear()
    field.send_keys(value)
    return field


def test_checker_swap_manual_controls_and_validation(browser, site_root):
    open_demo(browser, site_root, "assignment-1")
    assert element(browser, "step-number").text == "Step 0"
    assert element(browser, "previous-button").get_attribute("disabled") is not None

    element(browser, "next-button").click()
    assert element(browser, "step-number").text == "Step 1"
    assert len(browser.find_elements(By.CSS_SELECTOR, "#swap-log .log-entry")) == 1
    element(browser, "previous-button").click()
    assert element(browser, "step-number").text == "Step 0"

    replace_text(browser, "checker-count", "0")
    assert element(browser, "checker-count").get_attribute("aria-invalid") == "true"
    assert "whole number from 1 to 20" in element(browser, "status-message").text
    assert element(browser, "next-button").get_attribute("disabled") is not None

    replace_text(browser, "checker-count", "2")
    assert element(browser, "checker-count").get_attribute("aria-invalid") is None
    assert element(browser, "step-total").text == "1 swap"
    element(browser, "next-button").click()
    assert element(browser, "step-number").text == "Step 1"
    assert element(browser, "state-array").text == "[0, 1, 0, 1]"
    assert element(browser, "next-button").get_attribute("disabled") is not None
    assert element(browser, "start-button").text == "Replay"

    element(browser, "reset-button").click()
    assert element(browser, "step-number").text == "Step 0"
    assert element(browser, "state-array").text == "[0, 0, 1, 1]"
    assert "Reset" in element(browser, "status-message").text


def test_checker_swap_play_pause_resume_and_speed(browser, site_root):
    open_demo(browser, site_root, "assignment-1")
    element(browser, "speed-slider").send_keys(Keys.ARROW_RIGHT)
    assert element(browser, "speed-output").text == "1.25×"

    element(browser, "start-button").click()
    assert element(browser, "start-button").get_attribute("disabled") is not None
    element(browser, "pause-button").click()
    assert element(browser, "status-message").text == "Animation paused"
    assert element(browser, "pause-button").text == "Resume"
    element(browser, "pause-button").click()
    assert element(browser, "pause-button").text == "Pause"
    element(browser, "reset-button").click()
    assert element(browser, "step-number").text == "Step 0"
    assert element(browser, "pause-button").get_attribute("disabled") is not None


def test_expression_evaluator_buttons_and_result(browser, site_root):
    open_demo(browser, site_root, "assignment-2")
    assert element(browser, "stepCount").text.startswith("Step 0 of ")
    assert element(browser, "prev").get_attribute("disabled") is not None

    element(browser, "next").click()
    assert element(browser, "stepCount").text.startswith("Step 1 of ")
    element(browser, "prev").click()
    assert element(browser, "stepCount").text.startswith("Step 0 of ")

    element(browser, "play").click()
    assert element(browser, "play").get_attribute("aria-pressed") == "true"
    element(browser, "play").click()
    assert element(browser, "play").get_attribute("aria-pressed") == "false"
    element(browser, "reset").click()
    assert element(browser, "stepCount").text.startswith("Step 0 of ")

    replace_text(browser, "expr", "2 + 3 * 4")
    element(browser, "load").click()
    assert element(browser, "expr").get_attribute("aria-invalid") is None
    for _ in range(40):
        if not element(browser, "next").is_enabled():
            break
        element(browser, "next").click()
    else:
        raise AssertionError("Evaluator did not finish within 40 steps")
    assert element(browser, "result").text == "14"
    assert element(browser, "play").get_attribute("disabled") is not None
    element(browser, "reset").click()
    assert element(browser, "result").text == "Not finished"
    assert element(browser, "stepCount").text.startswith("Step 0 of ")


def test_expression_evaluator_rejects_invalid_input(browser, site_root):
    open_demo(browser, site_root, "assignment-2")
    replace_text(browser, "expr", "1 / 0")
    element(browser, "load").click()
    assert element(browser, "expr").get_attribute("aria-invalid") == "true"
    assert "Division by zero" in element(browser, "status").text
    assert element(browser, "stepCount").text == "No steps"
    assert element(browser, "next").get_attribute("disabled") is not None

    replace_text(browser, "expr", "-2 - 1")
    element(browser, "expr").send_keys(Keys.ENTER)
    assert element(browser, "expr").get_attribute("aria-invalid") is None
    assert element(browser, "stepCount").text.startswith("Step 0 of ")


def test_card_game_buttons_and_solution(browser, site_root):
    open_demo(browser, site_root, "assignment-4")
    assert len(browser.find_elements(By.CSS_SELECTOR, "#card-list .playing-card")) == 4
    mode = element(browser, "solvable-mode")
    mode.click()
    assert mode.get_attribute("aria-pressed") == "true"
    assert element(browser, "mode-state").get_attribute("textContent") == "On"

    element(browser, "show-solution").click()
    panel = element(browser, "solution-panel")
    assert not panel.get_attribute("hidden")
    assert panel.get_attribute("data-state") == "solution"
    solution = element(browser, "solution-message").text
    assert solution.endswith(" = 24")

    replace_text(browser, "expression", "1 +")
    browser.find_element(By.CSS_SELECTOR, "#expression-form button[type='submit']").click()
    assert element(browser, "result").get_attribute("data-state") == "invalid"

    replace_text(browser, "expression", "999 + 999 + 999 + 999")
    browser.find_element(By.CSS_SELECTOR, "#expression-form button[type='submit']").click()
    assert element(browser, "result").get_attribute("data-state") == "wrong-cards"

    replace_text(browser, "expression", solution.removesuffix(" = 24"))
    browser.find_element(By.CSS_SELECTOR, "#expression-form button[type='submit']").click()
    assert element(browser, "result").get_attribute("data-state") == "correct"
    assert "equals 24" in element(browser, "result-message").text

    element(browser, "new-cards").click()
    assert len(browser.find_elements(By.CSS_SELECTOR, "#card-list .playing-card")) == 4
    assert element(browser, "expression").get_attribute("value") == ""
    assert element(browser, "solution-panel").get_attribute("hidden") is not None
    assert element(browser, "result").get_attribute("data-state") == "idle"

    mode.click()
    assert mode.get_attribute("aria-pressed") == "false"
    assert element(browser, "result").get_attribute("data-state") == "notice"
