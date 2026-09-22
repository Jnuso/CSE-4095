/**
 * Browser-engine regression tests. Run with
 * `node --test-isolation=none --test test_web_game.mjs` from Assignment 6.
 * Golden positions were checked against the Python assignment reference;
 * an independent test oracle verifies all remaining states without requiring
 * child-process permission or Python at browser-test runtime.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  INITIAL_STATE,
  bestMove,
  bestMoveDP,
  buildReachableGraph,
  getResult,
  legalMoves,
  nextMoves,
  overflowSum,
  stateKey,
} from './web/game.js';

function referenceNextMoves(state) {
  const [a, b, level] = state;
  if (a.every((value) => value === 0) || b.every((value) => value === 0)) {
    return [];
  }

  const actor = level % 2 === 0 ? a : b;
  const opponent = level % 2 === 0 ? b : a;
  const result = [];
  const seen = new Set();
  const add = (own, other) => {
    const next = level % 2 === 0
      ? [own, other, level + 1]
      : [other, own, level + 1];
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

function referenceDP(depth) {
  const table = new Map();
  for (let level = depth; level >= 0; level -= 1) {
    for (let al = 0; al < 5; al += 1) {
      for (let ar = 0; ar < 5; ar += 1) {
        for (let bl = 0; bl < 5; bl += 1) {
          for (let br = 0; br < 5; br += 1) {
            const position = [[al, ar], [bl, br], level];
            let score = 0;
            let bestState = null;
            if (al === 0 && ar === 0 && (bl !== 0 || br !== 0)) {
              score = -1;
            } else if (bl === 0 && br === 0 && (al !== 0 || ar !== 0)) {
              score = 1;
            } else if (level < depth && (al !== 0 || ar !== 0) &&
                       (bl !== 0 || br !== 0)) {
              for (const child of referenceNextMoves(position)) {
                const childScore = table.get(JSON.stringify(child)).score;
                if (bestState === null ||
                    (level % 2 === 0 ? childScore > score : childScore < score)) {
                  bestState = child;
                  score = childScore;
                }
              }
            }
            table.set(JSON.stringify(position), { score, bestState });
          }
        }
      }
    }
  }
  return table;
}

test('starts with one finger on each hand and gives A the first turn', () => {
  assert.deepEqual(INITIAL_STATE, [[1, 1], [1, 1], 0]);
  assert.equal(getResult(INITIAL_STATE), null);
  assert.equal(nextMoves(INITIAL_STATE).length, 4);
});

test('overflow follows the starter cutoff rule, including its helper boundary', () => {
  assert.equal(overflowSum(1, 3), 4);
  assert.equal(overflowSum(2, 3), 0);
  assert.equal(overflowSum(4, 4), 0);
  assert.equal(overflowSum(0, 5), 0);
  for (const [a, b] of [[-1, 1], [1, 6], [true, 1], [1.5, 2], ['2', 1]]) {
    assert.throws(() => overflowSum(a, b), Error);
  }
});

test('move metadata names the selected hands and preserves starter move order', () => {
  const state = [[4, 0], [1, 1], 0];
  const moves = legalMoves(state);

  assert.deepEqual(moves.map(({ nextState }) => nextState), nextMoves(state));
  assert.deepEqual(moves.map(({ kind }) => kind), [
    'attack', 'attack', 'split', 'split', 'split',
  ]);
  assert.deepEqual(moves.slice(0, 2).map(({ source, target }) => [source, target]), [
    [0, 0], [0, 1],
  ]);
  assert.deepEqual(moves.slice(2).map(({ newHands }) => newHands), [
    [3, 1], [2, 2], [1, 3],
  ]);
  assert.deepEqual(nextMoves(state), [
    [[4, 0], [0, 1], 1],
    [[4, 0], [1, 0], 1],
    [[3, 1], [1, 1], 1],
    [[2, 2], [1, 1], 1],
    [[1, 3], [1, 1], 1],
  ]);
});

test('a dead hand can be revived by a split, but cannot attack', () => {
  const moves = legalMoves([[0, 4], [1, 2], 0]);
  assert(moves.some((move) => move.kind === 'split' &&
    move.newHands[0] > 0 && move.newHands[1] > 0));
  assert(moves.every((move) => move.kind !== 'attack' || move.source === 1));
  assert(moves.every((move) => move.kind !== 'split' ||
    JSON.stringify(move.newHands) !== '[4,0]'));
});

test('terminal wins take priority over a tie at the horizon', () => {
  assert.equal(getResult([[0, 0], [1, 1], 20]), 'B');
  assert.equal(getResult([[1, 1], [0, 0], 20]), 'A');
  assert.equal(getResult([[1, 1], [1, 1], 20]), 'tie');
  assert.equal(getResult([[1, 1], [1, 1], 19]), null);
  assert.deepEqual(nextMoves([[0, 0], [1, 1], 4]), []);
});

test('state keys distinguish handedness and absolute turn level', () => {
  const states = [
    [[1, 4], [2, 3], 0],
    [[4, 1], [2, 3], 0],
    [[1, 4], [3, 2], 0],
    [[1, 4], [2, 3], 1],
  ];
  assert.equal(new Set(states.map(stateKey)).size, states.length);
});

test('golden positions match the Python assignment reference', () => {
  const examples = [
    [
      [[1, 1], [1, 1], 0],
      [
        [[1, 1], [2, 1], 1], [[1, 1], [1, 2], 1],
        [[0, 2], [1, 1], 1], [[2, 0], [1, 1], 1],
      ],
    ],
    [
      [[2, 2], [4, 0], 1],
      [
        [[0, 2], [4, 0], 2], [[2, 0], [4, 0], 2],
        [[2, 2], [3, 1], 2], [[2, 2], [2, 2], 2],
        [[2, 2], [1, 3], 2],
      ],
    ],
    [
      [[3, 1], [0, 4], 0],
      [
        [[3, 1], [0, 0], 1], [[2, 2], [0, 4], 1],
        [[0, 4], [0, 4], 1], [[4, 0], [0, 4], 1],
      ],
    ],
  ];
  for (const [position, successors] of examples) {
    assert.deepEqual(nextMoves(position), successors);
  }
  const opening = bestMoveDP(10).get(stateKey(INITIAL_STATE));
  assert.deepEqual(opening, { score: 0, bestState: [[1, 1], [2, 1], 1] });
});

test('all 1,250 ordered positions match the independent move oracle', () => {
  let checked = 0;
  for (let al = 0; al < 5; al += 1) {
    for (let ar = 0; ar < 5; ar += 1) {
      for (let bl = 0; bl < 5; bl += 1) {
        for (let br = 0; br < 5; br += 1) {
          for (const level of [0, 1]) {
            const position = [[al, ar], [bl, br], level];
            assert.deepEqual(nextMoves(position), referenceNextMoves(position),
              JSON.stringify(position));
            checked += 1;
          }
        }
      }
    }
  }
  assert.equal(checked, 1_250);
});

test('every 20-ply DP score and chosen child matches the independent oracle', () => {
  const expected = referenceDP(20);
  const table = bestMoveDP();
  assert(table instanceof Map);
  assert.equal(table.size, 625 * 21);
  assert.equal(expected.size, table.size);
  for (const [serializedState, expectedEntry] of expected) {
    const position = JSON.parse(serializedState);
    assert.deepEqual(table.get(stateKey(position)), expectedEntry,
      `DP row ${serializedState}`);
  }
});

test('the DP rejects unsupported horizons rather than building an unbounded table', () => {
  for (const depth of [-2, 0, 1, 3, 51, 100, true, '20']) {
    assert.throws(() => bestMoveDP(depth), Error);
  }
});

test('the browser graph and opening decision match the Python reference', () => {
  const graph = buildReachableGraph();
  assert.equal(graph.size, 1_116);
  assert.equal([...graph.values()].reduce((sum, edges) => sum + edges.length, 0), 4_080);

  const table = bestMoveDP();
  const choice = bestMove(INITIAL_STATE, table);
  assert.deepEqual(choice.nextState, [[1, 1], [2, 1], 1]);
  assert.equal(choice.score, 0);
  assert.equal(bestMove([[1, 1], [1, 1], 20], table), null);
});

test('the page contains every controller target exactly once', () => {
  const html = readFileSync(new URL('./web/index.html', import.meta.url), 'utf8');
  const controller = readFileSync(new URL('./web/app.js', import.meta.url), 'utf8');
  const htmlIds = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(htmlIds).size, htmlIds.length, 'Duplicate HTML IDs');
  const required = [...controller.matchAll(/byId\('([^']+)'\)/g)].map((match) => match[1]);
  for (const player of ['a', 'b']) {
    required.push(`player-${player}-card`);
    for (const hand of ['left', 'right']) required.push(`hand-${player}-${hand}`);
  }
  for (const id of required) assert(htmlIds.includes(id), `Missing #${id}`);
});

test('two optimal autonomous players finish within the fixed horizon', () => {
  const table = bestMoveDP();
  let position = structuredClone(INITIAL_STATE);
  while (getResult(position) === null) {
    const move = bestMove(position, table);
    assert(move, 'A live position must have a selected move');
    position = move.nextState;
  }
  assert.equal(position[2], 20);
  assert.equal(getResult(position), 'tie');
});
