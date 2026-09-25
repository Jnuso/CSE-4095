"""Selenium checks for navigation across the published, server-free site."""

import os
from pathlib import Path
from urllib.parse import unquote, urlsplit

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as conditions
from selenium.webdriver.support.ui import WebDriverWait


PROJECT_HEADINGS = (
    "Recursive Checker Swap",
    "Two-Stack Expression Evaluator",
    "Benford’s Law Experiments",
    "Card Game 24",
    "8-Puzzle Search",
    "Chopsticks AI",
    "Student Habits Dataset",
)
DEMO_PAGES = (
    ("demos/assignment-1/index.html", "Recursive Checker Swap"),
    ("demos/assignment-2/index.html", "Two-Stack Expression Evaluator"),
    ("demos/assignment-4/index.html", "Card Game 24"),
    ("demos/assignment-5/astar.html", "Ready to solve"),
    ("demos/assignment-5/bfs.html", "Ready to solve"),
    ("demos/assignment-6/index.html", "Think ahead."),
)
PAGE_CASES = (
    ("index.html", "Big ideas."),
    *(
        (f"projects/assignment-{number}/index.html", heading)
        for number, heading in enumerate(PROJECT_HEADINGS, start=1)
    ),
    *DEMO_PAGES,
)


def test_browser_cases_cover_every_published_html_file(site_root):
    published = {
        page.relative_to(site_root).as_posix()
        for page in site_root.glob("*.html")
    }
    published.update(
        page.relative_to(site_root).as_posix()
        for root in (site_root / "projects", site_root / "demos")
        for page in root.rglob("*.html")
    )
    assert published == {relative_path for relative_path, _ in PAGE_CASES}


def project_path(site_root: Path, number: int) -> Path:
    return site_root / "projects" / f"assignment-{number}" / "index.html"


def same_local_file(actual_url: str, target: Path) -> bool:
    """Compare file URLs without relying on browser percent-encoding choices."""
    actual = urlsplit(actual_url)
    expected = urlsplit(target.as_uri())
    actual_path = unquote(actual.path)
    expected_path = unquote(expected.path)
    if os.name == "nt":
        actual_path = actual_path.casefold()
        expected_path = expected_path.casefold()
    return (
        actual.scheme == expected.scheme
        and actual.netloc == expected.netloc
        and actual_path == expected_path
    )


def assert_arrived(browser, target: Path, heading: str, fragment: str = "") -> None:
    """Wait for an actual navigation and confirm the destination page rendered."""
    WebDriverWait(browser, 15).until(
        lambda driver: same_local_file(driver.current_url, target)
        and urlsplit(driver.current_url).fragment == fragment
    )
    page_heading = WebDriverWait(browser, 15).until(
        conditions.visibility_of_element_located((By.CSS_SELECTOR, "h1"))
    )
    assert heading in page_heading.text


def open_page(browser, target: Path, heading: str) -> None:
    browser.get(target.as_uri())
    assert_arrived(browser, target, heading)


@pytest.mark.parametrize(("relative_path", "heading"), PAGE_CASES)
def test_every_published_page_loads(browser, site_root, relative_path, heading):
    open_page(browser, site_root / relative_path, heading)
    assert browser.title.strip()


@pytest.mark.parametrize("number", range(1, 8))
def test_project_card_opens_its_detail_page(browser, site_root, number):
    open_page(browser, site_root / "index.html", "Big ideas.")
    browser.find_element(
        By.CSS_SELECTOR,
        f'a.project-card[href="projects/assignment-{number}/index.html"]',
    ).click()
    assert_arrived(browser, project_path(site_root, number), PROJECT_HEADINGS[number - 1])


@pytest.mark.parametrize(
    ("selector", "fragment"),
    (
        ('.top-nav a[href="#projects"]', "projects"),
        ('.top-nav a[href="#about"]', "about"),
        ('.hero a.button[href="#projects"]', "projects"),
        ('.site-footer a[href="#main"]', "main"),
    ),
)
def test_home_anchor_controls(browser, site_root, selector, fragment):
    home = site_root / "index.html"
    open_page(browser, home, "Big ideas.")
    browser.find_element(By.CSS_SELECTOR, selector).click()
    assert_arrived(browser, home, "Big ideas.", fragment)
    assert browser.find_element(By.ID, fragment).is_displayed()


def test_keyboard_skip_link_reaches_main_content(browser, site_root):
    home = site_root / "index.html"
    open_page(browser, home, "Big ideas.")
    skip_link = browser.find_element(By.CSS_SELECTOR, "a.skip-link")
    browser.execute_script("arguments[0].focus()", skip_link)
    skip_link.send_keys(Keys.ENTER)
    assert_arrived(browser, home, "Big ideas.", "main")


def test_home_brand_link_clears_section_fragment(browser, site_root):
    home = site_root / "index.html"
    browser.get(f"{home.as_uri()}#about")
    browser.find_element(By.CSS_SELECTOR, "a.brand").click()
    assert_arrived(browser, home, "Big ideas.")


@pytest.mark.parametrize("number", range(1, 8))
def test_detail_keyboard_skip_link_reaches_main(browser, site_root, number):
    detail = project_path(site_root, number)
    open_page(browser, detail, PROJECT_HEADINGS[number - 1])
    skip_link = browser.find_element(By.CSS_SELECTOR, "a.skip-link")
    browser.execute_script("arguments[0].focus()", skip_link)
    skip_link.send_keys(Keys.ENTER)
    assert_arrived(browser, detail, PROJECT_HEADINGS[number - 1], "main")


@pytest.mark.parametrize("number", range(1, 8))
@pytest.mark.parametrize(
    ("selector", "fragment"),
    (
        ("a.brand", ""),
        ("a.back-link", "projects"),
        ('.top-nav a[href$="#projects"]', "projects"),
        ('.top-nav a[href$="#about"]', "about"),
        (".site-footer a", ""),
    ),
)
def test_detail_archive_navigation(browser, site_root, number, selector, fragment):
    open_page(browser, project_path(site_root, number), PROJECT_HEADINGS[number - 1])
    browser.find_element(By.CSS_SELECTOR, selector).click()
    assert_arrived(browser, site_root / "index.html", "Big ideas.", fragment)


@pytest.mark.parametrize("number", range(1, 8))
@pytest.mark.parametrize("side", ("previous", "next"))
def test_adjacent_project_links(browser, site_root, number, side):
    open_page(browser, project_path(site_root, number), PROJECT_HEADINGS[number - 1])
    position = "first-child" if side == "previous" else "last-child"
    browser.find_element(
        By.CSS_SELECTOR, f"nav.project-pagination a:{position}"
    ).click()
    neighbor = number + (-1 if side == "previous" else 1)
    if 1 <= neighbor <= 7:
        assert_arrived(browser, project_path(site_root, neighbor), PROJECT_HEADINGS[neighbor - 1])
    else:
        assert_arrived(browser, site_root / "index.html", "Big ideas.", "projects")


@pytest.mark.parametrize(
    "case",
    (
        (1, "a.button", "demos/assignment-1/index.html", "Recursive Checker Swap"),
        (2, "a.button", "demos/assignment-2/index.html", "Two-Stack Expression Evaluator"),
        (4, "a.button", "demos/assignment-4/index.html", "Card Game 24"),
        (5, "a.button.button-dark", "demos/assignment-5/astar.html", "Ready to solve"),
        (5, "a.button.button-light", "demos/assignment-5/bfs.html", "Ready to solve"),
        (6, "a.button", "demos/assignment-6/index.html", "Think ahead."),
    ),
)
def test_detail_demo_cta(browser, site_root, case):
    number, selector, demo_path, heading = case
    open_page(browser, project_path(site_root, number), PROJECT_HEADINGS[number - 1])
    browser.find_element(By.CSS_SELECTOR, selector).click()
    assert_arrived(browser, site_root / demo_path, heading)


@pytest.mark.parametrize(("demo_path", "heading"), DEMO_PAGES)
def test_demo_return_link_opens_archive(browser, site_root, demo_path, heading):
    open_page(browser, site_root / demo_path, heading)
    browser.find_element(By.CSS_SELECTOR, "nav.cse4095-return-bar a").click()
    assert_arrived(browser, site_root / "index.html", "Big ideas.")
