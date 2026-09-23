"""Real-browser integration tests for the Chopsticks web application.

Run from the Assignment 6 folder with:

    python -m pytest -q test_web_selenium.py

The suite serves the static project on loopback and drives Chrome through
Selenium. It skips cleanly when Selenium, Chrome, or a compatible driver is
unavailable so the dependency-free rule-engine tests remain portable.
"""

from __future__ import annotations

import contextlib
import os
import sys
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import pytest

pytest.importorskip("selenium", reason="Selenium is optional for browser integration tests")

from selenium import webdriver
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait


PROJECT_DIRECTORY = Path(__file__).resolve().parent


class QuietStaticHandler(SimpleHTTPRequestHandler):
    """Serve project files without adding one console line per request."""

    def log_message(self, _format: str, *_args: object) -> None:
        return


class QuietThreadingHTTPServer(ThreadingHTTPServer):
    """Ignore browser socket resets while still reporting unexpected errors."""

    def handle_error(self, request, client_address) -> None:
        error = sys.exc_info()[1]
        if isinstance(error, (BrokenPipeError, ConnectionAbortedError, ConnectionResetError)):
            return
        super().handle_error(request, client_address)


@pytest.fixture(scope="session")
def web_server() -> str:
    handler = partial(QuietStaticHandler, directory=str(PROJECT_DIRECTORY))
    server = QuietThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}/index.html"
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


def chrome_options() -> Options:
    options = Options()
    browser_binary = os.environ.get("SELENIUM_BROWSER_BINARY")
    if browser_binary:
        options.binary_location = browser_binary
    if os.environ.get("SELENIUM_HEADLESS", "1") != "0":
        options.add_argument("--headless=new")
    for argument in (
        "--disable-gpu",
        "--disable-extensions",
        "--disable-background-networking",
        "--no-first-run",
        "--no-default-browser-check",
        "--window-size=1440,1100",
    ):
        options.add_argument(argument)
    options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    return options


@pytest.fixture(scope="session")
def browser(web_server: str):
    del web_server  # The dependency ensures the local server starts first.
    driver_path = os.environ.get("SELENIUM_DRIVER_PATH")
    service = Service(executable_path=driver_path) if driver_path else Service()
    try:
        driver = webdriver.Chrome(service=service, options=chrome_options())
    except WebDriverException as error:
        summary = str(error).splitlines()[0] or type(error).__name__
        if os.environ.get("SELENIUM_REQUIRED") == "1":
            pytest.fail(f"Chrome WebDriver could not start: {summary}", pytrace=False)
        pytest.skip(f"Chrome WebDriver could not start: {summary}")
    driver.set_page_load_timeout(15)
    driver.set_script_timeout(10)
    try:
        yield driver
    finally:
        with contextlib.suppress(WebDriverException):
            driver.quit()


@pytest.fixture
def page(browser, web_server: str):
    # Reduced motion makes gameplay tests fast and deterministic. One dedicated
    # test switches back to normal motion to verify the tap animation itself.
    browser.execute_cdp_cmd(
        "Emulation.setEmulatedMedia",
        {"features": [{"name": "prefers-reduced-motion", "value": "reduce"}]},
    )
    browser.set_window_size(1440, 1100)
    browser.get(web_server)
    WebDriverWait(browser, 10).until(
        lambda driver: driver.find_element(By.ID, "dp-table-rows").text == "13,125"
    )
    return browser


def wait_for_level(driver, expected: int, timeout: float = 5) -> None:
    WebDriverWait(driver, timeout).until(
        lambda current: current.find_element(By.ID, "dp-current-level").text
        == f"{expected} / 20"
    )


def assert_no_severe_console_errors(driver) -> None:
    severe = [
        record["message"]
        for record in driver.get_log("browser")
        if record.get("level") == "SEVERE"
    ]
    assert severe == []


def test_page_loads_with_initial_game_and_dp_state(page) -> None:
    assert page.title == "Chopsticks · Assignment 6"
    assert page.find_element(By.ID, "status-title").text == "Your move · Player A"
    assert page.find_element(By.ID, "turn-count").text == "0 moves played"
    assert page.find_element(By.ID, "remaining-moves").text == "20 moves remaining"
    assert page.find_element(By.ID, "dp-current-level").text == "0 / 20"
    assert page.find_element(By.ID, "dp-active-role").text == "A · MAX"

    for element_id in (
        "hand-a-left",
        "hand-a-right",
        "hand-b-left",
        "hand-b-right",
    ):
        hand = page.find_element(By.ID, element_id)
        assert hand.get_attribute("data-count") == "1"
        assert "1 finger" in hand.get_attribute("aria-label")
    assert_no_severe_console_errors(page)


def test_game_setup_switches_modes_and_controls_autoplay(page) -> None:
    page.find_element(By.ID, "mode-auto").click()
    assert page.find_element(By.ID, "auto-controls").is_displayed()
    assert not page.find_element(By.ID, "player-controls").is_displayed()
    assert page.find_element(By.ID, "status-title").text == "Autonomous game paused"

    page.execute_script(
        "const speed = document.getElementById('auto-speed');"
        "speed.value = 250;"
        "speed.dispatchEvent(new Event('input', { bubbles: true }));"
    )
    assert page.find_element(By.ID, "auto-speed-label").text == "0.3 s / move"

    play_button = page.find_element(By.ID, "auto-play")
    play_button.click()
    WebDriverWait(page, 2).until(lambda driver: play_button.text == "Pause AI vs AI")
    play_button.click()
    WebDriverWait(page, 2).until(lambda driver: play_button.text == "Start AI vs AI")
    assert page.find_element(By.ID, "status-title").text == "Autonomous game paused"
    assert_no_severe_console_errors(page)


def test_single_ai_step_animates_exact_hands_and_commits_one_move(page, web_server) -> None:
    page.execute_cdp_cmd(
        "Emulation.setEmulatedMedia",
        {"features": [{"name": "prefers-reduced-motion", "value": "no-preference"}]},
    )
    page.get(web_server)
    WebDriverWait(page, 10).until(
        lambda driver: driver.find_element(By.ID, "dp-table-rows").text == "13,125"
    )
    page.find_element(By.ID, "mode-auto").click()
    page.find_element(By.ID, "auto-step").click()

    source = page.find_element(By.ID, "hand-a-left")
    target = page.find_element(By.ID, "hand-b-left")
    WebDriverWait(page, 1).until(
        lambda _driver: "is-tapping" in source.get_attribute("class")
        and "is-receiving-tap" in target.get_attribute("class")
    )
    wait_for_level(page, 1, timeout=3)
    assert source.get_attribute("class").find("is-tapping") == -1
    assert target.get_attribute("data-count") == "2"
    assert len(page.find_elements(By.CSS_SELECTOR, "#history-list > li")) == 1
    assert "Turn 1" in page.find_element(By.ID, "history-list").text
    assert_no_severe_console_errors(page)


def test_restart_restores_every_visible_game_surface(page) -> None:
    page.find_element(By.ID, "mode-auto").click()
    page.find_element(By.ID, "auto-step").click()
    wait_for_level(page, 1)
    page.find_element(By.ID, "restart-button").click()

    wait_for_level(page, 0)
    assert page.find_element(By.ID, "turn-count").text == "0 moves played"
    assert "No moves yet" in page.find_element(By.ID, "history-list").text
    assert len(page.find_elements(By.CSS_SELECTOR, "#tree-played-path .tree-route-node")) == 1
    for element_id in (
        "hand-a-left",
        "hand-a-right",
        "hand-b-left",
        "hand-b-right",
    ):
        assert page.find_element(By.ID, element_id).get_attribute("data-count") == "1"
    assert_no_severe_console_errors(page)


def test_analysis_disclosure_and_tree_preview_do_not_play_a_move(page) -> None:
    toggle = page.find_element(By.ID, "ai-toggle")
    toggle.click()
    assert toggle.get_attribute("aria-expanded") == "false"
    assert not page.find_element(By.ID, "ai-analysis-content").is_displayed()
    toggle.click()
    assert toggle.get_attribute("aria-expanded") == "true"

    page.find_element(By.CSS_SELECTOR, "#ai-advanced-details > summary").click()
    WebDriverWait(page, 2).until(
        lambda driver: driver.find_element(By.ID, "ai-advanced-details").get_attribute("open")
        is not None
    )
    current = page.find_element(By.ID, "graph-current")
    state_before = current.get_attribute("data-tree-node-key")
    branch = page.find_element(By.CSS_SELECTOR, "#graph-choices button.tree-node")
    branch.click()

    assert branch.get_attribute("aria-pressed") == "true"
    assert "Preview only" in page.find_element(By.ID, "tree-impact").text
    assert current.get_attribute("data-tree-node-key") == state_before
    assert page.find_element(By.ID, "turn-count").text == "0 moves played"
    assert "No moves yet" in page.find_element(By.ID, "history-list").text
    assert page.find_elements(By.CSS_SELECTOR, "#tree-replies .tree-node")
    assert_no_severe_console_errors(page)


def test_ai_vs_ai_can_pause_then_step_until_the_depth_20_result(page) -> None:
    page.find_element(By.ID, "mode-auto").click()
    page.execute_script(
        "const speed = document.getElementById('auto-speed');"
        "speed.value = 250;"
        "speed.dispatchEvent(new Event('input', { bubbles: true }));"
    )
    play_button = page.find_element(By.ID, "auto-play")
    play_button.click()
    WebDriverWait(page, 3).until(
        lambda driver: int(driver.find_element(By.ID, "dp-current-level").text.split()[0]) >= 2
    )
    play_button.click()
    WebDriverWait(page, 2).until(lambda _driver: play_button.text == "Start AI vs AI")

    level = int(page.find_element(By.ID, "dp-current-level").text.split()[0])
    step_button = page.find_element(By.ID, "auto-step")
    while level < 20 and step_button.is_enabled():
        step_button.click()
        level += 1
        wait_for_level(page, level)

    assert level == 20
    assert page.find_element(By.ID, "status-title").text == "Maximum depth reached · Tie"
    assert page.find_element(By.ID, "turn-count").text == "20 moves played"
    assert page.find_element(By.ID, "dp-active-role").text == "Game complete"
    assert len(page.find_elements(By.CSS_SELECTOR, "#history-list > li")) == 20
    assert not step_button.is_enabled()
    assert_no_severe_console_errors(page)


def test_mobile_layout_keeps_hands_visible_without_page_overflow(page) -> None:
    # Windows Chrome may enforce a minimum outer-window width even in headless
    # mode. Device emulation controls the CSS viewport directly and therefore
    # tests the intended 390-pixel breakpoint consistently on every platform.
    page.execute_cdp_cmd(
        "Emulation.setDeviceMetricsOverride",
        {
            "width": 390,
            "height": 844,
            "deviceScaleFactor": 1,
            "mobile": True,
        },
    )
    try:
        WebDriverWait(page, 2).until(
            lambda driver: driver.execute_script("return window.innerWidth") == 390
        )
        viewport_width = page.execute_script("return document.documentElement.clientWidth")
        document_width = page.execute_script("return document.documentElement.scrollWidth")
        assert viewport_width == 390
        assert document_width <= viewport_width + 1

        for element_id in ("hand-a-left", "hand-a-right", "hand-b-left", "hand-b-right"):
            bounds = page.find_element(By.ID, element_id).rect
            assert bounds["width"] >= 80
            assert bounds["x"] >= 0
            assert bounds["x"] + bounds["width"] <= viewport_width + 1
        assert_no_severe_console_errors(page)
    finally:
        page.execute_cdp_cmd("Emulation.clearDeviceMetricsOverride", {})
