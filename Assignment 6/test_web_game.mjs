/**
 * Assignment-compliance tests for the browser implementation.
 *
 * Run from this folder with:
 *   node --test test_web_game.mjs
 *
 * Golden positions were generated from chopsticks.py, the completed supplied
 * Python reference. An independent move oracle checks every ordered position.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { createRequire } from 'node:module';

// game.js and ai.js are classic scripts (not ES modules) so index.html works
// when double-clicked; in Node they are loaded through CommonJS require().
const require = createRequire(import.meta.url);
const {
  DEFAULT_DEPTH,
  INITIAL_STATE,
  assertDepth,
  assertState,
  getResult,
  legalMoves,
  nextMoves,
  overflowSum,
  stateKey,
} = require('./game.js');
const { bestMove, bestMoveDP, compareSearch, evaluateMoves, moveAtStrength, outcomeLabel } = require('./ai.js');

const WEB_HTML = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const WEB_APP = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const WEB_CSS = readFileSync(new URL('./style.css', import.meta.url), 'utf8');
const WEB_GAME = readFileSync(new URL('./game.js', import.meta.url), 'utf8');
const WEB_AI = readFileSync(new URL('./ai.js', import.meta.url), 'utf8');
const README = readFileSync(new URL('./submission/README.md', import.meta.url), 'utf8');
const VIBE_LOG = readFileSync(new URL('./submission/VIBE_LOG.md', import.meta.url), 'utf8');
const DP_TABLE = bestMoveDP(DEFAULT_DEPTH);

function cssDeclarations(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = WEB_CSS.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert(match, `Missing CSS rule for ${selector}`);
  return match[1];
}

function functionSource(name) {
  const start = WEB_APP.search(new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`));
  assert.notEqual(start, -1, `Missing ${name}()`);
  const source = WEB_APP.slice(start);
  let depth = 0;
  let opened = false;
  for (let index = source.indexOf('{'); index < source.length; index += 1) {
    if (source[index] === '{') {
      depth += 1;
      opened = true;
    } else if (source[index] === '}') {
      depth -= 1;
      if (opened && depth === 0) return source.slice(0, index + 1);
    }
  }
  assert.fail(`Could not find the end of ${name}()`);
}

function referenceNextMoves(state) {
  const [a, b, level] = state;
  if (a.every((value) => value === 0) || b.every((value) => value === 0)) return [];
  const actor = level % 2 === 0 ? a : b;
  const opponent = level % 2 === 0 ? b : a;
  const result = [];
  const seen = new Set();
  const add = (own, other) => {
    const next = level % 2 === 0 ? [own, other, level + 1] : [other, own, level + 1];
    const key = JSON.stringify(next);
    if (!seen.has(key)) {
      result.push(next);
      seen.add(key);
    }
  };

  for (let source = 0; source < 2; source += 1) {
    if (actor[source] === 0) continue;
    for (let target = 0; target < 2; target += 1) {
      if (opponent[target] === 0) continue;
      const changed = [...opponent];
      const total = actor[source] + changed[target];
      changed[target] = total >= 5 ? 0 : total;
      add([...actor], changed);
    }
  }

  for (let donor = 0; donor < 2; donor += 1) {
    const receiver = 1 - donor;
    for (let amount = 1; amount <= actor[donor]; amount += 1) {
      if (actor[receiver] + amount > 4) continue;
      const changed = [...actor];
      changed[donor] -= amount;
      changed[receiver] += amount;
      if (changed[0] === actor[1] && changed[1] === actor[0]) continue;
      add(changed, [...opponent]);
    }
  }
  return result;
}

function stateFromKey(key) {
  const [a, b, level] = key.split('|');
  return [a.split(',').map(Number), b.split(',').map(Number), Number(level)];
}

function entry(state) {
  const value = DP_TABLE.get(stateKey(state));
  assert(value, `Missing DP entry for ${stateKey(state)}`);
  return value;
}

function* orderedStates(levels) {
  for (const level of levels) {
    for (let aLeft = 0; aLeft < 5; aLeft += 1) {
      for (let aRight = 0; aRight < 5; aRight += 1) {
        for (let bLeft = 0; bLeft < 5; bLeft += 1) {
          for (let bRight = 0; bRight < 5; bRight += 1) {
            yield [[aLeft, aRight], [bLeft, bRight], level];
          }
        }
      }
    }
  }
}

test('submission contains the assignment web-file structure', () => {
  for (const name of [
    'index.html', 'style.css', 'game.js', 'ai.js', 'app.js', 'README.md', 'VIBE_LOG.md',
  ]) {
    assert(existsSync(new URL(`./submission/${name}`, import.meta.url)), `Missing ${name}`);
  }
  assert.match(WEB_HTML, /<link\b[^>]*href=["']\.\/style\.css["']/i);
  // Classic deferred scripts (no type="module") so the page works from file://,
  // loaded in dependency order: game.js -> ai.js -> app.js.
  assert.doesNotMatch(WEB_HTML, /<script\b[^>]*type=["']module["']/i,
    'ES-module scripts are blocked when index.html is opened from file://');
  const scriptSrcs = [...WEB_HTML.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1]);
  assert.deepEqual(scriptSrcs, ['./game.js', './ai.js', './app.js']);
  for (const tag of WEB_HTML.matchAll(/<script\b[^>]*\bsrc=[^>]*>/gi)) {
    assert.match(tag[0], /\bdefer\b/, 'app.js reads the DOM at load time, so scripts must be deferred');
  }
  assert.match(WEB_APP, /window\.ChopsticksGame/);
  assert.match(WEB_APP, /window\.ChopsticksAI/);
  assert.doesNotMatch(WEB_APP, /^\s*(?:import|export)\s/m, 'app.js must be a classic script');
  assert.doesNotMatch(WEB_GAME, /^\s*export\s/m, 'game.js must be a classic script');
  assert.doesNotMatch(WEB_AI, /^\s*(?:import|export)\s/m, 'ai.js must be a classic script');
});

test('the page uses the local Chopsticks artwork as its browser icon', () => {
  const iconTag = [...WEB_HTML.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0])
    .find((tag) => /\brel=["'][^"']*\bicon\b[^"']*["']/i.test(tag));
  assert(iconTag, 'Missing a favicon <link rel="icon">');
  const href = iconTag.match(/\bhref=["']([^"']+)["']/i)?.[1];
  assert(href, 'The favicon link needs a local href');
  assert.doesNotMatch(href, /^(?:[a-z]+:|\/\/)/i, 'The favicon must be a local project file');

  const iconUrl = new URL(href, import.meta.url);
  iconUrl.search = '';
  iconUrl.hash = '';
  assert(existsSync(iconUrl), `Missing favicon file: ${href}`);
  const iconSource = readFileSync(iconUrl, 'utf8');
  assert(iconSource.length > 50, 'The favicon file appears to be empty');
  if (iconUrl.pathname.endsWith('.svg')) assert.match(iconSource, /<svg\b/i);
});

test('starts at A (MAX), enforces the depth-20 tie, and preserves knockouts', () => {
  assert.equal(DEFAULT_DEPTH, 20);
  assert.deepEqual(INITIAL_STATE, [[1, 1], [1, 1], 0]);
  assert.equal(getResult(INITIAL_STATE), null);
  assert.equal(getResult([[1, 1], [1, 1], 19]), null);
  assert.equal(getResult([[1, 1], [1, 1], 20]), 'tie');
  assert.equal(getResult([[0, 0], [1, 1], 20]), 'B');
  assert.equal(getResult([[1, 1], [0, 0], 20]), 'A');
  assert.equal(getResult([[0, 0], [0, 0], 20]), 'tie');
  assert.deepEqual(legalMoves([[1, 1], [1, 1], 20]), []);
});

test('overflow follows the supplied Python cutoff rule', () => {
  assert.equal(overflowSum(1, 3), 4);
  assert.equal(overflowSum(2, 3), 0);
  assert.equal(overflowSum(4, 4), 0);
  assert.equal(overflowSum(0, 5), 0);
  for (const [a, b] of [[-1, 1], [1, 6], [true, 1], [1.5, 2], ['2', 1]]) {
    assert.throws(() => overflowSum(a, b), Error);
  }
});

test('overflow is deterministic for every accepted input pair', () => {
  let checked = 0;
  for (let source = 0; source <= 5; source += 1) {
    for (let target = 0; target <= 5; target += 1) {
      const expected = source + target >= 5 ? 0 : source + target;
      assert.equal(overflowSum(source, target), expected, `${source} + ${target}`);
      assert.equal(overflowSum(source, target), expected, 'Repeated calls must agree');
      checked += 1;
    }
  }
  assert.equal(checked, 36);
});

test('attacks can knock out a hand and cannot use dead hands', () => {
  const attacks = legalMoves([[4, 0], [1, 2], 0]).filter((move) => move.kind === 'attack');
  assert.equal(attacks.length, 2);
  assert(attacks.every((move) => move.source === 0));
  assert.deepEqual(attacks.map(({ nextState }) => nextState), [
    [[4, 0], [0, 2], 1],
    [[4, 0], [1, 0], 1],
  ]);
  const deadTarget = legalMoves([[1, 2], [0, 3], 0])
    .filter((move) => move.kind === 'attack');
  assert(deadTarget.every((move) => move.target === 1));
});

test('redistribution revives hands while excluding illegal swaps and totals', () => {
  const splits = legalMoves([[0, 4], [1, 2], 0]).filter((move) => move.kind === 'split');
  assert.deepEqual(splits.map(({ newHands }) => newHands), [[1, 3], [2, 2], [3, 1]]);
  assert(splits.every(({ newHands }) => newHands[0] + newHands[1] === 4));
  assert(splits.every(({ newHands }) => newHands.every((value) => value >= 0 && value <= 4)));
  assert(!splits.some(({ newHands }) => JSON.stringify(newHands) === '[4,0]'));
});

test('invalid, terminal, and horizon states cannot generate unintended moves', () => {
  for (const invalid of [
    null,
    [[1, 1], [1, 1]],
    [[-1, 1], [1, 1], 0],
    [[1, 1], [1, 5], 0],
    [[1, 1], [1, 1], -1],
    [[1, 1], [1, 1], 1.5],
  ]) assert.throws(() => legalMoves(invalid), Error);
  assert.deepEqual(legalMoves([[0, 0], [1, 1], 4]), []);
  assert.deepEqual(legalMoves([[1, 1], [0, 0], 4]), []);
  assert.deepEqual(legalMoves([[1, 1], [1, 1], DEFAULT_DEPTH]), []);
});

test('public rule and AI APIs reject malformed values with bounded validation', () => {
  assert.doesNotThrow(() => assertState([[0, 4], [3, 1], 0]));
  assert.equal(assertState([[0, 4], [3, 1], 0]), undefined);
  for (const invalid of [
    undefined,
    {},
    [[1, 1], [1, 1]],
    [[1, 1, 1], [1, 1], 0],
    [[1, 1], [1, 1], Number.MAX_SAFE_INTEGER + 1],
  ]) assert.throws(() => assertState(invalid), Error);

  for (const depth of [2, 20, 50]) assert.doesNotThrow(() => assertDepth(depth));
  for (const depth of [undefined, null, 0, 1, 3, 20.5, 52, '20', Infinity]) {
    assert.throws(() => assertDepth(depth), RangeError);
  }

  assert.equal(stateKey([[1, 2], [3, 4], 5]), '1,2|3,4|5');
  assert.throws(() => stateKey([[1, 2], [3, 5], 5]), RangeError);
  assert.throws(() => bestMove(INITIAL_STATE, null), TypeError);
  assert.throws(() => evaluateMoves(INITIAL_STATE, {}), TypeError);
  assert.equal(outcomeLabel(1), 'WIN for Player A');
  assert.equal(outcomeLabel(0), 'TIE within 20 moves');
  assert.equal(outcomeLabel(-1), 'LOSS for Player A');
  for (const score of [2, -2, null, '1', Number.NaN]) {
    assert.throws(() => outcomeLabel(score), RangeError);
  }
});

test('exported and generated states do not leak mutable aliases', () => {
  assert(Object.isFrozen(INITIAL_STATE));
  assert(Object.isFrozen(INITIAL_STATE[0]));
  assert(Object.isFrozen(INITIAL_STATE[1]));
  assert.throws(() => { INITIAL_STATE[0][0] = 4; }, TypeError);
  assert.deepEqual(INITIAL_STATE, [[1, 1], [1, 1], 0]);

  const input = [[0, 4], [1, 2], 0];
  const before = structuredClone(input);
  const moves = legalMoves(input);
  assert.deepEqual(input, before, 'Generating moves must not mutate the caller state');

  const split = moves.find((move) => move.kind === 'split');
  assert(split, 'Expected a redistribution from 0 | 4');
  assert.notStrictEqual(split.newHands, split.nextState[0]);
  const successorBefore = structuredClone(split.nextState);
  split.newHands[0] = 4;
  assert.deepEqual(split.nextState, successorBefore,
    'Changing descriptive metadata must not alter the successor state');
  split.nextState[0][0] = 3;
  assert.deepEqual(input, before, 'Changing a returned state must not alter the input state');
});

test('all generated moves preserve rule invariants, uniqueness, and input state', () => {
  let statesChecked = 0;
  let movesChecked = 0;
  for (const state of orderedStates([0, 1, 5, 6, 18, 19])) {
    const before = structuredClone(state);
    const first = legalMoves(state);
    const second = legalMoves(state);
    assert.deepEqual(first, second, `Move generation changed for ${stateKey(state)}`);
    assert.deepEqual(state, before, `Move generation mutated ${stateKey(state)}`);

    const successorKeys = first.map((move) => stateKey(move.nextState));
    assert.equal(new Set(successorKeys).size, successorKeys.length,
      `Duplicate successors for ${stateKey(state)}`);
    if (getResult(state) === null) {
      assert(first.length > 0, `Live state has no legal move: ${stateKey(state)}`);
    } else {
      assert.equal(first.length, 0, `Terminal state generated moves: ${stateKey(state)}`);
    }

    const actor = state[2] % 2;
    const opponent = 1 - actor;
    for (const move of first) {
      const next = move.nextState;
      assert.equal(next[2], state[2] + 1);
      assert(next[0].concat(next[1]).every(
        (value) => Number.isInteger(value) && value >= 0 && value <= 4,
      ));

      if (move.kind === 'attack') {
        assert(state[actor][move.source] > 0, 'An attack used a dead source');
        assert(state[opponent][move.target] > 0, 'An attack targeted a dead hand');
        assert.deepEqual(next[actor], state[actor], 'An attack changed the acting player');
        assert.equal(next[opponent][1 - move.target], state[opponent][1 - move.target]);
        assert.equal(
          next[opponent][move.target],
          overflowSum(state[actor][move.source], state[opponent][move.target]),
        );
      } else if (move.kind === 'split') {
        assert.deepEqual(next[opponent], state[opponent], 'A split changed the opponent');
        assert.equal(
          next[actor][0] + next[actor][1],
          state[actor][0] + state[actor][1],
          'A split changed the finger total',
        );
        assert.deepEqual(move.newHands, next[actor]);
        assert.notStrictEqual(move.newHands, next[actor]);
        assert.notDeepEqual(next[actor], [state[actor][1], state[actor][0]],
          'A pure left/right swap is not a legal split');
      } else {
        assert.fail(`Unknown move kind: ${move.kind}`);
      }
      movesChecked += 1;
    }
    statesChecked += 1;
  }
  assert.equal(statesChecked, 3_750);
  assert(movesChecked > statesChecked);
});

test('all 1,250 ordered non-horizon positions match an independent oracle', () => {
  let checked = 0;
  for (let al = 0; al < 5; al += 1) {
    for (let ar = 0; ar < 5; ar += 1) {
      for (let bl = 0; bl < 5; bl += 1) {
        for (let br = 0; br < 5; br += 1) {
          for (const level of [0, 1]) {
            const state = [[al, ar], [bl, br], level];
            assert.deepEqual(nextMoves(state), referenceNextMoves(state), JSON.stringify(state));
            checked += 1;
          }
        }
      }
    }
  }
  assert.equal(checked, 1_250);
});

test('the bottom-up table has all 13,125 states and correct base cases', () => {
  assert(DP_TABLE instanceof Map);
  assert.equal(DP_TABLE.size, 5 ** 4 * (DEFAULT_DEPTH + 1));
  for (const level of [0, 7, DEFAULT_DEPTH]) {
    assert.deepEqual(entry([[0, 0], [1, 1], level]), { score: -1, bestState: null });
    assert.deepEqual(entry([[1, 1], [0, 0], level]), { score: 1, bestState: null });
    assert.deepEqual(entry([[0, 0], [0, 0], level]), { score: 0, bestState: null });
  }
  assert.deepEqual(entry([[1, 1], [1, 1], DEFAULT_DEPTH]), {
    score: 0,
    bestState: null,
  });
});

test('every nonterminal DP row obeys the bottom-up MAX/MIN recurrence', () => {
  let checked = 0;
  for (const [key, current] of DP_TABLE) {
    const state = stateFromKey(key);
    if (getResult(state) !== null) {
      assert.equal(current.bestState, null, `Terminal row selected a move: ${key}`);
      continue;
    }
    const moves = legalMoves(state);
    const values = moves.map((move) => entry(move.nextState).score);
    const expected = state[2] % 2 === 0 ? Math.max(...values) : Math.min(...values);
    assert.equal(current.score, expected, `Incorrect minimax value for ${key}`);
    assert(current.bestState, `Live row has no selected move: ${key}`);
    assert(moves.some((move) => stateKey(move.nextState) === stateKey(current.bestState)),
      `DP chose an illegal child for ${key}`);
    assert.equal(entry(current.bestState).score, expected);
    checked += 1;
  }
  assert(checked > 0);
});

test('public AI evaluations match every DP row and choose the first optimum', () => {
  let liveRows = 0;
  for (const [key, current] of DP_TABLE) {
    const state = stateFromKey(key);
    const rows = evaluateMoves(state, DP_TABLE);
    const choice = bestMove(state, DP_TABLE);
    if (getResult(state) !== null) {
      assert.deepEqual(rows, []);
      assert.equal(choice, null);
      continue;
    }

    const moves = legalMoves(state);
    assert.equal(rows.length, moves.length);
    assert.equal(rows.filter((row) => row.selected).length, 1);
    rows.forEach((row, index) => {
      assert.equal(stateKey(row.nextState), stateKey(moves[index].nextState));
      assert.equal(row.score, entry(row.nextState).score);
    });

    const firstOptimal = rows.findIndex((row) => row.score === current.score);
    const selected = rows.findIndex((row) => row.selected);
    assert.equal(selected, firstOptimal, `Tie-breaking changed at ${key}`);
    assert(choice);
    assert.equal(stateKey(choice.nextState), stateKey(rows[selected].nextState));
    assert.equal(choice.score, current.score);
    liveRows += 1;
  }
  assert.equal(liveRows, 576 * DEFAULT_DEPTH);
});

test('bottom-up construction remains correct at multiple supported horizons', () => {
  for (const depth of [2, 4, 6]) {
    const table = bestMoveDP(depth);
    assert.equal(table.depth, depth);
    assert.equal(table.size, 5 ** 4 * (depth + 1));
    assert.equal(Object.prototype.propertyIsEnumerable.call(table, 'depth'), false);
    assert.equal(table.has(stateKey([[1, 1], [1, 1], depth + 1])), false);
    assert.deepEqual(table.get(stateKey([[1, 1], [1, 1], depth])), {
      score: 0,
      bestState: null,
    });
    assert.equal(bestMove([[1, 1], [1, 1], depth], table), null);

    let state = structuredClone(INITIAL_STATE);
    let turns = 0;
    while (getResult(state, depth) === null) {
      const choice = bestMove(state, table);
      assert(choice, `Depth-${depth} table failed at ${stateKey(state)}`);
      assert(legalMoves(state, depth).some(
        (move) => stateKey(move.nextState) === stateKey(choice.nextState),
      ));
      state = structuredClone(choice.nextState);
      turns += 1;
      assert(turns <= depth);
    }
    assert(state[2] <= depth);
  }
});

test('key minimax rows match the completed Python reference exactly', () => {
  assert.deepEqual(entry(INITIAL_STATE), {
    score: 0,
    bestState: [[1, 1], [2, 1], 1],
  });
  assert.deepEqual(entry([[0, 1], [1, 3], 18]), {
    score: 0,
    bestState: [[0, 1], [2, 3], 19],
  });
  assert.deepEqual(entry([[0, 1], [0, 4], 19]), {
    score: -1,
    bestState: [[0, 0], [0, 4], 20],
  });
});

test('A maximizes and B minimizes positions with different successor values', () => {
  const aState = [[0, 1], [1, 3], 18];
  const aRows = evaluateMoves(aState, DP_TABLE);
  assert.deepEqual(aRows.map(({ score }) => score), [0, -1]);
  assert.equal(aRows.filter(({ selected }) => selected).length, 1);
  const aChoice = bestMove(aState, DP_TABLE);
  assert.equal(aChoice.score, 0);
  assert.deepEqual(aChoice.nextState, [[0, 1], [2, 3], 19]);

  const bState = [[0, 1], [0, 4], 19];
  const bRows = evaluateMoves(bState, DP_TABLE);
  assert.deepEqual(bRows.map(({ score }) => score), [-1, 0, 0, 0]);
  assert.equal(bRows.filter(({ selected }) => selected).length, 1);
  const bChoice = bestMove(bState, DP_TABLE);
  assert.equal(bChoice.score, -1);
  assert.deepEqual(bChoice.nextState, [[0, 0], [0, 4], 20]);
});

test('computer selection is legal for both A and B and stops at the horizon', () => {
  for (const state of [
    [[0, 1], [1, 3], 18],
    [[0, 1], [0, 4], 19],
  ]) {
    const choice = bestMove(state, DP_TABLE);
    assert(choice);
    assert(legalMoves(state).some((move) => stateKey(move.nextState) === stateKey(choice.nextState)));
  }
  assert.equal(bestMove([[1, 1], [1, 1], DEFAULT_DEPTH], DP_TABLE), null);
  assert.deepEqual(evaluateMoves([[1, 1], [1, 1], DEFAULT_DEPTH], DP_TABLE), []);
});

test('strength 100 preserves exact minimax; lower strength may make legal mistakes', () => {
  for (const position of [
    [[0, 1], [1, 3], 18],
    [[0, 1], [0, 4], 19],
  ]) {
    const perfect = bestMove(position, DP_TABLE);
    assert.deepEqual(moveAtStrength(position, DP_TABLE, 100, 0.99, 0.99), perfect);
    assert.deepEqual(moveAtStrength(position, DP_TABLE, 50, 0.1, 0.99), perfect);
    const mistake = moveAtStrength(position, DP_TABLE, 0, 0.99, 0.5);
    assert(legalMoves(position).some((move) => stateKey(move.nextState) === stateKey(mistake.nextState)));
    assert.notEqual(mistake.score, perfect.score);
  }
  const opening = moveAtStrength(INITIAL_STATE, DP_TABLE, 0, 0.99, 0.5);
  assert.equal(opening.kind, 'split');
  assert.equal(opening.score, -1);
  assert.equal(moveAtStrength([[1, 1], [1, 1], 20], DP_TABLE, 0, 0.5, 0.5), null);
  assert.throws(() => moveAtStrength(INITIAL_STATE, DP_TABLE, -1, 0, 0), RangeError);
  assert.throws(() => moveAtStrength(INITIAL_STATE, DP_TABLE, 101, 0, 0), RangeError);
  assert.throws(() => moveAtStrength(INITIAL_STATE, DP_TABLE, 50, Number.NaN, 0), RangeError);
  assert.throws(() => moveAtStrength(INITIAL_STATE, DP_TABLE, 50, 0, 1), RangeError);
});

test('the strength slider is only for You vs AI and analysis identifies perfect play', () => {
  assert.match(WEB_HTML, /id="ai-strength"[^>]*min="0"[^>]*max="100"[^>]*value="100"/);
  assert.match(WEB_HTML, /id="ai-strength-value"/);
  assert.match(WEB_HTML, /id="ai-strength-analysis-note"/);
  assert.match(functionSource('renderControls'), /strengthControls\.hidden = mode !== 'human'/);
  assert.match(functionSource('selectComputerMove'), /mode !== 'human'\) return bestMove\(state, minimaxTable\)/);
  assert.match(functionSource('selectComputerMove'), /moveAtStrength\(state, minimaxTable, strengthUsed/);
  assert.match(functionSource('renderAI'), /perfect-play choice shown here/);
});

test('autonomous optimal play terminates no later than level 20', () => {
  let state = structuredClone(INITIAL_STATE);
  const actors = new Set();
  const moves = [];
  while (getResult(state) === null) {
    assert(state[2] < DEFAULT_DEPTH);
    actors.add(state[2] % 2 === 0 ? 'A' : 'B');
    const choice = bestMove(state, DP_TABLE);
    assert(choice, `No computer move at ${stateKey(state)}`);
    assert(legalMoves(state).some((move) => stateKey(move.nextState) === stateKey(choice.nextState)));
    moves.push(choice);
    state = choice.nextState;
  }
  assert.deepEqual(actors, new Set(['A', 'B']));
  assert(moves.length <= DEFAULT_DEPTH);
  assert.equal(state[2], moves.length);
  assert.equal(getResult(state), 'tie');
  assert.equal(state[2], DEFAULT_DEPTH);
});

test('optimal autonomous play completes from every live state at sampled levels', () => {
  let simulations = 0;
  for (const startingState of orderedStates([0, 5, 10, 15, 19])) {
    if (getResult(startingState) !== null) continue;
    let state = structuredClone(startingState);
    let turns = 0;
    while (getResult(state) === null) {
      const choice = bestMove(state, DP_TABLE);
      assert(choice, `No selected move at ${stateKey(state)}`);
      assert(legalMoves(state).some(
        (move) => stateKey(move.nextState) === stateKey(choice.nextState),
      ));
      assert.equal(choice.nextState[2], state[2] + 1);
      state = structuredClone(choice.nextState);
      turns += 1;
      assert(turns <= DEFAULT_DEPTH - startingState[2]);
    }
    assert(state[2] <= DEFAULT_DEPTH);
    assert(['A', 'B', 'tie'].includes(getResult(state)));
    simulations += 1;
  }
  assert.equal(simulations, 5 * 24 * 24);
});

test('the interface exposes all required game and analysis information', () => {
  const htmlIds = [...WEB_HTML.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(htmlIds).size, htmlIds.length, 'Duplicate HTML IDs');
  for (const id of [
    'hand-a-left', 'hand-a-right', 'hand-b-left', 'hand-b-right',
    'player-a', 'player-b', 'restart-button', 'remaining-moves',
    'ai-toggle', 'ai-panel', 'ai-state', 'ai-role', 'ai-score', 'ai-reason',
    'graph-current', 'graph-choices',
  ]) assert(htmlIds.includes(id), `Missing #${id}`);
  for (const hand of ['hand-a-left', 'hand-a-right', 'hand-b-left', 'hand-b-right']) {
    assert.match(WEB_HTML, new RegExp(`<button\\b[^>]*id="${hand}"`, 'i'));
  }
  assert.match(WEB_HTML, /id="ai-toggle"[^>]*aria-controls="ai-analysis-content"/i);
  assert.match(WEB_HTML, /id="ai-analysis-content"/i);
  assert.match(WEB_HTML, /AI\s+(?:analysis|thinking)/i);
  assert.match(WEB_HTML, /20[- ]move|depth\s*20|20\s*moves?/i);
});

test('AI-vs-AI playback controls are part of Game Setup and name the start action clearly', () => {
  const setup = WEB_HTML.match(
    /<section\b(?=[^>]*class=["'][^"']*\bsetup-panel\b[^"']*["'])[^>]*>[\s\S]*?<\/section>/i,
  )?.[0];
  assert(setup, 'Missing the Game Setup panel');
  for (const id of ['mode-auto', 'auto-controls', 'auto-play', 'auto-step', 'auto-speed']) {
    assert.match(setup, new RegExp(`\\bid=["']${id}["']`, 'i'), `#${id} must be inside Game Setup`);
  }

  const playButton = setup.match(
    /<button\b(?=[^>]*\bid=["']auto-play["'])[^>]*>([\s\S]*?)<\/button>/i,
  );
  assert(playButton, 'Missing the AI-vs-AI start button');
  const initialLabel = playButton[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  assert.match(initialLabel, /\bstart\s+AI\s+vs\.?\s+AI\b/i,
    'The initial button label should make it clear that it starts AI vs AI');
  assert.match(WEB_APP, /ui\.autoPlay\.textContent\s*=\s*autoRunning\s*\?\s*["']Pause AI vs AI["']\s*:\s*["']Start AI vs AI["']/,
    'The dynamic play/pause labels should remain explicit');
});

test('move history starts roomy and scrolls instead of growing with every move', () => {
  const historyCss = cssDeclarations('.history-list');
  assert.match(historyCss,
    /(?:^|;)\s*(?:height|block-size|min-height|min-block-size):\s*[^;]+/,
    'Move history needs a roomy fixed or minimum size before moves are added');
  assert.match(historyCss,
    /(?:^|;)\s*(?:height|block-size|max-height|max-block-size):\s*[^;]+/,
    'Move history needs a bounded size');
  assert.match(historyCss, /overflow-y:\s*(?:auto|scroll)/,
    'Move history should scroll vertically when it fills');
  assert.match(historyCss, /scrollbar-gutter:\s*stable/,
    'Reserving scrollbar space keeps history from shifting as it fills');
});

test('restart resets state and illegal UI actions are validated before mutation', () => {
  const reset = functionSource('resetGame');
  assert.match(reset, /structuredClone\(INITIAL_STATE\)/);
  assert.match(reset, /history\s*=\s*\[\]/);
  assert.match(reset, /render\(\)/);
  assert.match(WEB_APP, /restart[^\n]*addEventListener\(['"]click['"],\s*resetGame\)/);

  const commit = functionSource('commitMove');
  const validation = commit.search(/legalMoves\(state(?:,\s*searchDepth)?\)/);
  const mutation = commit.search(/state\s*=\s*structuredClone\([^)]*nextState\)/);
  assert(validation >= 0);
  assert(mutation >= 0);
  assert(validation < mutation, 'Legality must be checked before state mutation');

  const handClick = functionSource('handleHandClick');
  assert.match(handClick, /humanMayMove\(\)/);
  assert.match(handClick, /count\s*===\s*0/);
  assert.match(handClick, /selectedSource\s*===\s*null/);
});

test('AI analysis has a beginner summary plus optional advanced minimax details', () => {
  assert.match(WEB_APP, /aiToggle|ai-toggle|ui\.aiToggle/);
  assert.match(WEB_APP, /aria-expanded/);
  assert.match(WEB_APP, /aiContent|ai-analysis-content|ui\.aiContent/);
  assert.match(WEB_APP, /\bMAX\b/);
  assert.match(WEB_APP, /\bMIN\b/);
  assert.match(WEB_APP, /\bWIN\b/);
  assert.match(WEB_APP, /\bTIE\b/);
  assert.match(WEB_APP, /\bLOSS\b/);
  const analysis = functionSource('renderAI');
  assert.match(analysis, /aiState|ai-state|ui\.aiState/);
  assert.match(analysis, /aiRole|ai-role|ui\.aiRole/);
  assert.match(WEB_APP, /evaluateMoves\(state/);

  const beginnerIds = ['ai-score', 'ai-reason', 'ai-turn-simple', 'ai-selected'];
  for (const id of beginnerIds) assert.match(WEB_HTML, new RegExp(`\\bid=["']${id}["']`, 'i'));

  const advanced = WEB_HTML.match(
    /<details\b(?=[^>]*\bid=["']ai-advanced-details["'])[^>]*>([\s\S]*?)<\/details>/i,
  );
  assert(advanced, 'Technical minimax information should live in a native hideable details panel');
  assert.doesNotMatch(advanced[0].match(/^<details\b[^>]*>/i)?.[0] ?? '', /\sopen(?:\s|=|>)/i,
    'Advanced details should start collapsed for first-time players');
  assert.match(advanced[1],
    /<summary\b[^>]*>[^<]*(?:advanced|details|how the AI|calculated)[^<]*<\/summary>/i,
    'The disclosure label should explain that it reveals the AI calculation');
  for (const id of beginnerIds) {
    assert.doesNotMatch(advanced[1], new RegExp(`\\bid=["']${id}["']`, 'i'),
      `#${id} belongs in the beginner summary, not Advanced details`);
  }
  for (const id of ['ai-state', 'ai-role', 'ai-raw-score', 'graph-current', 'graph-choices']) {
    assert.match(advanced[1], new RegExp(`\\bid=["']${id}["']`, 'i'),
      `#${id} should be inside Advanced details`);
  }
});

test('interactive move tree connects the played route, current node, choices, impact, and replies', () => {
  for (const id of [
    'move-tree', 'tree-played-path', 'graph-current', 'graph-choices',
    'tree-impact', 'tree-replies', 'tree-review-controls', 'tree-review-label',
    'tree-review-previous', 'tree-review-next', 'tree-review-final', 'tree-review-note',
  ]) assert.match(WEB_HTML, new RegExp(`\\bid=["']${id}["']`, 'i'), `Missing #${id}`);

  const path = functionSource('renderPlayedPath');
  assert.match(path, /INITIAL_STATE/);
  assert.match(path, /history\.map\(/);
  assert.match(path, /stateAfter/);
  assert.match(path, /is-current/);
  assert.match(path, /is-played/);

  const graph = functionSource('renderGraph');
  assert.match(graph, /evaluateMoves\(position,\s*minimaxTable\)/);
  assert.match(graph, /reviewedMoveIndex/);
  assert.match(graph, /previewedMoveKey/);
  assert.match(graph, /renderImpact\(position,\s*previewed\)/);
  assert.match(graph, /renderReplies\(previewed\)/);

  const commit = functionSource('commitMove');
  assert.match(commit, /stateAfter:\s*structuredClone\(state\)/,
    'Committed moves should save their resulting node for the played route');
});

test('completed-game move-tree review can navigate every saved position without changing the game', () => {
  const path = functionSource('renderPlayedPath');
  assert.match(path, /getResult\(state, searchDepth\)/,
    'The played route should only become a replay control after the game is complete');
  assert.match(path, /document\.createElement\([^)]*["']button["']/,
    'Completed route positions should be keyboard-accessible buttons');
  assert.match(path, /setReviewedMove/,
    'Clicking a completed route position should select that position for review');
  assert.match(path, /aria-(?:current|pressed)/,
    'The selected route position should be exposed to assistive technology');

  const review = functionSource('setReviewedMove');
  assert.match(review, /reviewedMoveIndex\s*=/);
  assert.match(review, /renderGraph\(\)/);
  assert.doesNotMatch(review, /\bstate\s*=/,
    'Review navigation must not replace the completed game state');
  assert.doesNotMatch(review, /\bhistory\s*=/,
    'Review navigation must not replace move history');
  assert.doesNotMatch(review, /commitMove\s*\(/,
    'Review navigation must never play another move');

  const controls = functionSource('renderTreeReviewControls');
  assert.match(controls, /treeReviewPrevious|tree-review-previous|ui\.treeReviewPrevious/);
  assert.match(controls, /treeReviewNext|tree-review-next|ui\.treeReviewNext/);
  assert.match(controls, /treeReviewFinal|tree-review-final|ui\.treeReviewFinal/);
  assert.match(controls, /\.disabled\s*=/,
    'Previous and Next must become unavailable at the ends of the route');
  assert.match(controls, /\.hidden\s*=/,
    'Replay controls should be shown only for a completed game');

  assert.match(WEB_APP,
    /treeReviewPrevious[\s\S]*?addEventListener\(["']click["'][\s\S]*?setReviewedMove/,
    'Previous must navigate through saved route positions');
  assert.match(WEB_APP,
    /treeReviewNext[\s\S]*?addEventListener\(["']click["'][\s\S]*?setReviewedMove/,
    'Next must navigate through saved route positions');
  assert.match(WEB_APP,
    /treeReviewFinal[\s\S]*?addEventListener\(["']click["'][\s\S]*?setReviewedMove/,
    'Final must return directly to the completed position');

  assert.match(functionSource('resetGame'), /reviewedMoveIndex\s*=\s*null/,
    'Restarting should leave replay mode');
  assert.match(functionSource('commitMove'), /reviewedMoveIndex/,
    'Finishing a game should select its final route position');
  assert.match(WEB_CSS, /\.tree-route-node\.is-reviewed\b/,
    'The route needs a visible reviewed-position state');
});

test('tree branch previews are accessible, explanatory, bounded, and never play a move', () => {
  const branch = functionSource('createTreeBranch');
  assert.match(branch, /document\.createElement\(interactive\s*\?\s*['"]button['"]\s*:\s*['"]div['"]\)/);
  assert.match(branch, /aria-pressed/);
  assert.match(branch, /aria-describedby[^\n]*tree-impact/);
  assert.match(branch, /dataset\.treeNodeKey/);
  assert.match(branch, /dataset\.previewState/);
  assert.match(branch, /previewedMoveKey\s*=\s*childKey/);
  assert.match(branch, /renderImpact\(position,\s*move\)/);
  assert.match(branch, /renderReplies\(move\)/);
  assert.doesNotMatch(branch, /\bstate\s*=/,
    'Previewing a branch must not mutate the current game state');

  const impact = functionSource('describeMoveImpact');
  assert.match(impact, /move\.kind\s*===\s*['"]attack['"]/);
  assert.match(impact, /redistributes/);
  assert.match(impact, /remaining/);
  assert.match(impact, /prediction/);

  assert.match(cssDeclarations('.tree-played-path'), /overflow-x:\s*auto/);
  assert.match(cssDeclarations('.tree-children'), /overflow-x:\s*auto/);
  assert.match(cssDeclarations('.tree-branch'), /flex:\s*0\s+0\s+[^;]+/);
  assert.match(WEB_CSS, /\.tree-node\.is-previewed\b/);
  assert.match(WEB_CSS, /\.tree-node\.is-best\b/);
});

test('DP Statistics panel exposes live table, depth, branch, timing, and role metrics', () => {
  for (const id of [
    'dp-stats-panel', 'dp-table-rows', 'dp-build-time', 'dp-current-level',
    'dp-moves-remaining', 'dp-legal-branches', 'dp-active-role',
    'dp-depth-progress', 'dp-progress-label', 'dp-progress-bar',
  ]) assert.match(WEB_HTML, new RegExp(`\\bid=["']${id}["']`, 'i'), `Missing #${id}`);

  assert.match(WEB_HTML,
    /id=["']dp-depth-progress["'][^>]*role=["']progressbar["'][^>]*aria-valuemin=["']0["'][^>]*aria-valuemax=["']20["']/i);
  assert.match(WEB_HTML, /What do these statistics mean\?/i);

  const render = functionSource('renderDPStats');
  assert.match(render, /minimaxTable\.size/);
  assert.match(render, /tableBuildDuration/);
  assert.match(render, /legalMoves\(state, searchDepth\)\.length/);
  assert.match(render, /searchDepth\s*-\s*state\[2\]/);
  assert.match(render, /A · MAX/);
  assert.match(render, /B · MIN/);
  assert.match(render, /aria-valuenow/);
  assert.match(render, /dpProgressBar\.style\.width/);
  assert.match(functionSource('render'), /renderDPStats\(\)/);
});

test('DP Statistics panel is responsive and records the one-time table build', () => {
  const start = WEB_APP.indexOf('const tableBuildStarted = clockNow()');
  const build = WEB_APP.indexOf('let minimaxTable = bestMoveDP(searchDepth)');
  const finish = WEB_APP.indexOf('let tableBuildDuration = clockNow() - tableBuildStarted');
  assert(start >= 0 && build > start && finish > build,
    'Build timing must wrap the actual bestMoveDP call');
  assert.match(cssDeclarations('.dp-stats-grid'), /grid-template-columns:\s*repeat\(3,/);
  assert.match(WEB_CSS,
    /@media\s*\(max-width:\s*600px\)[\s\S]*?\.dp-stats-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,/,
    'The statistics grid should reduce to two columns on narrow screens');
});

test('large hands stay centered and CSS supplies explicit wide/narrow layouts', () => {
  assert.match(cssDeclarations('.player-row'), /justify-content:\s*center/);
  assert.match(cssDeclarations('.hand-pair'), /justify-content:\s*center/);
  assert.match(cssDeclarations('.hand'), /(?:inline-size|width|min-width):\s*clamp\(/);
  assert.match(cssDeclarations('.hand-art svg'), /(?:inline-size|width):\s*clamp\(/);
  assert.match(WEB_CSS, /@media\s*\(max-width:\s*(?:800|768)px\)/);
  assert.match(WEB_CSS, /@media\s*\(max-width:\s*600px\)/);
  assert.match(WEB_CSS,
    /\.insight-column\s*\{[^}]*grid-template-columns:\s*minmax\([^}]+minmax\(/s,
    'The wide analysis layout should use two columns');
  assert.match(WEB_CSS, /\.insight-column\s*\{[^}]*grid-template-columns:\s*1fr\s*;/s,
    'The phone layout should collapse analysis to one column');
});

test('attacks animate the exact source and target before state mutation', () => {
  const animation = functionSource('animateAttack');
  assert.match(animation, /move\.kind\s*!==\s*['"]attack['"]/);
  assert.match(animation, /\.classList\.add\(['"]is-tapping['"]\)/);
  assert.match(animation, /\.classList\.add\(['"]is-receiving-tap['"]\)/);
  const commit = functionSource('commitMove');
  const animationCall = commit.search(/await[\s\S]*?animateAttack\(/);
  const stateMutation = commit.search(/state\s*=\s*structuredClone\([^)]*nextState\)/);
  assert(animationCall >= 0);
  assert(stateMutation >= 0);
  assert(animationCall < stateMutation);
  assert.match(WEB_CSS, /@keyframes\s+hand-tap\b/);
  assert.match(WEB_CSS, /@keyframes\s+hand-receive-tap\b/);
  const reduced = WEB_CSS.slice(WEB_CSS.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduced, /animation:\s*none\s*!important/);
});

test('dynamic interface text avoids executable HTML and inline-script sinks', () => {
  for (const [name, pattern] of [
    ['innerHTML', /\.innerHTML\s*=/],
    ['outerHTML', /\.outerHTML\s*=/],
    ['insertAdjacentHTML', /\.insertAdjacentHTML\s*\(/],
    ['document.write', /document\.write\s*\(/],
    ['eval', /\beval\s*\(/],
    ['Function constructor', /\bnew\s+Function\s*\(/],
  ]) assert.doesNotMatch(WEB_APP, pattern, `${name} can turn text into executable markup`);
  assert.doesNotMatch(WEB_HTML, /\son[a-z]+\s*=/i);
  assert.doesNotMatch(WEB_HTML, /\b(?:href|src)\s*=\s*["']\s*javascript:/i);
});

test('rule and AI modules stay deterministic, local, and independent of the DOM', () => {
  for (const [name, source] of [['game.js', WEB_GAME], ['ai.js', WEB_AI]]) {
    assert.doesNotMatch(source, /\b(?:document|window|localStorage|sessionStorage)\b/,
      `${name} should remain usable without a browser DOM`);
    assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest|WebSocket)\b/,
      `${name} should not depend on a network service`);
    assert.doesNotMatch(source, /\b(?:Math\.random|Date\.now|setTimeout|setInterval)\b/,
      `${name} should be deterministic`);
  }
  assert.doesNotMatch(WEB_GAME, /^\s*import\s/m,
    'The foundational rule engine should not depend on higher-level modules');
  assert.match(WEB_AI, /require\(['"]\.\/game\.js['"]\)/);
  assert.match(WEB_AI, /root\.ChopsticksGame/);
  assert.match(WEB_APP, /window\.ChopsticksGame/);
  assert.match(WEB_APP, /window\.ChopsticksAI/);
  assert.doesNotMatch(WEB_HTML, /<(?:script|link)\b[^>]*(?:src|href)=["']https?:/i,
    'The submitted app should not require third-party runtime resources');
});

test('every literal DOM lookup and ARIA reference resolves to a unique element', () => {
  const ids = [...WEB_HTML.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
  const idSet = new Set(ids);
  assert.equal(idSet.size, ids.length, 'Duplicate IDs make DOM lookup ambiguous');

  const lookups = [...WEB_APP.matchAll(/\bbyId\(\s*["']([^"']+)["']\s*\)/g)]
    .map((match) => match[1]);
  assert(lookups.length > 30, 'Expected the interface elements to be wired through byId()');
  for (const id of lookups) assert(idSet.has(id), `app.js looks up missing #${id}`);

  for (const match of WEB_HTML.matchAll(
    /\baria-(?:controls|describedby|labelledby)=["']([^"']+)["']/gi,
  )) {
    for (const id of match[1].trim().split(/\s+/)) {
      assert(idSet.has(id), `ARIA references missing #${id}`);
    }
  }
  assert(idSet.has('tree-impact'));
  assert.match(WEB_APP, /setAttribute\(["']aria-describedby["'],\s*["']tree-impact["']\)/);
});

test('interactive HTML controls have explicit behavior and accessible descriptions', () => {
  const buttons = [...WEB_HTML.matchAll(/<button\b[^>]*>/gi)].map((match) => match[0]);
  assert(buttons.length >= 10);
  for (const button of buttons) {
    assert.match(button, /\btype=["']button["']/i,
      `Button could submit a surrounding form unexpectedly: ${button}`);
  }

  const ranges = [...WEB_HTML.matchAll(/<input\b[^>]*\btype=["']range["'][^>]*>/gi)]
    .map((match) => match[0]);
  assert(ranges.length > 0);
  for (const range of ranges) {
    const id = range.match(/\bid=["']([^"']+)["']/i)?.[1];
    assert(id, 'Every range input needs an ID');
    assert.match(WEB_HTML, new RegExp(`<label\\b[^>]*\\bfor=["']${id}["']`, 'i'));
  }

  const detailsCount = [...WEB_HTML.matchAll(/<details\b/gi)].length;
  const summaryCount = [...WEB_HTML.matchAll(/<summary\b/gi)].length;
  assert(detailsCount >= 2);
  assert.equal(summaryCount, detailsCount, 'Every disclosure needs a visible summary');
  assert.match(WEB_HTML, /\baria-live=["']polite["']/i);
  assert.match(WEB_APP, /button\.type\s*=\s*["']button["']/);
  assert.match(WEB_APP, /node\.type\s*=\s*["']button["']/);
});

test('stylesheet syntax and accessibility safeguards remain present', () => {
  const withoutComments = WEB_CSS.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.equal(
    [...withoutComments].filter((character) => character === '{').length,
    [...withoutComments].filter((character) => character === '}').length,
    'CSS block braces are unbalanced',
  );
  assert.match(WEB_CSS, /button:focus-visible/);
  assert.match(WEB_CSS, /input:focus-visible/);
  assert.match(WEB_CSS, /summary:focus-visible/);
  assert.match(WEB_CSS, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(WEB_CSS, /animation:\s*none\s*!important/);
  assert.match(WEB_HTML, /<html\s+lang=["']en["']/i);
  assert.match(WEB_HTML, /<meta\s+name=["']viewport["']/i);
});

test('submission documentation retains required sections and five structured AI interactions', () => {
  for (const heading of [
    'Overview',
    'Running the Web Game',
    'Game Rules',
    'State Representation',
    'Minimax Values',
    'Bottom-Up Dynamic Programming',
    'Software Organization',
    'Testing',
    'Security and Input Handling',
    'Known Limitations',
    'Implemented Extensions',
    'Possible Extensions',
    'Reflection',
  ]) {
    assert.match(README, new RegExp(`^## ${heading}$`, 'm'));
  }

  const interactions = VIBE_LOG.split(/^## Interaction \d+:[^\n]*$/m).slice(1);
  assert.equal(interactions.length, 5);
  for (const [index, interaction] of interactions.entries()) {
    for (const field of [
      'Prompt',
      'AI suggestion',
      'What I accepted or changed',
      'What I learned or verified',
    ]) {
      assert.match(interaction, new RegExp(`\\*\\*${field}\\*\\*`),
        `Interaction ${index + 1} is missing ${field}`);
    }
  }
});

test('optional local multiplayer keeps the current player as the hand actor', () => {
  assert.match(WEB_HTML, /id="mode-local"/);
  assert.match(WEB_APP, /modeLocal\.addEventListener\('click',\s*\(\)\s*=>\s*\{ mode = 'local'; resetGame\(\); \}\)/);
  assert.match(functionSource('humanMayMove'), /mode === 'local'/);
  assert.match(functionSource('handleHandClick'), /mode === 'local' \? currentPlayer\(\) : humanPlayer/);
  assert.match(functionSource('renderHands'), /mode === 'local' \? currentPlayer\(\) : humanPlayer/);
});

test('depth selection preserves the assignment default and changes every live horizon', () => {
  assert.match(WEB_HTML, /id="search-depth"/);
  assert.match(WEB_HTML, /<option value="20" selected>20 moves · assignment default<\/option>/);
  assert.match(WEB_APP, /let searchDepth = DEFAULT_DEPTH/);
  assert.match(WEB_APP, /minimaxTable = cached\.table/);
  assert.match(WEB_APP, /searchDepth = depth;[\s\S]*?resetGame\(\)/);
  for (const name of ['renderStatus', 'renderDPStats', 'commitMove', 'renderGraph']) {
    assert.match(functionSource(name), /searchDepth/, `${name} must use the selected horizon`);
  }
  assert.equal(outcomeLabel(0, 26), 'TIE within 26 moves');
  assert.equal(bestMoveDP(26).get(stateKey(INITIAL_STATE)).score, -1);
});

test('sound is optional and splits have their own animation before state mutation', () => {
  assert.match(WEB_HTML, /id="sound-toggle"[^>]*aria-pressed="false"/);
  assert.match(functionSource('playSound'), /if \(!soundEnabled\) return/);
  assert.match(functionSource('animateSplit'), /prefers-reduced-motion/);
  assert.match(functionSource('animateSplit'), /is-splitting-left/);
  assert.match(functionSource('animateSplit'), /is-splitting-right/);
  assert.match(WEB_CSS, /@keyframes hand-redistribute-left/);
  assert.match(WEB_CSS, /@keyframes hand-redistribute-right/);
  const commit = functionSource('commitMove');
  assert(commit.indexOf('animateSplit(positionBeforeMove)') < commit.indexOf('state = structuredClone(chosen.nextState)'));
});

test('opening advantage and recursive comparison are calculated, not hardcoded', () => {
  for (const id of ['advantage-run', 'advantage-results', 'comparison-run', 'comparison-results']) {
    assert.match(WEB_HTML, new RegExp(`id="${id}"`));
  }
  assert.match(WEB_APP, /getTableAtDepth\(depth\)\.table\.get\(stateKey\(INITIAL_STATE\)\)/);
  assert.match(WEB_APP, /compareSearch\(6\)/);
  for (const depth of [2, 4, 6]) {
    const comparison = compareSearch(depth);
    assert.equal(comparison.score, bestMoveDP(depth).get(stateKey(INITIAL_STATE)).score);
    assert.equal(comparison.dpRows, 625 * (depth + 1));
    assert(comparison.recursiveVisits >= comparison.distinctReachable);
  }
  assert.throws(() => compareSearch(10), RangeError);
});
