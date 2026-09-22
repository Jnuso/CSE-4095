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
  buildCompletionStrategy,
  buildGameSolver,
  buildReachableGraph,
  chooseMove,
  getResult,
  legalMoves,
  nextMoves,
  overflowSum,
  playAutonomousGame,
  positionKey,
  stateKey,
} from './web/game.js';

const WEB_HTML = readFileSync(new URL('./web/index.html', import.meta.url), 'utf8');
const WEB_APP = readFileSync(new URL('./web/app.js', import.meta.url), 'utf8');
const WEB_CSS = readFileSync(new URL('./web/styles.css', import.meta.url), 'utf8');

function cssDeclarations(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = WEB_CSS.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert(match, `Missing CSS rule for ${selector}`);
  return match[1];
}

function functionSource(name) {
  const start = WEB_APP.search(new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`));
  assert.notEqual(start, -1, `Missing ${name}()`);
  const remainder = WEB_APP.slice(start);
  const next = remainder.slice(1).search(/\n(?:async\s+)?function\s+\w+\s*\(/);
  return next < 0 ? remainder : remainder.slice(0, next + 1);
}

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

function stateFromPositionKey(key) {
  const [a, b, level] = key.split('|');
  return [a.split(',').map(Number), b.split(',').map(Number), Number(level)];
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

test('only a knockout ends the game, regardless of the turn number', () => {
  assert.equal(getResult([[0, 0], [1, 1], 20]), 'B');
  assert.equal(getResult([[1, 1], [0, 0], 20]), 'A');
  for (const level of [19, 20, 21, 50, 1_000]) {
    const live = [[1, 1], [1, 1], level];
    assert.equal(getResult(live), null, `Live state ended at turn ${level}`);
    assert(legalMoves(live).length > 0, `Live state has no moves at turn ${level}`);
  }
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
  assert.equal(positionKey(states[0]), positionKey([[1, 4], [2, 3], 20]));
  assert.equal(positionKey(states[3]), positionKey([[1, 4], [2, 3], 101]));
  assert.notEqual(positionKey(states[0]), positionKey(states[3]));
});

test('golden move positions match the assignment reference', () => {
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

test('the parity-based AI selects legal moves before and after turn 20', () => {
  const table = bestMoveDP();
  assert(table instanceof Map);
  for (let al = 0; al < 5; al += 1) {
    for (let ar = 0; ar < 5; ar += 1) {
      for (let bl = 0; bl < 5; bl += 1) {
        for (let br = 0; br < 5; br += 1) {
          for (const level of [0, 1, 20, 21, 100, 101]) {
            const position = [[al, ar], [bl, br], level];
            const decision = bestMove(position, table);
            if (getResult(position) !== null) {
              assert.equal(decision, null, `Terminal state selected a move: ${stateKey(position)}`);
              continue;
            }
            assert(decision, `Missing AI move for ${stateKey(position)}`);
            assert(legalMoves(position).some((move) =>
              stateKey(move.nextState) === stateKey(decision.nextState)),
            `AI selected an illegal move for ${stateKey(position)}`);
            assert([-1, 0, 1].includes(decision.score), 'AI score must remain minimax-compatible');
          }
        }
      }
    }
  }
});

test('the infinite-horizon solver proves B wins the opening position', () => {
  const solver = buildGameSolver();
  const graph = buildReachableGraph();
  assert(solver instanceof Map);
  assert.equal(solver.size, graph.size);
  const opening = solver.get(positionKey(INITIAL_STATE));
  assert(opening, 'The solver is missing the opening position');
  assert.equal(opening.score, -1, 'Player B should be able to force the win');
  assert.equal(opening.distance, 26, 'Optimal play should take 26 moves');
  assert(opening.bestState);
  assert(legalMoves(INITIAL_STATE).some((move) =>
    positionKey(move.nextState) === positionKey(opening.bestState)));

  let draws = 0;
  for (const key of graph.keys()) {
    const position = stateFromPositionKey(key);
    const entry = solver.get(key);
    assert(entry, `Missing solver row ${key}`);
    assert([-1, 0, 1].includes(entry.score), `Invalid score for ${key}`);
    if (entry.score === 0) draws += 1;

    if (getResult(position) !== null) {
      assert.equal(entry.distance, 0);
      assert.equal(entry.bestState, null);
      continue;
    }

    assert(entry.bestState, `Live solver row has no move: ${key}`);
    assert(legalMoves(position).some((move) =>
      positionKey(move.nextState) === positionKey(entry.bestState)),
    `Solver selected an illegal move for ${key}`);
    const child = solver.get(positionKey(entry.bestState));
    assert.equal(child.score, entry.score, `Selected child changed value at ${key}`);
    if (entry.score === 0) {
      assert.equal(entry.distance, null);
    } else {
      assert.equal(entry.distance, child.distance + 1,
        `Solved distance did not decrease at ${key}`);
    }
  }
  assert.equal(draws, 52);
});

test('the completion strategy is acyclic and reaches a knockout from every live position', () => {
  const completion = buildCompletionStrategy();
  const graph = buildReachableGraph();
  assert(completion instanceof Map);
  assert.equal(completion.size, graph.size);

  let liveRows = 0;
  for (const key of graph.keys()) {
    const position = stateFromPositionKey(key);
    const entry = completion.get(key);
    assert(entry, `Missing completion row ${key}`);
    assert(Number.isSafeInteger(entry.distance) && entry.distance >= 0,
      `Invalid completion distance for ${key}`);

    if (getResult(position) !== null) {
      assert.equal(entry.distance, 0);
      assert.equal(entry.bestState, null);
      continue;
    }

    liveRows += 1;
    assert(entry.bestState, `Live row has no completion move: ${key}`);
    assert(legalMoves(position).some((move) =>
      positionKey(move.nextState) === positionKey(entry.bestState)),
    `Completion strategy selected an illegal move for ${key}`);
    const child = completion.get(positionKey(entry.bestState));
    assert(child, `Missing completion child for ${key}`);
    assert.equal(child.distance, entry.distance - 1,
      `Completion distance did not decrease for ${key}`);
  }
  assert(liveRows > 0);
});

test('the browser graph and opening decision match the Python reference', () => {
  const graph = buildReachableGraph();
  assert.equal(graph.size, 1_116);
  assert.equal([...graph.values()].reduce((sum, edges) => sum + edges.length, 0), 4_080);

  const table = bestMoveDP();
  const choice = bestMove(INITIAL_STATE, table);
  assert(choice);
  assert(legalMoves(INITIAL_STATE).some((move) =>
    stateKey(move.nextState) === stateKey(choice.nextState)));

  const afterTwenty = [[1, 1], [1, 1], 20];
  const laterChoice = bestMove(afterTwenty, table);
  assert(laterChoice, 'The AI must keep playing a live position after turn 20');
  assert(legalMoves(afterTwenty).some((move) =>
    stateKey(move.nextState) === stateKey(laterChoice.nextState)));
});

test('a repeated minimax child activates the cycle-free completion policy', () => {
  const solver = buildGameSolver();
  const completion = buildCompletionStrategy();
  let cycleState = null;
  let decision = null;

  for (let al = 0; al < 5 && !decision; al += 1) {
    for (let ar = 0; ar < 5 && !decision; ar += 1) {
      for (let bl = 0; bl < 5 && !decision; bl += 1) {
        for (let br = 0; br < 5 && !decision; br += 1) {
          for (const level of [0, 1]) {
            const candidate = [[al, ar], [bl, br], level];
            if (getResult(candidate) !== null ||
                solver.get(positionKey(candidate))?.score !== 0) continue;
            const primary = chooseMove(candidate, {
              solver,
              completion,
              visited: new Set(),
              completionMode: false,
            });
            if (!primary) continue;
            const repeated = chooseMove(candidate, {
              solver,
              completion,
              visited: new Set([positionKey(primary.nextState)]),
              completionMode: false,
            });
            if (repeated?.completionMode) {
              cycleState = candidate;
              decision = repeated;
              break;
            }
          }
        }
      }
    }
  }

  assert(cycleState, 'Expected at least one true draw state with a repeated solver child');
  assert(decision);
  assert.equal(decision.completionMode, true);
  assert.equal(decision.policy, 'completion');

  const before = completion.get(positionKey(cycleState));
  const after = completion.get(positionKey(decision.nextState));
  assert.equal(after.distance, before.distance - 1,
    'Once a cycle is detected, the selected move must make terminal progress');

  const following = chooseMove(decision.nextState, {
    solver,
    completion,
    visited: new Set([positionKey(cycleState), positionKey(decision.nextState)]),
    completionMode: decision.completionMode,
  });
  if (getResult(decision.nextState) === null) {
    assert(following);
    assert.equal(following.completionMode, true);
    assert.equal(following.policy, 'completion');
    const followingEntry = completion.get(positionKey(following.nextState));
    assert.equal(followingEntry.distance, after.distance - 1);
  }
});

test('the page contains every controller target exactly once', () => {
  const htmlIds = [...WEB_HTML.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(htmlIds).size, htmlIds.length, 'Duplicate HTML IDs');
  const required = [...WEB_APP.matchAll(/byId\('([^']+)'\)/g)].map((match) => match[1]);
  for (const player of ['a', 'b']) {
    required.push(`player-${player}-card`);
    for (const hand of ['left', 'right']) required.push(`hand-${player}-${hand}`);
  }
  for (const id of required) assert(htmlIds.includes(id), `Missing #${id}`);
});

test('the simplified arena keeps large responsive hands centered in the play area', () => {
  const row = cssDeclarations('.player-row');
  const pair = cssDeclarations('.hand-pair');
  const hand = cssDeclarations('.hand');
  const art = cssDeclarations('.hand-art svg');

  assert.match(row, /justify-content:\s*center/,
    'Each player row should center its contents');
  assert.match(pair, /justify-content:\s*center/,
    'Each pair of hands should remain centered as a unit');
  assert.match(hand, /(?:inline-size|width|min-width):\s*clamp\(/,
    'Hand controls should scale responsively instead of using a small fixed size');
  assert.match(art, /(?:inline-size|width):\s*clamp\(/,
    'Hand artwork should scale responsively with the arena');

  const handIds = [...WEB_HTML.matchAll(/<button\b[^>]*\bid="(hand-[ab]-(?:left|right))"/g)]
    .map((match) => match[1]);
  assert.deepEqual(new Set(handIds), new Set([
    'hand-a-left', 'hand-a-right', 'hand-b-left', 'hand-b-right',
  ]));
});

test('attack moves animate the exact source and target before state mutation', () => {
  const animation = functionSource('animateAttack');
  assert.match(animation, /move\.kind\s*!==\s*['"]attack['"]/,
    'Splits should not be presented as hand taps');
  assert.match(animation, /\.classList\.add\(['"]is-tapping['"]\)/);
  assert.match(animation, /\.classList\.add\(['"]is-receiving-tap['"]\)/);
  assert.match(animation, /\.classList\.add\(['"]is-animating['"]\)/);
  assert.match(WEB_APP, /\.classList\.remove\([^)]*['"]is-tapping['"]/);
  assert.match(WEB_APP, /\.classList\.remove\([^)]*['"]is-receiving-tap['"]/);
  assert.match(WEB_APP, /\.classList\.remove\(['"]is-animating['"]\)/);

  const commit = functionSource('commitMove');
  const animationCall = commit.search(/await\s+animateAttack\(\s*(?:state|positionBeforeMove)\s*,\s*chosen\s*,\s*sourceOverride\s*\)/);
  const stateMutation = commit.indexOf('state = structuredClone(chosen.nextState)');
  assert(animationCall >= 0, 'commitMove() must await its attack animation');
  assert(stateMutation >= 0, 'commitMove() must still apply the selected next state');
  assert(animationCall < stateMutation,
    'The old finger counts must remain visible until the hands finish tapping');
});

test('tap animation CSS has source, target, stage, and reduced-motion hooks', () => {
  assert.match(WEB_CSS, /@keyframes\s+hand-tap\b/);
  assert.match(WEB_CSS, /@keyframes\s+hand-receive-tap\b/);
  assert.match(cssDeclarations('.hand.is-tapping'), /animation:\s*hand-tap\b/);
  assert.match(cssDeclarations('.hand.is-receiving-tap'), /animation:\s*hand-receive-tap\b/);
  assert.match(WEB_CSS, /\.game-stage\.is-animating\b/,
    'The stage needs an animation-state hook to prevent conflicting interactions');

  const reducedStart = WEB_CSS.indexOf('@media (prefers-reduced-motion: reduce)');
  assert(reducedStart >= 0, 'Missing reduced-motion media query');
  const reducedEnd = WEB_CSS.indexOf('\n@media ', reducedStart + 1);
  const reduced = WEB_CSS.slice(reducedStart, reducedEnd < 0 ? undefined : reducedEnd);
  assert.match(reduced, /\.hand\.is-tapping/);
  assert.match(reduced, /\.hand\.is-receiving-tap/);
  assert.match(reduced, /animation:\s*none\s*!important/,
    'Tap motion should be fully disabled when reduced motion is requested');
});

test('the controller builds dynamic interface text without executable HTML sinks', () => {
  for (const [name, pattern] of [
    ['innerHTML', /\.innerHTML\s*=/],
    ['outerHTML', /\.outerHTML\s*=/],
    ['insertAdjacentHTML', /\.insertAdjacentHTML\s*\(/],
    ['document.write', /document\.write\s*\(/],
    ['eval', /\beval\s*\(/],
    ['Function constructor', /\bnew\s+Function\s*\(/],
  ]) {
    assert.doesNotMatch(WEB_APP, pattern, `${name} can turn dynamic text into executable markup`);
  }
  assert.doesNotMatch(WEB_HTML, /\son[a-z]+\s*=/i,
    'Event handlers belong in the controller, not executable HTML attributes');
  assert.doesNotMatch(WEB_HTML, /\b(?:href|src)\s*=\s*["']\s*javascript:/i,
    'The page must not contain javascript: URLs');
});

test('the interface does not present turn 20 as a game-ending horizon', () => {
  const status = functionSource('renderStatus');
  assert.doesNotMatch(status, /Turn\s*\$\{[^}]+\}\s*of\s*\$\{/,
    'Turn status must not display a fixed final turn');
  assert.doesNotMatch(status, /survived the 20-turn horizon/i);
  assert.doesNotMatch(WEB_HTML, /20-turn (?:limit|horizon)/i);
});

test('autonomous play survives cycles and stops only after a knockout', () => {
  const run = playAutonomousGame();
  assert(run && typeof run === 'object');
  assert(['A', 'B'].includes(run.result), 'Autonomous play must produce a winner');
  assert.equal(getResult(run.state), run.result);
  assert(Array.isArray(run.moves) && run.moves.length > 0);
  assert.equal(run.result, 'B');
  assert.equal(run.moves.length, 26);
  assert.equal(run.completionMode, false,
    'The solved opening line should finish without needing cycle fallback');

  let position = structuredClone(INITIAL_STATE);
  for (const [index, move] of run.moves.entries()) {
    assert.equal(getResult(position), null,
      `Autonomous play continued after move ${index} had already ended the game`);
    assert(legalMoves(position).some((candidate) =>
      stateKey(candidate.nextState) === stateKey(move.nextState)),
    `Autonomous move ${index + 1} was illegal`);
    position = move.nextState;
  }
  assert.deepEqual(position, run.state);
  assert.equal(position[2], run.moves.length);
  assert.equal(getResult(position), run.result);
  assert(position[0].every((value) => value === 0) ||
    position[1].every((value) => value === 0),
  'Autonomous play must stop because both hands of one player were knocked out');
});
