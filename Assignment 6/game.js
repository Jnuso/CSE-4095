// Starter-compatible Chopsticks rules and state transitions.
// AI search belongs in ai.js so the interface and AI share one rule engine.

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

export function assertDepth(depth) {
  if (!Number.isSafeInteger(depth) || depth < 2 || depth > 50 || depth % 2 !== 0) {
    throw new RangeError('The horizon must be an even integer from 2 through 50.');
  }
}

export function stateKey(state) {
  assertState(state);
  return `${state[0][0]},${state[0][1]}|${state[1][0]},${state[1][1]}|${state[2]}`;
}

export function overflowSum(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b) ||
      a < 0 || b < 0 || a > KNOCKOUT_TOTAL || b > KNOCKOUT_TOTAL) {
    throw new RangeError('Tap values must be integers from 0 through 5.');
  }
  return a + b >= KNOCKOUT_TOTAL ? 0 : a + b;
}

/**
 * Return A, B, or tie when a state is complete; otherwise return null.
 * A real knockout takes precedence over the assignment's depth-limit tie.
 */
export function getResult(state, depth = DEFAULT_DEPTH) {
  assertState(state);
  assertDepth(depth);
  const aDead = state[0][0] === 0 && state[0][1] === 0;
  const bDead = state[1][0] === 0 && state[1][1] === 0;
  if (aDead && bDead) return 'tie'; // Unreachable in legal play, present in the full table.
  if (aDead) return 'B';
  if (bDead) return 'A';
  if (state[2] >= depth) return 'tie';
  return null;
}

/**
 * Generate every legal attack and redistribution using the starter-code rules.
 * Duplicate resulting states are removed without changing the first move's order.
 */
export function legalMoves(state, depth = DEFAULT_DEPTH) {
  assertState(state);
  assertDepth(depth);
  if (getResult(state, depth) !== null) return [];

  const [a, b, level] = state;
  const actor = level % 2;
  const opponent = 1 - actor;
  const current = state[actor];
  const other = state[opponent];
  const moves = [];
  const seen = new Set();

  function addMove(move, nextState) {
    const key = stateKey(nextState);
    if (seen.has(key)) return;
    seen.add(key);
    moves.push({ ...move, nextState });
  }

  // An attack must use an active source and target hand.
  for (let source = 0; source < 2; source += 1) {
    if (current[source] === 0) continue;
    for (let target = 0; target < 2; target += 1) {
      if (other[target] === 0) continue;
      const newOther = [...other];
      newOther[target] = overflowSum(current[source], other[target]);
      addMove(
        { kind: 'attack', source, target },
        [
          opponent === 0 ? newOther : [...a],
          opponent === 1 ? newOther : [...b],
          level + 1,
        ],
      );
    }
  }

  // A redistribution transfers one or more fingers between the actor's hands.
  // It may revive a zero hand, but may not exceed four or merely swap labels.
  for (let donor = 0; donor < 2; donor += 1) {
    const receiver = 1 - donor;
    for (let amount = 1; amount <= current[donor]; amount += 1) {
      if (current[receiver] + amount > HAND_LIMIT) continue;
      const newHands = [...current];
      newHands[donor] -= amount;
      newHands[receiver] += amount;
      if (newHands[0] === current[1] && newHands[1] === current[0]) continue;
      addMove(
        { kind: 'split', newHands },
        [
          actor === 0 ? newHands : [...a],
          actor === 1 ? newHands : [...b],
          level + 1,
        ],
      );
    }
  }

  return moves;
}

export function nextMoves(state, depth = DEFAULT_DEPTH) {
  return legalMoves(state, depth).map(({ nextState }) => nextState);
}
