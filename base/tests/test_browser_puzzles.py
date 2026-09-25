"""Click through both published 8-puzzle search visualizers in Chrome."""

from __future__ import annotations

from pathlib import Path

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait


PUZZLES = (
    ("bfs.html", "custom-start-button"),
    ("astar.html", "custom-button"),
)


def open_puzzle(browser, site_root: Path, page_name: str) -> None:
    browser.get((site_root / "demos" / "assignment-5" / page_name).as_uri())
    WebDriverWait(browser, 10).until(
        lambda driver: driver.find_element(By.ID, "status-badge").text == "Initial state"
    )


def set_configuration(browser, digits: str) -> None:
    inputs = browser.find_elements(By.CSS_SELECTOR, "#configuration-grid input")
    assert len(inputs) == len(digits) == 9
    for field, digit in zip(inputs, digits):
        field.clear()
        field.send_keys(digit)
    assert "".join(field.get_attribute("value") for field in inputs) == digits


def text_at(browser, element_id: str) -> str:
    return browser.find_element(By.ID, element_id).text


@pytest.mark.parametrize(("page_name", "custom_button"), PUZZLES)
def test_puzzle_buttons_solve_step_play_reset_and_speed(
    browser, site_root: Path, page_name: str, custom_button: str
) -> None:
    open_puzzle(browser, site_root, page_name)
    assert not browser.find_element(By.ID, "play-button").is_enabled()
    assert not browser.find_element(By.ID, "next-button").is_enabled()

    browser.find_element(By.ID, custom_button).click()
    assert "Enter a new starting position" in text_at(browser, "input-note")
    assert browser.switch_to.active_element.get_attribute("aria-label") == "Row 1 column 1"

    set_configuration(browser, "123456708")
    browser.find_element(By.ID, "solve-button").click()
    WebDriverWait(browser, 12).until(
        lambda driver: driver.find_element(By.ID, "step-count").text == "0 / 1"
        and driver.find_element(By.ID, "next-button").is_enabled()
    )
    assert text_at(browser, "total-moves") == "1"

    browser.find_element(By.ID, "next-button").click()
    assert text_at(browser, "step-count") == "1 / 1"
    assert text_at(browser, "status-badge") == "Complete"
    browser.find_element(By.ID, "previous-button").click()
    assert text_at(browser, "step-count") == "0 / 1"

    browser.find_elements(By.CSS_SELECTOR, "#state-strip .state-card")[-1].click()
    assert text_at(browser, "step-count") == "1 / 1"
    browser.find_element(By.ID, "reset-button").click()
    assert text_at(browser, "step-count") == "0 / 1"

    speed = browser.find_element(By.ID, "speed-slider")
    speed.send_keys(Keys.HOME)
    assert text_at(browser, "speed-value") == "0.25×"
    browser.find_element(By.ID, "play-button").click()
    assert browser.find_element(By.ID, "play-button").text == "Pause"
    browser.find_element(By.ID, "play-button").click()
    assert browser.find_element(By.ID, "play-button").text == "Play"
    assert text_at(browser, "step-count") == "0 / 1"

    speed.send_keys(Keys.END)
    assert text_at(browser, "speed-value") == "2×"
    browser.find_element(By.ID, "play-button").click()
    WebDriverWait(browser, 5).until(
        lambda driver: driver.find_element(By.ID, "step-count").text == "1 / 1"
    )
    assert text_at(browser, "status-badge") == "Complete"


@pytest.mark.parametrize("page_name", ("bfs.html", "astar.html"))
def test_puzzle_rejects_invalid_boards_and_clears_stale_solution(
    browser, site_root: Path, page_name: str
) -> None:
    open_puzzle(browser, site_root, page_name)
    set_configuration(browser, "123456788")
    browser.find_element(By.ID, "solve-button").click()
    assert text_at(browser, "status-badge") == "Needs attention"
    assert "exactly once" in text_at(browser, "status-message")
    assert not browser.find_element(By.ID, "next-button").is_enabled()

    set_configuration(browser, "123456870")
    browser.find_element(By.ID, "solve-button").click()
    assert "cannot reach the goal" in text_at(browser, "status-message")

    set_configuration(browser, "123456708")
    browser.find_element(By.ID, "solve-button").click()
    WebDriverWait(browser, 12).until(
        lambda driver: driver.find_element(By.ID, "next-button").is_enabled()
    )
    browser.find_elements(By.CSS_SELECTOR, "#configuration-grid input")[-1].clear()
    assert not browser.find_element(By.ID, "next-button").is_enabled()
    assert text_at(browser, "step-count") == "0 / —"
