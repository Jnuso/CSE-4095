"""Verify the committed demo copies match their sources and build rules."""

from __future__ import annotations

from pathlib import Path
import re
import shutil
import subprocess

import pytest


BASE = Path(__file__).resolve().parents[1]
REPOSITORY = BASE.parent
BUILD = BASE / "build.mjs"
SOURCE_PAIRS = re.findall(
    r"\['(Assignment \d+/[^']+)', '([^']+)'\]",
    BUILD.read_text(encoding="utf-8"),
)
STYLE_LINKS = (
    '  <link rel="stylesheet" href="../../assets/demo-return.css">\n'
    '  <link rel="stylesheet" href="../../assets/demo-theme.css">\n'
    '  <link rel="icon" type="image/svg+xml" sizes="any" href="../../assets/favicon.svg">\n'
)


def original_html_from_published(published: str, source: str) -> str:
    """Remove only the archive decorations added by build.mjs."""
    published, marker_count = re.subn(
        r' data-cse4095-demo="[^"]+" data-cse4095-view="[^"]+"',
        "",
        published,
        count=1,
    )
    assert marker_count == 1
    assert published.count(STYLE_LINKS) == 1
    published = published.replace(STYLE_LINKS, "", 1)
    published, nav_count = re.subn(
        r'  <nav class="cse4095-return-bar"[^>]*>.*?</nav>\n',
        "",
        published,
        count=1,
    )
    assert nav_count == 1

    source_theme = re.search(
        r'<meta\s+name="theme-color"\s+content="[^"]+"\s*/?>',
        source,
        flags=re.IGNORECASE,
    )
    if source_theme:
        published, theme_count = re.subn(
            r'<meta\s+name="theme-color"\s+content="[^"]+"\s*/?>',
            lambda _: source_theme.group(0),
            published,
            count=1,
            flags=re.IGNORECASE,
        )
        assert theme_count == 1
    else:
        published, theme_count = re.subn(
            r'\n  <meta name="theme-color" content="#0d0d0f">',
            "",
            published,
            count=1,
        )
        assert theme_count == 1
    return published


def test_build_script_compiles() -> None:
    node = shutil.which("node")
    assert node is not None, "Node.js is required to check build.mjs"
    completed = subprocess.run(
        [node, "--check", str(BUILD)],
        capture_output=True,
        text=True,
        timeout=15,
    )
    assert completed.returncode == 0, completed.stdout + completed.stderr


@pytest.mark.parametrize(
    ("relative_source", "destination_name"),
    SOURCE_PAIRS,
    ids=[source for source, _ in SOURCE_PAIRS],
)
def test_published_demo_matches_its_source(relative_source: str, destination_name: str) -> None:
    source = REPOSITORY / relative_source
    assignment_number = re.match(r"Assignment (\d+)/", relative_source)
    assert assignment_number is not None
    published = (
        BASE / "demos" / f"assignment-{assignment_number.group(1)}" / destination_name
    )
    assert source.is_file() and published.is_file()

    if source.suffix != ".html":
        assert published.read_bytes() == source.read_bytes()
        return

    original = source.read_text(encoding="utf-8")
    built = published.read_text(encoding="utf-8")
    assert f'data-cse4095-demo="assignment-{assignment_number.group(1)}"' in built
    assert f'data-cse4095-view="{Path(destination_name).stem}"' in built
    assert '<meta name="theme-color" content="#0d0d0f">' in built
    assert 'href="../../index.html"' in built
    assert 'href="../../assets/favicon.svg"' in built
    assert original_html_from_published(built, original) == original


def test_demo_manifest_is_not_empty() -> None:
    assert len(SOURCE_PAIRS) >= 6, "No demo source files found in build.mjs"


def test_demo_manifest_is_unique_and_matches_published_files() -> None:
    """Catch stale demo assets and accidental path escapes in the build list."""
    sources: list[Path] = []
    destinations: list[Path] = []
    demos_root = (BASE / "demos").resolve()

    for relative_source, destination_name in SOURCE_PAIRS:
        assignment_number = re.match(r"Assignment (\d+)/", relative_source)
        assert assignment_number is not None
        assignment_directory = (
            REPOSITORY / f"Assignment {assignment_number.group(1)}"
        ).resolve()
        source = (REPOSITORY / relative_source).resolve()
        assert source.is_relative_to(assignment_directory), relative_source
        assert source.is_file(), relative_source
        sources.append(source)

        demo_directory = (
            demos_root / f"assignment-{assignment_number.group(1)}"
        ).resolve()
        destination = (demo_directory / destination_name).resolve()
        assert destination.parent == demo_directory, destination_name
        destinations.append(destination)

    assert len(sources) == len(set(sources)), "Duplicate source in demo manifest"
    assert len(destinations) == len(set(destinations)), "Duplicate demo destination"
    published_files = {path.resolve() for path in demos_root.rglob("*") if path.is_file()}
    assert published_files == set(destinations), (
        f"Stale or missing files in base/demos/: "
        f"extra={published_files - set(destinations)}, "
        f"missing={set(destinations) - published_files}"
    )
