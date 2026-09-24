// Bottom-up dynamic programming / minimax for the assignment's finite horizon.
//
// Classic (non-module) script: needs game.js loaded first in the browser
// (global ChopsticksGame) and publishes the global ChopsticksAI. Under Node it is
// loaded with require('./ai.js') for testing.

(function (root) {
  'use strict';

  const game = (typeof module !== 'undefined' && module.exports)
    ? require('./game.js')
    : root.ChopsticksGame;
  if (!game) throw new Error('game.js must be loaded before ai.js.');
  const {
    DEFAULT_DEPTH,
    INITIAL_STATE,
    assertDepth,
    assertState,
    getResult,
    legalMoves,
    stateKey,
  } = game;

  const HAND_LIMIT = 4;

  function tableDepth(table) {
    if (!(table instanceof Map)) throw new TypeError('A minimax table is required.');
    return Number.isSafeInteger(table.depth) ? table.depth : DEFAULT_DEPTH;
  }

  /**
   * Build every DP row from the deepest level back to the initial level.
   * Rows store both the minimax value and the selected successor state.
   */
  function bestMoveDP(depth = DEFAULT_DEPTH) {
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
  function bestMove(state, table) {
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
  function evaluateMoves(state, table) {
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

  function outcomeLabel(score, depth = DEFAULT_DEPTH) {
    assertDepth(depth);
    if (score === 1) return 'WIN for Player A';
    if (score === -1) return 'LOSS for Player A';
    if (score === 0) return `TIE within ${depth} moves`;
    throw new RangeError('A minimax score must be -1, 0, or +1.');
  }

  /** Compare a complete bottom-up table with uncached recursion from the same opening. */
  function compareSearch(depth = 6) {
    assertDepth(depth);
    if (depth > 8) throw new RangeError('The uncached comparison is limited to depth 8.');
    const now = () => globalThis.performance?.now?.() ?? 0;
    const dpStarted = now();
    const table = bestMoveDP(depth);
    const dpMs = now() - dpStarted;
    const visited = new Set();
    let recursiveVisits = 0;

    function recurse(position) {
      recursiveVisits += 1;
      visited.add(stateKey(position));
      const result = getResult(position, depth);
      if (result !== null) return result === 'A' ? 1 : result === 'B' ? -1 : 0;
      const values = legalMoves(position, depth).map((move) => recurse(move.nextState));
      return position[2] % 2 === 0 ? Math.max(...values) : Math.min(...values);
    }

    const recursiveStarted = now();
    const recursiveScore = recurse(INITIAL_STATE);
    const recursiveMs = now() - recursiveStarted;
    const dpScore = table.get(stateKey(INITIAL_STATE)).score;
    if (dpScore !== recursiveScore) throw new Error('DP and recursion disagree on the opening score.');
    return {
      depth, score: dpScore, dpRows: table.size, dpMs,
      recursiveVisits, distinctReachable: visited.size, recursiveMs,
    };
  }

  const api = {
    bestMoveDP,
    bestMove,
    evaluateMoves,
    outcomeLabel,
    compareSearch,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ChopsticksAI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
