// Pure rules, starter-compatible finite DP, and the browser's cyclic solver.
export const DEFAULT_DEPTH = 20;
export const INITIAL_STATE = Object.freeze([[1, 1], [1, 1], 0]);

const HAND_LIMIT = 4;
const KNOCKOUT_TOTAL = 5;

function assertHand(hand) {
  if (!Array.isArray(hand) || hand.length !== 2 ||
      hand.some((value) => !Number.isInteger(value) || value < 0 || value > HAND_LIMIT)) {
    throw new RangeError('Each hand pair must contain two integers from 0 through 4.');
  }
}

export function assertState(state) {
  if (!Array.isArray(state) || state.length !== 3) {
    throw new TypeError('A state must contain A hands, B hands, and a level.');
  }
  assertHand(state[0]);
  assertHand(state[1]);
  if (!Number.isSafeInteger(state[2]) || state[2] < 0) {
    throw new RangeError('The level must be a nonnegative integer.');
  }
}

function assertDepth(depth) {
  if (!Number.isSafeInteger(depth) || depth < 2 || depth > 50 || depth % 2 !== 0) {
    throw new RangeError('The horizon must be an even number from 2 through 50.');
  }
}

export function stateKey(state) {
  assertState(state);
  return `${state[0][0]},${state[0][1]}|${state[1][0]},${state[1][1]}|${state[2]}`;
}

export function positionKey(state) {
  assertState(state);
  return `${state[0][0]},${state[0][1]}|${state[1][0]},${state[1][1]}|${state[2] % 2}`;
}

function normalizedPosition(state) {
  return [[...state[0]], [...state[1]], state[2] % 2];
}

export function overflowSum(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b) ||
      a < 0 || b < 0 || a > KNOCKOUT_TOTAL || b > KNOCKOUT_TOTAL) {
    throw new RangeError('Tap values must be integers from 0 through 5.');
  }
  return a + b >= KNOCKOUT_TOTAL ? 0 : a + b;
}

export function getResult(state) {
  assertState(state);
  const aDead = state[0][0] === 0 && state[0][1] === 0;
  const bDead = state[1][0] === 0 && state[1][1] === 0;
  if (aDead && bDead) return 'tie'; // Synthetic row in the complete DP table.
  if (aDead) return 'B';
  if (bDead) return 'A';
  return null;
}

export function legalMoves(state) {
  assertState(state);
  const [a, b, level] = state;
  if ((a[0] === 0 && a[1] === 0) || (b[0] === 0 && b[1] === 0)) return [];

  const actor = level % 2;
  const opponent = 1 - actor;
  const current = state[actor];
  const other = state[opponent];
  const moves = [];
  const seen = new Set();

  function addMove(move, nextHands) {
    const nextState = [
      actor === 0 ? nextHands : [...a],
      actor === 1 ? nextHands : [...b],
      level + 1,
    ];
    const key = stateKey(nextState);
    if (!seen.has(key)) {
      seen.add(key);
      moves.push({ ...move, nextState });
    }
  }

  for (let source = 0; source < 2; source += 1) {
    if (current[source] === 0) continue;
    for (let target = 0; target < 2; target += 1) {
      if (other[target] === 0) continue;
      const newOther = [...other];
      newOther[target] = overflowSum(current[source], other[target]);
      // A tap changes the opponent's pair, not the actor's pair.
      const nextState = [
        opponent === 0 ? newOther : [...a],
        opponent === 1 ? newOther : [...b],
        level + 1,
      ];
      const key = stateKey(nextState);
      if (!seen.has(key)) {
        seen.add(key);
        moves.push({ kind: 'attack', source, target, nextState });
      }
    }
  }

  for (let donor = 0; donor < 2; donor += 1) {
    const receiver = 1 - donor;
    for (let amount = 1; amount <= current[donor]; amount += 1) {
      if (current[receiver] + amount > HAND_LIMIT) continue;
      const newHands = [...current];
      newHands[donor] -= amount;
      newHands[receiver] += amount;
      // The starter disallows a move that merely swaps labeled hands.
      if (newHands[0] === current[1] && newHands[1] === current[0]) continue;
      addMove({ kind: 'split', newHands }, newHands);
    }
  }

  return moves;
}

export function nextMoves(state) {
  return legalMoves(state).map(({ nextState }) => nextState);
}

export function bestMoveDP(depth = DEFAULT_DEPTH) {
  assertDepth(depth);
  const table = new Map();

  for (let level = depth; level >= 0; level -= 1) {
    for (let aLeft = 0; aLeft <= HAND_LIMIT; aLeft += 1) {
      for (let aRight = 0; aRight <= HAND_LIMIT; aRight += 1) {
        for (let bLeft = 0; bLeft <= HAND_LIMIT; bLeft += 1) {
          for (let bRight = 0; bRight <= HAND_LIMIT; bRight += 1) {
            const state = [[aLeft, aRight], [bLeft, bRight], level];
            const key = stateKey(state);
            const aDead = aLeft === 0 && aRight === 0;
            const bDead = bLeft === 0 && bRight === 0;
            if (aDead || bDead || level === depth) {
              const score = aDead && !bDead ? -1 : bDead && !aDead ? 1 : 0;
              table.set(key, { score, bestState: null });
              continue;
            }

            const moves = legalMoves(state);
            if (moves.length === 0) throw new Error('A live state has no legal moves.');
            const maximizing = level % 2 === 0;
            let bestState = null;
            let bestScore = maximizing ? -Infinity : Infinity;
            for (const move of moves) {
              const child = table.get(stateKey(move.nextState));
              if (!child) throw new Error('The bottom-up table is missing a child.');
              if (bestState === null ||
                  (maximizing && child.score > bestScore) ||
                  (!maximizing && child.score < bestScore)) {
                bestScore = child.score;
                bestState = move.nextState;
              }
            }
            table.set(key, { score: bestScore, bestState });
          }
        }
      }
    }
  }
  return table;
}

export function bestMove(state, table) {
  assertState(state);
  if (!(table instanceof Map)) throw new TypeError('A minimax table is required.');
  const searchState = normalizedPosition(state);
  const entry = table.get(stateKey(searchState));
  if (!entry || entry.bestState === null) return null;
  const target = positionKey(entry.bestState);
  const move = legalMoves(state).find((candidate) => positionKey(candidate.nextState) === target);
  if (!move) throw new Error('The minimax table selected an illegal move.');
  return { ...move, score: entry.score };
}

export function buildReachableGraph() {
  const start = [[1, 1], [1, 1], 0];
  const graph = new Map();
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const state = queue[head++];
    const key = positionKey(state);
    if (graph.has(key)) continue;
    const children = nextMoves(state);
    graph.set(key, children.map(positionKey));
    for (const child of children) {
      const normalized = [child[0], child[1], child[2] % 2];
      if (!graph.has(positionKey(normalized))) queue.push(normalized);
    }
  }
  return graph;
}

function collectReachablePositions() {
  const states = new Map();
  const edges = new Map();
  const queue = [structuredClone(INITIAL_STATE)];
  let head = 0;
  while (head < queue.length) {
    const state = normalizedPosition(queue[head++]);
    const key = positionKey(state);
    if (states.has(key)) continue;
    states.set(key, state);
    const children = legalMoves(state).map(({ nextState }) => normalizedPosition(nextState));
    edges.set(key, children);
    for (const child of children) {
      if (!states.has(positionKey(child))) queue.push(child);
    }
  }
  return { states, edges };
}

export function buildGameSolver() {
  const { states, edges } = collectReachablePositions();
  const solver = new Map();

  for (const [key, state] of states) {
    const result = getResult(state);
    if (result === 'A' || result === 'B') {
      solver.set(key, {
        score: result === 'A' ? 1 : -1,
        distance: 0,
        bestState: null,
      });
    }
  }

  // Resolve the cyclic graph in attractor waves. A chooses +1 whenever it
  // can and B chooses -1 whenever it can. A state is a forced loss only once
  // every successor is already a forced win for the opponent.
  while (true) {
    const additions = [];
    for (const [key, state] of states) {
      if (solver.has(key)) continue;
      const children = edges.get(key) ?? [];
      const childEntries = children.map((child) => solver.get(positionKey(child)));
      const aTurn = state[2] % 2 === 0;
      const winningScore = aTurn ? 1 : -1;
      const losingScore = -winningScore;
      const winningChildren = children.filter(
        (child) => solver.get(positionKey(child))?.score === winningScore,
      );

      let score = null;
      let candidates = [];
      let finishQuickly = false;
      if (winningChildren.length > 0) {
        score = winningScore;
        candidates = winningChildren;
        finishQuickly = true;
      } else if (childEntries.length > 0 &&
                 childEntries.every((entry) => entry?.score === losingScore)) {
        score = losingScore;
        candidates = children;
      }
      if (score === null) continue;

      let bestState = candidates[0];
      for (const child of candidates.slice(1)) {
        const childDistance = solver.get(positionKey(child)).distance;
        const bestDistance = solver.get(positionKey(bestState)).distance;
        if ((finishQuickly && childDistance < bestDistance) ||
            (!finishQuickly && childDistance > bestDistance)) {
          bestState = child;
        }
      }
      additions.push([key, {
        score,
        distance: solver.get(positionKey(bestState)).distance + 1,
        bestState,
      }]);
    }
    if (additions.length === 0) break;
    for (const [key, entry] of additions) solver.set(key, entry);
  }

  // Unresolved states are genuine minimax draws caused by cycles. Preserve a
  // draw when possible; chooseMove can later switch to the completion policy
  // if that choice begins repeating during a demonstration.
  for (const [key] of states) {
    if (!solver.has(key)) solver.set(key, { score: 0, distance: null, bestState: null });
  }
  for (const [key, state] of states) {
    const entry = solver.get(key);
    if (entry.score !== 0) continue;
    const drawChild = (edges.get(key) ?? []).find(
      (child) => solver.get(positionKey(child)).score === 0,
    );
    if (!drawChild) throw new Error('A drawn state has no draw-preserving move.');
    solver.set(key, { ...entry, bestState: drawChild });
  }
  return solver;
}

function solvedMove(state, solver) {
  if (!(solver instanceof Map)) throw new TypeError('A cyclic game solver is required.');
  const entry = solver.get(positionKey(state));
  if (!entry || entry.bestState === null) return null;
  const target = positionKey(entry.bestState);
  const move = legalMoves(state).find((candidate) => positionKey(candidate.nextState) === target);
  if (!move) throw new Error('The cyclic game solver selected an illegal move.');
  return { ...move, score: entry.score, distance: entry.distance, policy: 'minimax' };
}

export function buildCompletionStrategy() {
  const states = new Map();
  const edges = new Map();
  const reverse = new Map();
  const queue = [structuredClone(INITIAL_STATE)];
  let head = 0;

  while (head < queue.length) {
    const state = normalizedPosition(queue[head++]);
    const key = positionKey(state);
    if (states.has(key)) continue;
    states.set(key, state);
    const children = legalMoves(state).map(({ nextState }) => normalizedPosition(nextState));
    edges.set(key, children);
    if (!reverse.has(key)) reverse.set(key, []);
    for (const child of children) {
      const childKey = positionKey(child);
      if (!reverse.has(childKey)) reverse.set(childKey, []);
      reverse.get(childKey).push(key);
      if (!states.has(childKey)) queue.push(child);
    }
  }

  // Distance is the fewest progress-making moves to any real knockout.
  const distance = new Map();
  const distanceQueue = [];
  for (const [key, state] of states) {
    const result = getResult(state);
    if (result === 'A' || result === 'B') {
      distance.set(key, 0);
      distanceQueue.push(key);
    }
  }
  for (let index = 0; index < distanceQueue.length; index += 1) {
    const childKey = distanceQueue[index];
    for (const parentKey of reverse.get(childKey) ?? []) {
      if (!distance.has(parentKey)) {
        distance.set(parentKey, distance.get(childKey) + 1);
        distanceQueue.push(parentKey);
      }
    }
  }
  if (distance.size !== states.size) {
    throw new Error('Some reachable game positions cannot progress to a knockout.');
  }

  const strategy = new Map();
  const greatestDistance = Math.max(...distance.values());
  for (let step = 0; step <= greatestDistance; step += 1) {
    for (const [key, state] of states) {
      if (distance.get(key) !== step) continue;
      const result = getResult(state);
      if (step === 0) {
        strategy.set(key, {
          distance: 0,
          score: result === 'A' ? 1 : -1,
          bestState: null,
        });
        continue;
      }

      const candidates = (edges.get(key) ?? []).filter(
        (child) => distance.get(positionKey(child)) === step - 1,
      );
      const maximizing = state[2] % 2 === 0;
      let bestState = null;
      let bestScore = maximizing ? -Infinity : Infinity;
      for (const child of candidates) {
        const childEntry = strategy.get(positionKey(child));
        if (!childEntry) throw new Error('The completion strategy is missing a child.');
        if (bestState === null ||
            (maximizing && childEntry.score > bestScore) ||
            (!maximizing && childEntry.score < bestScore)) {
          bestState = child;
          bestScore = childEntry.score;
        }
      }
      if (bestState === null) throw new Error('A live position has no progress-making move.');
      strategy.set(key, { distance: step, score: bestScore, bestState });
    }
  }
  return strategy;
}

function completionMove(state, strategy) {
  if (!(strategy instanceof Map)) throw new TypeError('A completion strategy is required.');
  const entry = strategy.get(positionKey(state));
  if (!entry || entry.bestState === null) return null;
  const target = positionKey(entry.bestState);
  const move = legalMoves(state).find((candidate) => positionKey(candidate.nextState) === target);
  if (!move) throw new Error('The completion strategy selected an illegal move.');
  return { ...move, score: entry.score, distance: entry.distance, policy: 'completion' };
}

export function chooseMove(state, {
  solver = null,
  table,
  completion,
  visited = new Set(),
  completionMode = false,
} = {}) {
  assertState(state);
  if (!(visited instanceof Set)) throw new TypeError('Visited positions must be a Set.');
  const minimaxMove = solver === null ? bestMove(state, table) : solvedMove(state, solver);
  if (minimaxMove === null) return null;
  const repeatsPosition = visited.has(positionKey(minimaxMove.nextState));
  if (completionMode || repeatsPosition) {
    const progressMove = completionMove(state, completion);
    if (!progressMove) return null;
    return { ...progressMove, completionMode: true };
  }
  return { ...minimaxMove, policy: 'minimax', completionMode: false };
}

export function playAutonomousGame() {
  const solver = buildGameSolver();
  const completion = buildCompletionStrategy();
  const visited = new Set([positionKey(INITIAL_STATE)]);
  const moves = [];
  let state = structuredClone(INITIAL_STATE);
  let completionMode = false;

  // The graph contains 1,116 reachable positions. Once a cycle is detected,
  // completion distance falls every turn, so this guard should never be hit.
  while (getResult(state) === null && moves.length <= 2_500) {
    const move = chooseMove(state, { solver, completion, visited, completionMode });
    if (!move) throw new Error('A live autonomous position has no move.');
    completionMode = move.completionMode;
    moves.push(move);
    state = structuredClone(move.nextState);
    visited.add(positionKey(state));
  }
  const result = getResult(state);
  if (result !== 'A' && result !== 'B') {
    throw new Error('Autonomous play did not reach a knockout.');
  }
  return { state, result, moves, completionMode };
}
