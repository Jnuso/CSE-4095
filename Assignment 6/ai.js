// Bottom-up dynamic programming / minimax for the assignment's finite horizon.

import {
  DEFAULT_DEPTH,
  assertDepth,
  assertState,
  legalMoves,
  stateKey,
} from './game.js';

const HAND_LIMIT = 4;

function tableDepth(table) {
  if (!(table instanceof Map)) throw new TypeError('A minimax table is required.');
  return Number.isSafeInteger(table.depth) ? table.depth : DEFAULT_DEPTH;
}

/**
 * Build every DP row from the deepest level back to the initial level.
 * Rows store both the minimax value and the selected successor state.
 */
export function bestMoveDP(depth = DEFAULT_DEPTH) {
  assertDepth(depth);
  const table = new Map();
  Object.defineProperty(table, 'depth', { value: depth, enumerable: false });

  for (let level = depth; level >= 0; level -= 1) {
    for (let aLeft = 0; aLeft <= HAND_LIMIT; aLeft += 1) {
      for (let aRight = 0; aRight <= HAND_LIMIT; aRight += 1) {
        for (let bLeft = 0; bLeft <= HAND_LIMIT; bLeft += 1) {
          for (let bRight = 0; bRight <= HAND_LIMIT; bRight += 1) {
            const state = [[aLeft, aRight], [bLeft, bRight], level];
            const key = stateKey(state);
            const aDead = aLeft === 0 && aRight === 0;
            const bDead = bLeft === 0 && bRight === 0;

            // Terminal wins/losses take priority. A live state at the search
            // horizon is the assignment's maximum-depth tie.
            if (aDead || bDead || level === depth) {
              const score = aDead && !bDead ? -1 : bDead && !aDead ? 1 : 0;
              table.set(key, { score, bestState: null });
              continue;
            }

            const moves = legalMoves(state, depth);
            if (moves.length === 0) throw new Error('A live state has no legal moves.');

            const maximizing = level % 2 === 0;
            let bestState = null;
            let bestScore = maximizing ? -Infinity : Infinity;

            for (const move of moves) {
              const child = table.get(stateKey(move.nextState));
              if (!child) throw new Error('The bottom-up table is missing a child row.');
              if (bestState === null ||
                  (maximizing && child.score > bestScore) ||
                  (!maximizing && child.score < bestScore)) {
                bestState = move.nextState;
                bestScore = child.score;
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

/** Return the legal move selected by the table for this exact state and level. */
export function bestMove(state, table) {
  assertState(state);
  const depth = tableDepth(table);
  const entry = table.get(stateKey(state));
  if (!entry || entry.bestState === null) return null;

  const selectedKey = stateKey(entry.bestState);
  const move = legalMoves(state, depth).find(
    (candidate) => stateKey(candidate.nextState) === selectedKey,
  );
  if (!move) throw new Error('The minimax table selected an illegal move.');
  return { ...move, score: entry.score };
}

/**
 * Return each legal successor with its minimax value and whether the AI chose it.
 * The interface uses this instead of recreating any rule or AI logic.
 */
export function evaluateMoves(state, table) {
  assertState(state);
  const depth = tableDepth(table);
  const entry = table.get(stateKey(state));
  if (!entry || entry.bestState === null) return [];
  const selectedKey = stateKey(entry.bestState);

  return legalMoves(state, depth).map((move) => {
    const child = table.get(stateKey(move.nextState));
    if (!child) throw new Error('The minimax table is missing a legal successor.');
    return {
      ...move,
      score: child.score,
      selected: stateKey(move.nextState) === selectedKey,
    };
  });
}

export function outcomeLabel(score) {
  if (score === 1) return 'WIN for Player A';
  if (score === -1) return 'LOSS for Player A';
  if (score === 0) return 'TIE within 20 moves';
  throw new RangeError('A minimax score must be -1, 0, or +1.');
}
