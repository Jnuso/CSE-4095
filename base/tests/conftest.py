"""Shared real-browser fixtures for the published, server-free archive."""

from __future__ import annotations

import contextlib
import os
from pathlib import Path

import pytest
from selenium.webdriver import Chrome
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service


@pytest.fixture(scope="session")
def site_root() -> Path:
    """Directory opened directly by the browser and published to Pages."""
    return Path(__file__).resolve().parents[1]


@pytest.fixture(scope="session")
def browser():
    """Drive Chrome with file URLs; CI requires startup to succeed."""
    options = Options()
    if binary := os.environ.get("SELENIUM_BROWSER_BINARY"):
        options.binary_location = binary
    if os.environ.get("SELENIUM_HEADLESS", "1") != "0":
        options.add_argument("--headless=new")
    for argument in (
        "--disable-background-networking",
        "--disable-dev-shm-usage",
        "--disable-extensions",
        "--no-default-browser-check",
        "--no-first-run",
        "--window-size=1440,1100",
    ):
        options.add_argument(argument)
    if os.name != "nt":
        options.add_argument("--no-sandbox")

    driver_path = os.environ.get("SELENIUM_DRIVER_PATH")
    service = Service(executable_path=driver_path) if driver_path else Service()
    try:
        # Pylint misclassifies Selenium's re-exported Chrome class as a module.
        driver = Chrome(service=service, options=options)  # pylint: disable=not-callable
    except (OSError, WebDriverException) as error:
        summary = str(error).splitlines()[0] or type(error).__name__
        message = f"Chrome WebDriver could not start: {summary}"
        if os.environ.get("SELENIUM_REQUIRED") == "1":
            pytest.fail(message, pytrace=False)
        pytest.skip(message)

    driver.set_page_load_timeout(20)
    driver.set_script_timeout(20)
    driver.execute_cdp_cmd(
        "Emulation.setEmulatedMedia",
        {"features": [{"name": "prefers-reduced-motion", "value": "reduce"}]},
    )
    try:
        yield driver
    finally:
        with contextlib.suppress(WebDriverException):
            driver.quit()
