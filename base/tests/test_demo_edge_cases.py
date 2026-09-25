"""Edge cases for the JavaScript published in ``base/demos``.

Node runs the actual published logic. No browser, server, or original assignment
files are needed.
"""

from test_demo_logic import DEMOS, run_node


def test_checker_count_rejects_invalid_input_without_losing_status() -> None:
    script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync(process.argv[1], 'utf8');
const logic = source.slice(source.indexOf('function getValidCheckerCount'),
                           source.indexOf('function prepareSolution'));
const input = {
  value: '', attributes: new Map(),
  setAttribute(key, value) { this.attributes.set(key, value); },
  removeAttribute(key) { this.attributes.delete(key); }
};
const status = {textContent: 'Keep this message'};
const validate = new Function('checkerCountInput', 'statusMessage',
  'MIN_CHECKERS', 'MAX_CHECKERS', `${logic}\nreturn getValidCheckerCount;`)(
    input, status, 1, 20);
for (const [value, expected] of [['1', 1], ['20', 20], [' 4 ', 4]]) {
  input.value = value;
  assert.equal(validate(), expected, value);
  assert.equal(input.attributes.has('aria-invalid'), false, value);
}
for (const value of ['', ' ', '0', '21', '-1', '1.5', 'NaN', 'Infinity', 'abc']) {
  input.value = value;
  assert.equal(validate(false), null, value);
  assert.equal(input.attributes.get('aria-invalid'), 'true', value);
}
assert.equal(status.textContent, 'Keep this message');
input.value = '0';
assert.equal(validate(), null);
assert.match(status.textContent, /whole number from 1 to 20/);
"""
    run_node(script, DEMOS / "assignment-1" / "script.js")


def test_expression_evaluator_operator_order_and_input_boundaries() -> None:
    script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync(process.argv[1], 'utf8');
const source = html.slice(html.indexOf('function precedence'), html.indexOf('function renderTokens'));
const {tokenize, buildStates} = new Function(`${source}\nreturn {tokenize, buildStates};`)();
function evaluate(expression) {
  const snapshots = buildStates(tokenize(expression));
  assert.equal(snapshots[0].numbers.length, 0, 'snapshots must be independent');
  assert.equal(snapshots.at(-1).finished, true);
  return snapshots.at(-1).result;
}
for (const [expression, expected] of [
  ['10 - 3 - 2', 5], ['18 / 3 / 2', 3], ['2 * -3', -6],
  ['1 - (-2)', 3], ['-(-(+3))', 3], ['(.5 + .25) * 8', 6],
  ['1 + 2 * (3 + 4)', 15], ['0.1 + 0.2', 0.30000000000000004]
]) assert.equal(evaluate(expression), expected, expression);
for (const expression of [
  '.', '1..2', '1 2', '()', '1 + * 2', '3 + )', '1e3',
  '1 / (2 - 2)', '9 / 0', '9'.repeat(400)
]) assert.throws(() => evaluate(expression), Error, expression);
"""
    run_node(script, DEMOS / "assignment-2" / "index.html")


def test_card24_exact_arithmetic_card_multiplicity_and_length_limit() -> None:
    script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(process.argv[1], 'utf8');
const source = html.match(/<script\b[^>]*id="card24-script"[^>]*>([\s\S]*?)<\/script>/i)[1];
const sandbox = {location: {hash: '#test'}};
vm.runInNewContext(source, sandbox);
const api = sandbox.__card24Test;
assert.equal(api.checkAnswer('(3 + 3) * (8 / 2)', [3, 3, 8, 2]).status, 'correct');
assert.equal(api.checkAnswer('1 + 1 + 1 + 1', [1, 1, 1, 2]).status, 'wrong-cards');
assert.equal(api.checkAnswer('1 + 2 + 3', [1, 2, 3, 4]).status, 'wrong-cards');
assert.equal(api.checkAnswer('1 + 2 + 3 + 4', [4, 3, 2, 1]).status, 'incorrect');
for (const expression of ['(1 + 2) / (3 - 3)', '-1 + 2 + 3 + 4',
                           '1.0 + 2 + 3 + 4', '2(3 + 4)', '01 + 2 + 3 + 4']) {
  assert.equal(api.checkAnswer(expression, [1, 2, 3, 4]).status, 'invalid', expression);
}
assert.equal(api.parseExpression('1'.repeat(200)).usedValues.length, 1);
assert.equal(api.checkAnswer('1'.repeat(201), [1, 2, 3, 4]).status, 'invalid');
"""
    run_node(script, DEMOS / "assignment-4" / "index.html")


def test_card24_solver_handles_permutations_and_retries_unsolvable_hands() -> None:
    script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(process.argv[1], 'utf8');
const source = html.match(/<script\b[^>]*id="card24-script"[^>]*>([\s\S]*?)<\/script>/i)[1];
const sandbox = {location: {hash: '#test'}};
vm.runInNewContext(source, sandbox);
const api = sandbox.__card24Test;
for (const cards of [[1, 2, 3, 4], [4, 3, 2, 1], [3, 3, 8, 8]]) {
  const solution = api.findSolution(cards);
  assert.equal(typeof solution, 'string', JSON.stringify(cards));
  assert.equal(api.checkAnswer(solution, cards).status, 'correct', solution);
}
for (const cards of [[], [1, 2, 3], [1, 2, 3, 14], [1, 2, 3, 1.5]]) {
  assert.throws(() => api.findSolution(cards), {name: 'TypeError'}, JSON.stringify(cards));
}
let attempts = 0;
const result = api.generateSolvableCards(() => (++attempts === 1 ?
  [1, 1, 1, 1] : [1, 2, 3, 4]));
assert.equal(attempts, 2);
assert.equal(api.checkAnswer(result.solution, result.cards).status, 'correct');
"""
    run_node(script, DEMOS / "assignment-4" / "index.html")


def test_bfs_validates_geometry_and_cancels_stale_searches() -> None:
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
function requestAnimationFrame(callback) { searchVersion = 1; callback(); }
${logic}
const goalNeighbors = getNeighborStates(GOAL_STATE);
assert.equal(goalNeighbors.length, 2, 'corner blank');
assert.equal(getNeighborStates('123405678').length, 4, 'center blank');
assert.equal(getNeighborStates('123450678').length, 3, 'edge blank');
assert(goalNeighbors.every(({state, tileMoved}) =>
  state.indexOf('0') !== GOAL_STATE.indexOf('0') && tileMoved !== '0'));
assert.equal(countInversions(GOAL_STATE) % 2, 0);
assert.equal(countInversions('123456870') % 2, 1);
return Promise.all([
  breadthFirstSearch(GOAL_STATE, 1),
  breadthFirstSearch(DEFAULT_STATE, 0)
]);`;
new Function('assert', harness)(assert).then(([stale, interrupted]) => {
  assert.equal(stale, null);
  assert.equal(interrupted, null);
}).catch(error => { console.error(error); process.exitCode = 1; });
"""
    run_node(script, DEMOS / "assignment-5" / "bfs.html")


def test_astar_heuristic_path_frames_and_cancellation() -> None:
    script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync(process.argv[1], 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const constants = source.slice(source.indexOf('const DEFAULT_STATE'), source.indexOf('// --- A* search logic ---'));
const logic = source.slice(source.indexOf('// --- A* search logic ---'), source.indexOf('// --- Interface rendering ---'));
const harness = `${constants}
${logic}
let currentVersion = 0;
function getSearchVersion() { return currentVersion; }
assert.equal(manhattanDistance(GOAL_STATE), 0);
assert.equal(manhattanDistance('123456708'), 1);
assert.equal(manhattanDistance('123406758'), 2);
assert.equal(inversionCount('123456870') % 2, 1);
assert.equal(getNeighbors(GOAL_STATE).length, 2);
return Promise.all([
  aStarSearch('123406758', 0, () => {}, async () => {}),
  aStarSearch(GOAL_STATE, 1, () => {}, async () => {})
]);`;
new Function('assert', harness)(assert).then(([result, stale]) => {
  assert.equal(stale, null);
  assert.deepEqual(result.path, ['123406758', '123456708', '123456780']);
  assert.deepEqual(result.movedTiles, [null, '5', '8']);
  assert.deepEqual(result.frames.map(frame => frame.g), [0, 1, 2]);
  assert.deepEqual(result.frames.map(frame => frame.h), [2, 1, 0]);
  assert(result.frames.every(frame => frame.openSize >= frame.candidates.length));
}).catch(error => { console.error(error); process.exitCode = 1; });
"""
    run_node(script, DEMOS / "assignment-5" / "astar.html")


def test_chopsticks_rule_boundaries_and_minimax_recurrence() -> None:
    script = r"""
const assert = require('node:assert/strict');
const game = require(process.argv[1]);
const ai = require(process.argv[2]);
for (const bad of [null, [], [[1, 1], [1, 1]], [[-1, 1], [1, 1], 0],
                    [[5, 1], [1, 1], 0], [[1.5, 1], [1, 1], 0],
                    [[1, 1], [1, 1], -1]]) {
  assert.throws(() => game.assertState(bad), Error);
}
for (const depth of [0, 1, 3, 51, 2.5, NaN, Infinity]) {
  assert.throws(() => game.assertDepth(depth), RangeError);
}
assert.equal(game.overflowSum(4, 1), 0);
assert.equal(game.overflowSum(1, 3), 4);
assert.equal(game.getResult([[0, 0], [1, 1], 2], 2), 'B');
assert.equal(game.getResult([[1, 1], [0, 0], 2], 2), 'A');
assert.equal(game.getResult([[0, 0], [0, 0], 2], 2), 'tie');
assert.equal(game.getResult([[1, 1], [1, 1], 2], 2), 'tie');
const opening = game.legalMoves(game.INITIAL_STATE, 4);
assert.equal(opening.length, 4, 'symmetric attacks are deduplicated');
assert.equal(new Set(opening.map(move => game.stateKey(move.nextState))).size, opening.length);
assert(opening.every(move => move.nextState[2] === 1));
assert.deepEqual(game.legalMoves([[1, 1], [1, 1], 4], 4), []);
const table = ai.bestMoveDP(4);
assert.equal(table.size, 625 * 5);
for (const [key, entry] of table) {
  const [a, b, level] = key.split('|');
  const state = [a.split(',').map(Number), b.split(',').map(Number), Number(level)];
  const terminal = game.getResult(state, 4);
  if (terminal !== null) {
    assert.equal(entry.score, terminal === 'A' ? 1 : terminal === 'B' ? -1 : 0);
    assert.equal(entry.bestState, null);
    continue;
  }
  const moves = game.legalMoves(state, 4);
  const childScores = moves.map(move => table.get(game.stateKey(move.nextState)).score);
  assert.equal(entry.score, level % 2 === 0 ? Math.max(...childScores) : Math.min(...childScores));
  assert(moves.some(move => game.stateKey(move.nextState) === game.stateKey(entry.bestState)));
}
"""
    run_node(
        script,
        DEMOS / "assignment-6" / "game.js",
        DEMOS / "assignment-6" / "ai.js",
    )


def test_chopsticks_strength_uses_legal_worse_move_and_rejects_bad_rolls() -> None:
    script = r"""
const assert = require('node:assert/strict');
const game = require(process.argv[1]);
const ai = require(process.argv[2]);
const table = ai.bestMoveDP(6);
const state = [[0, 1], [0, 4], 5]; // B can win with a tap; splits tie.
const optimal = ai.bestMove(state, table);
assert.equal(optimal.score, -1);
assert.equal(ai.moveAtStrength(state, table, 100, 0.99, 0.99).score, -1);
assert.equal(ai.moveAtStrength(state, table, 0, 0, 0).kind, 'split');
assert.equal(ai.moveAtStrength(state, table, 50, 0.49, 0).score, -1);
assert.equal(ai.moveAtStrength(state, table, 50, 0.5, 0).kind, 'split');
for (const strength of [-1, 101, 0.5, NaN]) {
  assert.throws(() => ai.moveAtStrength(state, table, strength, 0, 0), RangeError);
}
for (const roll of [-0.1, 1, NaN, Infinity, '0.5']) {
  assert.throws(() => ai.moveAtStrength(state, table, 50, roll, 0), RangeError);
  assert.throws(() => ai.moveAtStrength(state, table, 50, 0, roll), RangeError);
}
assert.throws(() => ai.compareSearch(10), RangeError);
"""
    run_node(
        script,
        DEMOS / "assignment-6" / "game.js",
        DEMOS / "assignment-6" / "ai.js",
    )
