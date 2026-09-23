"""Static and JavaScript runtime tests for both HTML visualizers."""

from html.parser import HTMLParser
from pathlib import Path
import re
import subprocess

import pytest


PROJECT_DIRECTORY = Path(__file__).resolve().parent
BFS_HTML = PROJECT_DIRECTORY / "bfs.html"
ASTAR_HTML = PROJECT_DIRECTORY / "astar.html"


class VisualizerParser(HTMLParser):
    """Collect IDs, controls, configuration inputs, and external assets."""

    def __init__(self):
        super().__init__()
        self.ids = []
        self.buttons = []
        self.configuration_inputs = 0
        self.remote_assets = []

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)

        if "id" in attributes:
            self.ids.append(attributes["id"])

        if tag == "button":
            self.buttons.append(attributes.get("id"))

        classes = set(attributes.get("class", "").split())
        if tag == "input" and ({"configuration-input", "config-input"} & classes):
            self.configuration_inputs += 1

        source = attributes.get("src") or attributes.get("href")
        if source and re.match(r"https?://", source, flags=re.IGNORECASE):
            self.remote_assets.append(source)


@pytest.fixture(params=[BFS_HTML, ASTAR_HTML], ids=["bfs.html", "astar.html"])
def visualizer(request):
    path = request.param
    source = path.read_text(encoding="utf-8")
    parser = VisualizerParser()
    parser.feed(source)
    return path, source, parser


def run_node(script, *arguments):
    """Run a JavaScript assertion script and return its standard output."""
    completed = subprocess.run(
        ["node", "-e", script, *map(str, arguments)],
        check=True,
        capture_output=True,
        text=True,
        timeout=30,
    )
    return completed.stdout.strip()


def test_visualizer_is_a_complete_html_document(visualizer):
    _, source, _ = visualizer

    assert source.lstrip().lower().startswith("<!doctype html>")
    assert "<html" in source.lower()
    assert "<style>" in source
    assert "<script>" in source
    assert source.rstrip().lower().endswith("</html>")


def test_visualizer_has_unique_element_ids(visualizer):
    _, _, parser = visualizer

    assert len(parser.ids) == len(set(parser.ids))


def test_visualizer_has_all_required_controls(visualizer):
    _, _, parser = visualizer
    required_buttons = {
        "solve-button",
        "play-button",
        "previous-button",
        "next-button",
        "reset-button",
    }

    assert required_buttons <= set(parser.buttons)
    assert "speed-slider" in parser.ids
    assert parser.configuration_inputs == 9


def test_visualizer_has_no_remote_dependencies(visualizer):
    _, _, parser = visualizer

    assert parser.remote_assets == []


def test_inline_javascript_compiles(visualizer):
    path, _, _ = visualizer
    script = r"""
const fs = require("fs");
const html = fs.readFileSync(process.argv[1], "utf8");
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (!match) throw new Error("Missing inline script");
new Function(match[1]);
console.log("valid");
"""

    assert run_node(script, path) == "valid"


def test_bfs_browser_algorithm_matches_python_results():
    script = r"""
const fs = require("fs");
const html = fs.readFileSync(process.argv[1], "utf8");
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const constants = source.slice(source.indexOf("const DEFAULT_STATE"), source.indexOf("const board"));
const logic = source.slice(source.indexOf("function getNeighborStates"), source.indexOf("function renderBoard"));
const harness = `${constants}
let searchVersion = 0;
const statesExpanded = {};
const statesDiscovered = {};
const statusMessage = {};
function requestAnimationFrame(callback) { callback(); }
${logic}
return Promise.all([
  breadthFirstSearch(DEFAULT_STATE, 0),
  breadthFirstSearch(GOAL_STATE, 0),
  breadthFirstSearch("123456708", 0)
]);`;

new Function(harness)().then(([required, solved, oneMove]) => {
  if (required.path.length !== 31 || required.expanded !== 181392 || required.discovered !== 181440) {
    throw new Error("Required-state BFS result mismatch");
  }
  if (solved.path.length !== 1 || solved.expanded !== 0 || solved.discovered !== 1) {
    throw new Error("Solved-state BFS result mismatch");
  }
  if (oneMove.path.length !== 2 || oneMove.path[1] !== "123456780") {
    throw new Error("One-move BFS result mismatch");
  }
  console.log("valid");
}).catch(error => {
  console.error(error);
  process.exit(1);
});
"""

    assert run_node(script, BFS_HTML) == "valid"


def test_astar_browser_algorithm_matches_python_results():
    script = r"""
const fs = require("fs");
const html = fs.readFileSync(process.argv[1], "utf8");
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const constants = source.slice(source.indexOf("const DEFAULT_STATE"), source.indexOf("// --- A* search logic ---"));
const logic = source.slice(source.indexOf("// --- A* search logic ---"), source.indexOf("// --- Interface rendering ---"));
const harness = `${constants}
${logic}
function getSearchVersion() { return 0; }
return Promise.all([
  aStarSearch(DEFAULT_STATE, 0, () => {}, async () => {}),
  aStarSearch(GOAL_STATE, 0, () => {}, async () => {}),
  aStarSearch("123456708", 0, () => {}, async () => {})
]);`;

new Function(harness)().then(([required, solved, oneMove]) => {
  if (required.path.length !== 31 || required.frames.length !== 31 ||
      required.expanded !== 7329 || required.discovered !== 10895) {
    throw new Error("Required-state A* result mismatch");
  }
  if (required.frames.some(frame => !frame || frame.f !== frame.g + frame.h)) {
    throw new Error("Invalid A* visualization frame");
  }
  if (solved.path.length !== 1 || solved.expanded !== 0 || solved.discovered !== 1) {
    throw new Error("Solved-state A* result mismatch");
  }
  if (oneMove.path.length !== 2 || oneMove.path[1] !== "123456780") {
    throw new Error("One-move A* result mismatch");
  }
  console.log("valid");
}).catch(error => {
  console.error(error);
  process.exit(1);
});
"""

    assert run_node(script, ASTAR_HTML) == "valid"


def test_astar_visualizer_has_priority_displays():
    source = ASTAR_HTML.read_text(encoding="utf-8")
    required_ids = {
        "g-value",
        "h-value",
        "f-value",
        "candidate-grid",
        "open-count",
        "state-strip",
    }

    parser = VisualizerParser()
    parser.feed(source)
    assert required_ids <= set(parser.ids)
