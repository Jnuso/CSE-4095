"""Exercise the JavaScript shipped in base/demos through Node from pytest.

These tests read the published copies. They do not import or modify the
original Assignment folders, and they do not need a web server or browser.
"""

from pathlib import Path
import shutil
import subprocess

import pytest


DEMOS = Path(__file__).resolve().parents[1] / "demos"
EXTERNAL_SCRIPTS = tuple(sorted(DEMOS.rglob("*.js")))
INLINE_SCRIPT_PAGES = (
    DEMOS / "assignment-2" / "index.html",
    DEMOS / "assignment-4" / "index.html",
    DEMOS / "assignment-5" / "astar.html",
    DEMOS / "assignment-5" / "bfs.html",
)


def run_node(script: str, *paths: Path, timeout: int = 90) -> None:
    """Run assertions against demo JavaScript and show Node errors on failure."""
    node = shutil.which("node")
    if node is None:
        pytest.fail("Node.js is required to execute the published JavaScript tests")
    completed = subprocess.run(
        [node, "-e", script, *map(str, paths)],
        cwd=DEMOS.parent,
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
    )
    assert completed.returncode == 0, completed.stdout + completed.stderr


@pytest.mark.parametrize(
    "path", EXTERNAL_SCRIPTS, ids=lambda path: str(path.relative_to(DEMOS))
)
def test_external_javascript_compiles(path: Path) -> None:
    run_node(
        "const fs=require('node:fs'); const vm=require('node:vm');"
        "new vm.Script(fs.readFileSync(process.argv[1], 'utf8'));",
        path,
    )


@pytest.mark.parametrize(
    "path", INLINE_SCRIPT_PAGES, ids=lambda path: str(path.relative_to(DEMOS))
)
def test_inline_javascript_compiles(path: Path) -> None:
    script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(process.argv[1], 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1]).filter(source => source.trim());
assert(scripts.length > 0, 'No inline JavaScript found');
for (const source of scripts) new vm.Script(source);
"""
    run_node(script, path)


def test_checker_swap_frames_reach_the_goal_with_adjacent_moves() -> None:
    script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync(process.argv[1], 'utf8');
const start = source.indexOf('function buildRecursiveSolution');
const end = source.indexOf('function getValidCheckerCount');
assert(start >= 0 && end > start);
const build = new Function(source.slice(start, end) + '\nreturn buildRecursiveSolution;')();
for (const n of [1, 2, 5, 20]) {
  const frames = build(n);
  assert.equal(frames.length, 1 + n * (n - 1) / 2);
  assert.deepEqual(frames[0].state, [...Array(n).fill(0), ...Array(n).fill(1)]);
  assert.deepEqual(frames.at(-1).state, Array.from({length: 2 * n}, (_, i) => i % 2));
  for (let i = 1; i < frames.length; i++) {
    const previous = frames[i - 1].state;
    const current = frames[i].state;
    const {leftIndex, rightIndex} = frames[i];
    assert.equal(frames[i].number, i);
    assert.equal(rightIndex, leftIndex + 1);
    assert.equal(previous[leftIndex], 0);
    assert.equal(previous[rightIndex], 1);
    const expected = [...previous];
    [expected[leftIndex], expected[rightIndex]] = [expected[rightIndex], expected[leftIndex]];
    assert.deepEqual(current, expected);
  }
}
"""
    run_node(script, DEMOS / "assignment-1" / "script.js")


def test_expression_visualizer_evaluates_and_rejects_invalid_input() -> None:
    script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync(process.argv[1], 'utf8');
const start = html.indexOf('function precedence');
const end = html.indexOf('function renderTokens');
assert(start >= 0 && end > start);
const {tokenize, buildStates} = new Function(
  html.slice(start, end) + '\nreturn {tokenize, buildStates};'
)();
function evaluate(expression) {
  const states = buildStates(tokenize(expression));
  assert.equal(states[0].finished, false);
  assert.equal(states.at(-1).finished, true);
  return states.at(-1).result;
}
assert.equal(evaluate('3 + 4 * 2'), 11);
assert.equal(evaluate('-(3 + 4) * 2'), -14);
assert.equal(evaluate('8 / -2'), -4);
assert.equal(evaluate('--3'), 3);
for (const expression of ['2(3)', '3 +', '8 / 0', '(2 + 3', '']) {
  assert.throws(() => evaluate(expression), Error, expression);
}
"""
    run_node(script, DEMOS / "assignment-2" / "index.html")


def test_card24_checks_cards_and_finds_exact_solutions() -> None:
    script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(process.argv[1], 'utf8');
const match = html.match(/<script\b[^>]*id="card24-script"[^>]*>([\s\S]*?)<\/script>/i);
assert(match, 'Card 24 script is missing');
const sandbox = {location: {hash: '#test'}};
vm.runInNewContext(match[1], sandbox);
const api = sandbox.__card24Test;
assert(api, 'Card 24 test API is missing');
assert.equal(api.checkAnswer('8 / (3 - 8 / 3)', [8, 3, 8, 3]).status, 'correct');
assert.equal(api.checkAnswer('1 + 2 + 3 + 4', [1, 2, 3, 4]).status, 'incorrect');
assert.equal(api.checkAnswer('1 + 2 + 3 + 3', [1, 2, 3, 4]).status, 'wrong-cards');
assert.equal(api.checkAnswer('1 / 0 + 2 + 3', [1, 0, 2, 3]).status, 'invalid');
assert.equal(api.findSolution([1, 1, 1, 1]), null);
const hand = [1, 3, 4, 6];
const solution = api.findSolution(hand);
assert.equal(typeof solution, 'string');
assert.equal(api.checkAnswer(solution, hand).status, 'correct');
"""
    run_node(script, DEMOS / "assignment-4" / "index.html")


def test_bfs_demo_finds_shortest_paths() -> None:
    script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync(process.argv[1], 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const constants = source.slice(source.indexOf('const DEFAULT_STATE'), source.indexOf('const board'));
const logic = source.slice(source.indexOf('function getNeighborStates'), source.indexOf('function renderBoard'));
const harness = `${constants}
let searchVersion = 0;
const statesExpanded = {}, statesDiscovered = {}, statusMessage = {};
function requestAnimationFrame(callback) { callback(); }
${logic}
return Promise.all([
  breadthFirstSearch(GOAL_STATE, 0),
  breadthFirstSearch('123456708', 0),
  breadthFirstSearch(DEFAULT_STATE, 0)
]);`;
new Function(harness)().then(([solved, oneMove, defaultCase]) => {
  assert.deepEqual(solved.path, ['123456780']);
  assert.deepEqual(oneMove.path, ['123456708', '123456780']);
  assert.equal(defaultCase.path.length, 31);
  assert.equal(defaultCase.path.at(-1), '123456780');
  assert.equal(defaultCase.expanded, 181392);
  assert.equal(defaultCase.discovered, 181440);
}).catch(error => { console.error(error); process.exitCode = 1; });
"""
    run_node(script, DEMOS / "assignment-5" / "bfs.html")


def test_astar_demo_finds_optimal_path_and_valid_frames() -> None:
    script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync(process.argv[1], 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const constants = source.slice(source.indexOf('const DEFAULT_STATE'), source.indexOf('// --- A* search logic ---'));
const logic = source.slice(source.indexOf('// --- A* search logic ---'), source.indexOf('// --- Interface rendering ---'));
const harness = `${constants}
${logic}
function getSearchVersion() { return 0; }
return Promise.all([
  aStarSearch(GOAL_STATE, 0, () => {}, async () => {}),
  aStarSearch('123456708', 0, () => {}, async () => {}),
  aStarSearch(DEFAULT_STATE, 0, () => {}, async () => {})
]);`;
new Function(harness)().then(([solved, oneMove, defaultCase]) => {
  assert.deepEqual(solved.path, ['123456780']);
  assert.deepEqual(oneMove.path, ['123456708', '123456780']);
  assert.equal(defaultCase.path.length, 31);
  assert.equal(defaultCase.path.at(-1), '123456780');
  assert.equal(defaultCase.expanded, 7329);
  assert.equal(defaultCase.discovered, 10895);
  assert.equal(defaultCase.frames.length, defaultCase.path.length);
  assert(defaultCase.frames.every(frame => frame && frame.f === frame.g + frame.h));
}).catch(error => { console.error(error); process.exitCode = 1; });
"""
    run_node(script, DEMOS / "assignment-5" / "astar.html")


def test_chopsticks_demo_rules_and_ai_agree() -> None:
    script = r"""
const assert = require('node:assert/strict');
const game = require(process.argv[1]);
const ai = require(process.argv[2]);
assert.deepEqual(game.INITIAL_STATE, [[1, 1], [1, 1], 0]);
assert.equal(game.getResult(game.INITIAL_STATE), null);
assert.equal(game.getResult([[1, 1], [1, 1], 20]), 'tie');
const moves = game.legalMoves(game.INITIAL_STATE);
assert(moves.some(move => move.kind === 'attack'));
assert(moves.some(move => move.kind === 'split'));
assert(moves.every(move => move.nextState[2] === 1));
const table = ai.bestMoveDP(6);
const best = ai.bestMove(game.INITIAL_STATE, table);
assert(best);
assert(moves.some(move => game.stateKey(move.nextState) === game.stateKey(best.nextState)));
const comparison = ai.compareSearch(6);
assert.equal(comparison.depth, 6);
assert.equal(comparison.dpRows, table.size);
assert(comparison.recursiveVisits >= comparison.distinctReachable);
"""
    run_node(
        script,
        DEMOS / "assignment-6" / "game.js",
        DEMOS / "assignment-6" / "ai.js",
    )
