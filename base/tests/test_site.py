"""Checks for the published, server-free project archive.

These tests inspect the files Cloudflare Pages publishes in ``base/``. They
use the standard-library HTML parser, as the Assignment 5 visualizer tests do,
and need no browser or web server.
"""

from functools import lru_cache
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

import pytest


SITE = Path(__file__).resolve().parents[1]
HOME = SITE / "index.html"
PROJECT_PAGES = tuple(sorted((SITE / "projects").glob("*/index.html")))
DEMO_PAGES = tuple(sorted((SITE / "demos").rglob("*.html")))
ROOT_PAGES = tuple(SITE.glob("*.html"))
PROJECT_HTML_PAGES = tuple((SITE / "projects").rglob("*.html"))
HTML_PAGES = tuple(sorted({*ROOT_PAGES, *PROJECT_HTML_PAGES, *DEMO_PAGES}))
ORIGINAL_PROJECTS = {
    SITE / "projects" / f"assignment-{number}" / "index.html"
    for number in range(1, 8)
}
PUBLISHED_DEMOS = {
    SITE / "demos" / "assignment-1" / "index.html",
    SITE / "demos" / "assignment-2" / "index.html",
    SITE / "demos" / "assignment-4" / "index.html",
    SITE / "demos" / "assignment-5" / "astar.html",
    SITE / "demos" / "assignment-5" / "bfs.html",
    SITE / "demos" / "assignment-6" / "index.html",
}


class SiteParser(HTMLParser):
    """Collect links, assets, IDs, and navigation from one HTML page."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.references: list[tuple[str, str, str]] = []
        self.anchors: list[dict[str, str]] = []
        self.stylesheets: list[str] = []
        self.icons: list[str] = []
        self.navigation_classes: list[set[str]] = []
        self.html_attributes: dict[str, str] = {}
        self.theme_colors: list[str] = []
        self.doctypes: list[str] = []
        self.structure: list[tuple[str, str]] = []
        self.title_parts: list[str] = []
        self.in_title = False

    def handle_starttag(self, tag: str, attributes: list[tuple[str, str | None]]) -> None:
        values = {name: value or "" for name, value in attributes}
        if tag in {"html", "head", "title", "body", "main"}:
            self.structure.append(("start", tag))
        if tag == "title":
            self.in_title = True
        if "id" in values:
            self.ids.append(values["id"])
        if tag == "html":
            self.html_attributes = values
        if tag == "meta" and values.get("name", "").lower() == "theme-color":
            self.theme_colors.append(values.get("content", ""))
        if tag == "a":
            self.anchors.append(values)
        if tag == "nav":
            self.navigation_classes.append(set(values.get("class", "").split()))
        if tag == "link" and "stylesheet" in values.get("rel", "").split():
            self.stylesheets.append(values.get("href", ""))
        if tag == "link" and "icon" in values.get("rel", "").split():
            self.icons.append(values.get("href", ""))
        for attribute in ("href", "src"):
            if attribute in values:
                self.references.append((tag, attribute, values[attribute]))

    handle_startendtag = handle_starttag

    def handle_endtag(self, tag: str) -> None:
        if tag in {"html", "head", "title", "body", "main"}:
            self.structure.append(("end", tag))
        if tag == "title":
            self.in_title = False

    def handle_decl(self, declaration: str) -> None:
        self.doctypes.append(declaration.lower())

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)


@lru_cache(maxsize=None)
def parsed(path: Path) -> SiteParser:
    parser = SiteParser()
    parser.feed(path.read_text(encoding="utf-8"))
    parser.close()
    return parser


def local_target(page: Path, reference: str) -> tuple[Path, str] | None:
    """Resolve a relative URL exactly as a local HTML file would."""
    parts = urlsplit(reference)
    if parts.scheme or parts.netloc:
        return None
    target = (page.parent / unquote(parts.path)).resolve() if parts.path else page
    return target, unquote(parts.fragment)


def assert_published_reference(page: Path, tag: str, attribute: str, reference: str) -> None:
    """Check the URL as it will be used in a published or local HTML page."""
    assert reference.strip(), f"Empty {attribute} in {page}"
    parts = urlsplit(reference)
    if parts.scheme or parts.netloc:
        if tag == "a":
            is_web_link = parts.scheme in {"http", "https"} and bool(parts.netloc)
            is_email_link = parts.scheme == "mailto" and bool(parts.path)
            assert is_web_link or is_email_link, (
                f"Unsafe or ambiguous hyperlink in {page}: {reference}"
            )
        else:
            assert parts.scheme == "data", (
                f"Remote asset in {page}: {reference}"
            )
        return

    target, fragment = local_target(page, reference)
    assert target.is_relative_to(SITE), f"Reference leaves base/: {page}: {reference}"
    assert target.is_file(), f"Missing file or directory-only link: {page}: {reference}"
    if fragment and target.suffix.lower() == ".html":
        assert fragment in parsed(target).ids, (
            f"Missing fragment #{fragment} in {target}, linked from {page}"
        )


def assert_complete_document(document: SiteParser) -> None:
    """HTMLParser accepts unclosed tags, so check the page's essential skeleton."""
    assert document.doctypes == ["doctype html"]
    assert document.structure == [
        ("start", "html"),
        ("start", "head"),
        ("start", "title"),
        ("end", "title"),
        ("end", "head"),
        ("start", "body"),
        ("start", "main"),
        ("end", "main"),
        ("end", "body"),
        ("end", "html"),
    ]
    assert "".join(document.title_parts).strip(), "HTML title must not be empty"


def links_to_home(page: Path) -> list[dict[str, str]]:
    return [
        anchor
        for anchor in parsed(page).anchors
        if (target := local_target(page, anchor.get("href", ""))) is not None
        and target[0] == HOME
    ]


def test_current_site_pages_are_present_and_discovered() -> None:
    # New assignments may be added later; discovery automatically tests them.
    assert {HOME, *ORIGINAL_PROJECTS, *PUBLISHED_DEMOS} <= set(HTML_PAGES)
    assert len(HTML_PAGES) >= 14


@pytest.mark.parametrize("page", HTML_PAGES, ids=lambda page: str(page.relative_to(SITE)))
def test_html_document_is_complete(page: Path) -> None:
    assert_complete_document(parsed(page))


def test_truncated_html_document_is_rejected() -> None:
    document = SiteParser()
    document.feed(
        "<!doctype html><html><head><title>Example</title></head>"
        "<body><main></main>"
    )
    document.close()
    with pytest.raises(AssertionError):
        assert_complete_document(document)


@pytest.mark.parametrize(
    ("reference", "expected", "fragment"),
    [
        ("#projects", HOME, "projects"),
        (
            "projects/%61ssignment-1/index.html?view=full#main",
            SITE / "projects" / "assignment-1" / "index.html",
            "main",
        ),
        ("assets/favicon.svg", SITE / "assets" / "favicon.svg", ""),
    ],
)
def test_local_target_resolves_encoded_paths_and_fragments(
    reference: str, expected: Path, fragment: str
) -> None:
    assert local_target(HOME, reference) == (expected, fragment)


@pytest.mark.parametrize(
    ("reference", "message"),
    [
        ("javascript:alert(1)", "Unsafe or ambiguous hyperlink"),
        ("data:text/html,hello", "Unsafe or ambiguous hyperlink"),
        ("file:///C:/private/report.html", "Unsafe or ambiguous hyperlink"),
        ("//example.com/remote.html", "Unsafe or ambiguous hyperlink"),
        ("https:///missing-host", "Unsafe or ambiguous hyperlink"),
        ("..%2Foutside.html", "Reference leaves base/"),
        ("projects/assignment-1/", "Missing file or directory-only link"),
        ("#nonexistent-fragment", "Missing fragment"),
    ],
)
def test_invalid_offline_links_are_rejected(reference: str, message: str) -> None:
    with pytest.raises(AssertionError, match=message):
        assert_published_reference(HOME, "a", "href", reference)


@pytest.mark.parametrize("page", HTML_PAGES, ids=lambda page: str(page.relative_to(SITE)))
def test_html_ids_are_unique(page: Path) -> None:
    ids = parsed(page).ids
    assert len(ids) == len(set(ids)), f"Duplicate HTML id in {page}"


@pytest.mark.parametrize("page", HTML_PAGES, ids=lambda page: str(page.relative_to(SITE)))
def test_dark_browser_theme_color(page: Path) -> None:
    assert parsed(page).theme_colors == ["#0d0d0f"]


@pytest.mark.parametrize("page", HTML_PAGES, ids=lambda page: str(page.relative_to(SITE)))
def test_pages_use_shared_archive_icon(page: Path) -> None:
    icons = parsed(page).icons
    assert icons
    icon_targets = [local_target(page, icon) for icon in icons]
    shared_icon = SITE / "assets" / "favicon.svg"
    assert sum(
        target is not None and target[0] == shared_icon for target in icon_targets
    ) == 1
    assert icon_targets[-1][0] == shared_icon


@pytest.mark.parametrize("page", HTML_PAGES, ids=lambda page: str(page.relative_to(SITE)))
def test_local_links_assets_and_fragments_resolve(page: Path) -> None:
    for tag, attribute, reference in parsed(page).references:
        assert_published_reference(page, tag, attribute, reference)


def test_home_cards_cover_every_project_page() -> None:
    cards = [
        anchor
        for anchor in parsed(HOME).anchors
        if "project-card" in anchor.get("class", "").split()
    ]
    card_targets = {
        local_target(HOME, anchor.get("href", ""))[0]
        for anchor in cards
    }
    assert len(cards) == len(card_targets)  # No duplicate project cards.
    assert len(cards) >= 7
    assert card_targets == set(PROJECT_PAGES)


@pytest.mark.parametrize(
    "page", PROJECT_PAGES, ids=lambda page: page.parent.name
)
def test_project_pages_link_back_to_main_page(page: Path) -> None:
    assert links_to_home(page)
    assert any(
        "back-link" in anchor.get("class", "").split()
        for anchor in links_to_home(page)
    )


@pytest.mark.parametrize(
    "page", DEMO_PAGES, ids=lambda page: str(page.relative_to(SITE))
)
def test_demos_have_archive_navigation_and_shared_theme(page: Path) -> None:
    document = parsed(page)
    assert document.html_attributes.get("data-cse4095-demo") == page.parent.name
    assert document.html_attributes.get("data-cse4095-view") == page.stem
    assert sum(
        "cse4095-return-bar" in classes for classes in document.navigation_classes
    ) == 1
    assert links_to_home(page)

    stylesheets = [local_target(page, href)[0] for href in document.stylesheets]
    assert stylesheets.count(SITE / "assets" / "demo-return.css") == 1
    assert stylesheets.count(SITE / "assets" / "demo-theme.css") == 1
    assert stylesheets[-1] == SITE / "assets" / "demo-theme.css"
