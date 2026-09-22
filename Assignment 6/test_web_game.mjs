/**
 * Assignment-compliance tests for the browser implementation.
 *
 * Run from this folder with:
 *   node --test-isolation=none --test test_web_game.mjs
 *
 * Golden positions were generated from chopsticks.py, the completed supplied
 * Python reference. An independent move oracle checks every ordered position.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  DEFAULT_DEPTH,
  INITIAL_STATE,
  getResult,
  legalMoves,
  nextMoves,
  overflowSum,
  stateKey,
} from './game.js';
import { bestMove, bestMoveDP, evaluateMoves } from './ai.js';

const WEB_HTML = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const WEB_APP = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const WEB_CSS = readFileSync(new URL('./style.css', import.meta.url), 'utf8');
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

test('submission contains the assignment web-file structure', () => {
  for (const name of [
    'index.html', 'style.css', 'game.js', 'ai.js', 'app.js', 'README.md', 'VIBE_LOG.md',
  ]) {
    assert(existsSync(new URL(`./${name}`, import.meta.url)), `Missing ${name}`);
  }
  assert.match(WEB_HTML, /<link\b[^>]*href=["']\.\/style\.css["']/i);
  assert.match(WEB_HTML, /<script\b[^>]*type=["']module["'][^>]*src=["']\.\/app\.js["']/i);
  assert.match(WEB_APP, /from\s+["']\.\/game\.js["']/);
  assert.match(WEB_APP, /from\s+["']\.\/ai\.js["']/);
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

test('restart resets state and illegal UI actions are validated before mutation', () => {
  const reset = functionSource('resetGame');
  assert.match(reset, /structuredClone\(INITIAL_STATE\)/);
  assert.match(reset, /history\s*=\s*\[\]/);
  assert.match(reset, /render\(\)/);
  assert.match(WEB_APP, /restart[^\n]*addEventListener\(['"]click['"],\s*resetGame\)/);

  const commit = functionSource('commitMove');
  const validation = commit.search(/legalMoves\(state\)/);
  const mutation = commit.search(/state\s*=\s*structuredClone\([^)]*nextState\)/);
  assert(validation >= 0);
  assert(mutation >= 0);
  assert(validation < mutation, 'Legality must be checked before state mutation');

  const handClick = functionSource('handleHandClick');
  assert.match(handClick, /humanMayMove\(\)/);
  assert.match(handClick, /count\s*===\s*0/);
  assert.match(handClick, /selectedSource\s*===\s*null/);
});

test('AI analysis can collapse and reports state, role, candidates, and prediction', () => {
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
  const animationCall = commit.search(/await\s+animateAttack\(/);
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
