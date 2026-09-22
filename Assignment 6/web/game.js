// Pure game rules and the finite-horizon minimax table. No DOM access.
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

function positionKey(state) {
  return `${state[0][0]},${state[0][1]}|${state[1][0]},${state[1][1]}|${state[2] % 2}`;
}

export function overflowSum(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b) ||
      a < 0 || b < 0 || a > KNOCKOUT_TOTAL || b > KNOCKOUT_TOTAL) {
    throw new RangeError('Tap values must be integers from 0 through 5.');
  }
  return a + b >= KNOCKOUT_TOTAL ? 0 : a + b;
}

export function getResult(state, depth = DEFAULT_DEPTH) {
  assertState(state);
  assertDepth(depth);
  if (state[2] > depth) {
    throw new RangeError('The state level exceeds the horizon.');
  }
  const aDead = state[0][0] === 0 && state[0][1] === 0;
  const bDead = state[1][0] === 0 && state[1][1] === 0;
  if (aDead && bDead) return 'tie'; // Synthetic row in the complete DP table.
  if (aDead) return 'B';
  if (bDead) return 'A';
  return state[2] === depth ? 'tie' : null;
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
            const result = getResult(state, depth);
            if (result !== null) {
              table.set(key, { score: result === 'A' ? 1 : result === 'B' ? -1 : 0, bestState: null });
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
  const entry = table.get(stateKey(state));
  if (!entry || entry.bestState === null) return null;
  const target = stateKey(entry.bestState);
  const move = legalMoves(state).find((candidate) => stateKey(candidate.nextState) === target);
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
