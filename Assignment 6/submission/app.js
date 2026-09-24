'use strict';

// game.js and ai.js are classic scripts loaded before this file (see index.html).
// They publish ChopsticksGame and ChopsticksAI, so no ES-module imports are
// needed and the page also works when index.html is opened directly (file://).
const {
  DEFAULT_DEPTH,
  INITIAL_STATE,
  getResult,
  legalMoves,
  stateKey,
} = window.ChopsticksGame;
const {
  bestMove,
  bestMoveDP,
  compareSearch,
  evaluateMoves,
  outcomeLabel,
} = window.ChopsticksAI;

const byId = (id) => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing interface element: ${id}`);
  return element;
};

const ui = {
  modeHuman: byId('mode-human'),
  modeLocal: byId('mode-local'),
  modeAuto: byId('mode-auto'),
  soundToggle: byId('sound-toggle'),
  searchDepth: byId('search-depth'),
  playerA: byId('player-a'),
  playerB: byId('player-b'),
  playerControls: byId('player-controls'),
  restart: byId('restart-button'),
  split: byId('split-button'),
  title: byId('status-title'),
  detail: byId('status-detail'),
  turn: byId('turn-count'),
  remaining: byId('remaining-moves'),
  gameLimitDescription: byId('game-limit-description'),
  actionTurnLabel: byId('action-turn-label'),
  moveOptions: byId('move-options'),
  autoControls: byId('auto-controls'),
  autoPlay: byId('auto-play'),
  autoStep: byId('auto-step'),
  autoSpeed: byId('auto-speed'),
  autoSpeedLabel: byId('auto-speed-label'),
  history: byId('history-list'),
  treePath: byId('tree-played-path'),
  treeReviewControls: byId('tree-review-controls'),
  treeReviewLabel: byId('tree-review-label'),
  treeReviewPrevious: byId('tree-review-previous'),
  treeReviewNext: byId('tree-review-next'),
  treeReviewFinal: byId('tree-review-final'),
  treeReviewNote: byId('tree-review-note'),
  graphCurrent: byId('graph-current'),
  graphChoices: byId('graph-choices'),
  treeImpact: byId('tree-impact'),
  treeReplies: byId('tree-replies'),
  aiToggle: byId('ai-toggle'),
  aiContent: byId('ai-analysis-content'),
  aiAdvanced: byId('ai-advanced-details'),
  aiRole: byId('ai-role'),
  aiState: byId('ai-state'),
  aiTurnSimple: byId('ai-turn-simple'),
  aiScore: byId('ai-score'),
  aiRawScore: byId('ai-raw-score'),
  aiReason: byId('ai-reason'),
  aiSelected: byId('ai-selected'),
  advancedIntro: byId('advanced-intro'),
  tieKeyDescription: byId('tie-key-description'),
  dpStatsIntro: byId('dp-stats-intro'),
  dpStatsHelpText: byId('dp-stats-help-text'),
  rulesReminder: byId('rules-reminder'),
  dpTableRows: byId('dp-table-rows'),
  dpBuildTime: byId('dp-build-time'),
  dpCurrentLevel: byId('dp-current-level'),
  dpMovesRemaining: byId('dp-moves-remaining'),
  dpLegalBranches: byId('dp-legal-branches'),
  dpActiveRole: byId('dp-active-role'),
  dpDepthProgress: byId('dp-depth-progress'),
  dpProgressLabel: byId('dp-progress-label'),
  dpProgressBar: byId('dp-progress-bar'),
  advantageRun: byId('advantage-run'),
  advantageResults: byId('advantage-results'),
  comparisonRun: byId('comparison-run'),
  comparisonResults: byId('comparison-results'),
};

const HAND_NAMES = ['left', 'right'];
const tableBuildStarted = clockNow();
let searchDepth = DEFAULT_DEPTH;
let minimaxTable = bestMoveDP(searchDepth);
let tableBuildDuration = clockNow() - tableBuildStarted;
const tableCache = new Map([[DEFAULT_DEPTH, { table: minimaxTable, duration: tableBuildDuration }]]);
let state = structuredClone(INITIAL_STATE);
let mode = 'human';
let humanPlayer = 'A';
let selectedSource = null;
let showingSplits = false;
let history = [];
let lastExplanation = '';
let autoRunning = false;
let pendingTimer = null;
let generation = 0;
let gameRevision = 0;
let isAnimating = false;
let previewedMoveKey = null;
let reviewedMoveIndex = null;
let soundEnabled = false;
let audioContext = null;
let animationSequence = 0;

function clockNow() {
  return globalThis.performance?.now?.() ?? Date.now();
}

function getTableAtDepth(depth) {
  let cached = tableCache.get(depth);
  if (!cached) {
    const started = clockNow();
    const table = bestMoveDP(depth);
    cached = { table, duration: clockNow() - started };
    tableCache.set(depth, cached);
  }
  return cached;
}

function currentPlayer(position = state) {
  return position[2] % 2 === 0 ? 'A' : 'B';
}

function opposite(player) {
  return player === 'A' ? 'B' : 'A';
}

function handsFor(position, player) {
  return position[player === 'A' ? 0 : 1];
}

function scoreShort(score) {
  if (score === 1) return '+1 · WIN for A';
  if (score === -1) return '−1 · LOSS for A';
  return `0 · TIE within ${searchDepth} moves`;
}

function scoreDetail(score) {
  if (score === 1) return `Player A can force a knockout before the ${searchDepth}-move limit.`;
  if (score === -1) return `Player B can force a knockout before the ${searchDepth}-move limit.`;
  return `Neither player can force a knockout before the ${searchDepth}-move limit, so optimal play is scored as a tie.`;
}

function beginnerOutcome(score) {
  if (score === 1) return 'Player A is expected to win';
  if (score === -1) return 'Player B is expected to win';
  return `A tie is expected by move ${searchDepth}`;
}

function compactState(position) {
  return `A ${position[0][0]} · ${position[0][1]} / B ${position[1][0]} · ${position[1][1]} / level ${position[2]}`;
}

function moveLabel(position, move, sourceOverride = null) {
  const player = currentPlayer(position);
  const source = sourceOverride ?? move.source;
  if (move.kind === 'attack') {
    const targetPlayer = opposite(player);
    const sourceCount = handsFor(position, player)[source];
    const before = handsFor(position, targetPlayer)[move.target];
    const after = handsFor(move.nextState, targetPlayer)[move.target];
    return `${player} ${HAND_NAMES[source]} (${sourceCount}) taps ${targetPlayer} ${HAND_NAMES[move.target]} (${before} → ${after})`;
  }
  const before = handsFor(position, player);
  return `${player} splits ${before[0]} · ${before[1]} → ${move.newHands[0]} · ${move.newHands[1]}`;
}

function handSvg(count) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 104 118');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('hand-svg');

  const thumb = document.createElementNS(ns, 'path');
  thumb.setAttribute('d', 'M22 66 C8 55 4 65 9 76 L23 91 Z');
  thumb.setAttribute('class', 'hand-thumb');
  svg.append(thumb);

  const fingerSpecs = [
    [22, 27, 44],
    [37, 16, 55],
    [52, 13, 58],
    [67, 25, 46],
  ];
  fingerSpecs.forEach(([x, y, height], index) => {
    const finger = document.createElementNS(ns, 'rect');
    finger.setAttribute('x', String(x));
    finger.setAttribute('y', String(y));
    finger.setAttribute('width', '13');
    finger.setAttribute('height', String(height));
    finger.setAttribute('rx', '6.5');
    finger.setAttribute('class', index < count ? 'finger finger--active' : 'finger finger--inactive');
    svg.append(finger);
  });

  const palm = document.createElementNS(ns, 'rect');
  palm.setAttribute('x', '18');
  palm.setAttribute('y', '58');
  palm.setAttribute('width', '68');
  palm.setAttribute('height', '49');
  palm.setAttribute('rx', '19');
  palm.setAttribute('class', 'hand-palm');
  svg.append(palm);
  return svg;
}

function humanMayMove() {
  return !isAnimating && (mode === 'local' || (mode === 'human' && currentPlayer() === humanPlayer)) &&
    getResult(state, searchDepth) === null;
}

function renderHands() {
  for (const player of ['A', 'B']) {
    for (let index = 0; index < 2; index += 1) {
      const button = byId(`hand-${player.toLowerCase()}-${HAND_NAMES[index]}`);
      const count = handsFor(state, player)[index];
      const ownHand = player === (mode === 'local' ? currentPlayer() : humanPlayer);
      const available = humanMayMove() && count > 0 &&
        ((ownHand && !showingSplits) || (!ownHand && selectedSource !== null && !showingSplits));
      button.disabled = !available;
      button.classList.toggle('is-available', available);
      button.classList.toggle('is-selected', ownHand && selectedSource === index && humanMayMove());
      button.classList.toggle('is-knocked-out', count === 0);
      button.dataset.count = String(count);
      button.querySelector('.hand-art').replaceChildren(handSvg(count));
      button.querySelector('.hand-count').textContent = String(count);
      button.querySelector('.hand-state').textContent = count === 0 ? 'Knocked out' :
        `${count} ${count === 1 ? 'finger' : 'fingers'}`;
      button.setAttribute('aria-label',
        `Player ${player} ${HAND_NAMES[index]} hand: ${count === 0 ? 'knocked out' :
          `${count} ${count === 1 ? 'finger' : 'fingers'}`}`);
    }
    const card = byId(`player-${player.toLowerCase()}-card`);
    card.classList.toggle('is-active', currentPlayer() === player && getResult(state, searchDepth) === null);
  }
}

function renderStatus() {
  const result = getResult(state, searchDepth);
  ui.turn.textContent = `${state[2]} ${state[2] === 1 ? 'move' : 'moves'} played`;
  const remaining = Math.max(0, searchDepth - state[2]);
  ui.remaining.textContent = `${remaining} ${remaining === 1 ? 'move' : 'moves'} remaining`;
  ui.gameLimitDescription.textContent = `${searchDepth === DEFAULT_DEPTH ? 'Assignment mode' : 'Custom mode'} ends at a knockout or after ${searchDepth} moves.`;

  if (result === 'A' || result === 'B') {
    ui.title.textContent = `Player ${result} wins`;
    ui.detail.textContent = `Player ${opposite(result)} has no active hands remaining.`;
  } else if (result === 'tie') {
    ui.title.textContent = 'Maximum depth reached · Tie';
    ui.detail.textContent = `Both players still have an active hand after ${searchDepth} moves.`;
  } else if (mode === 'auto') {
    ui.title.textContent = autoRunning ? 'Autonomous game in motion' : 'Autonomous game paused';
    ui.detail.textContent = autoRunning ?
      `Player ${currentPlayer()} is moving. Both sides follow the depth-${searchDepth} minimax table.` :
      `Player ${currentPlayer()} moves next. Use Start AI vs AI in Game Setup, or play one AI move.`;
  } else if (mode === 'local') {
    ui.title.textContent = `Player ${currentPlayer()}'s move`;
    ui.detail.textContent = showingSplits ? 'Choose a legal split below. A split uses this turn.' :
      selectedSource === null ? `Player ${currentPlayer()}: choose one of your active hands.` :
        `Player ${currentPlayer()}: tap an active opponent hand with your ${HAND_NAMES[selectedSource]} hand.`;
  } else if (humanMayMove()) {
    ui.title.textContent = `Your move · Player ${humanPlayer}`;
    ui.detail.textContent = showingSplits ? 'Choose a legal split below. A split uses your turn.' :
      selectedSource === null ? 'Select one of your active hands, then an opponent hand to tap.' :
        `Your ${HAND_NAMES[selectedSource]} hand is selected. Now choose an active opponent hand.`;
  } else {
    ui.title.textContent = `Computer's move · Player ${currentPlayer()}`;
    ui.detail.textContent = `The computer is reading the bottom-up depth-${searchDepth} minimax table.`;
  }
}

function renderControls() {
  ui.modeHuman.setAttribute('aria-pressed', String(mode === 'human'));
  ui.modeLocal.setAttribute('aria-pressed', String(mode === 'local'));
  ui.modeAuto.setAttribute('aria-pressed', String(mode === 'auto'));
  ui.playerA.setAttribute('aria-pressed', String(humanPlayer === 'A'));
  ui.playerB.setAttribute('aria-pressed', String(humanPlayer === 'B'));
  ui.modeHuman.classList.toggle('is-active', mode === 'human');
  ui.modeLocal.classList.toggle('is-active', mode === 'local');
  ui.modeAuto.classList.toggle('is-active', mode === 'auto');
  ui.playerA.classList.toggle('is-active', humanPlayer === 'A');
  ui.playerB.classList.toggle('is-active', humanPlayer === 'B');
  ui.playerControls.hidden = mode !== 'human';
  ui.autoControls.hidden = mode !== 'auto';
  ui.autoPlay.textContent = autoRunning ? 'Pause AI vs AI' : 'Start AI vs AI';
  ui.autoPlay.disabled = mode !== 'auto' || getResult(state, searchDepth) !== null ||
    (isAnimating && !autoRunning);
  ui.autoStep.disabled = mode !== 'auto' || getResult(state, searchDepth) !== null || isAnimating;
  ui.autoSpeedLabel.textContent = `${(Number(ui.autoSpeed.value) / 1000).toFixed(1)} s / move`;
  const splitAvailable = humanMayMove() && legalMoves(state, searchDepth).some((move) => move.kind === 'split');
  ui.split.disabled = !splitAvailable;
  ui.split.setAttribute('aria-pressed', String(showingSplits && splitAvailable));
  ui.split.textContent = showingSplits && splitAvailable ? 'Back to taps' : 'Split fingers';
  ui.actionTurnLabel.textContent = mode === 'local' ? `Player ${currentPlayer()}'s turn` :
    mode === 'auto' ? 'Computer turn' : 'Your turn';
  ui.soundToggle.textContent = soundEnabled ? 'Sound on' : 'Sound off';
  ui.soundToggle.setAttribute('aria-pressed', String(soundEnabled));
  ui.soundToggle.setAttribute('aria-label', soundEnabled ? 'Turn game sounds off' : 'Turn game sounds on');
}

function renderMoveOptions() {
  ui.moveOptions.replaceChildren();
  if (!humanMayMove()) {
    const note = document.createElement('p');
    note.className = 'quiet-note';
    note.textContent = mode === 'auto' ? 'Use the AI vs AI controls in Game Setup to start or step through the game.' :
      getResult(state, searchDepth) ? 'Start a new game to play again.' : 'The computer is choosing a move.';
    ui.moveOptions.append(note);
    return;
  }
  if (!showingSplits) {
    const guide = document.createElement('div');
    guide.className = 'move-guide';
    const chooseSource = document.createElement('span');
    chooseSource.className = `guide-step${selectedSource === null ? ' is-current' : ' is-complete'}`;
    chooseSource.textContent = selectedSource === null ? '1 · Choose one of your hands' :
      `✓ ${HAND_NAMES[selectedSource]} hand selected`;
    const chooseTarget = document.createElement('span');
    chooseTarget.className = `guide-step${selectedSource !== null ? ' is-current' : ''}`;
    chooseTarget.textContent = '2 · Tap an opponent hand';
    guide.append(chooseSource, chooseTarget);
    ui.moveOptions.append(guide);
    return;
  }

  const heading = document.createElement('p');
  heading.className = 'option-heading';
  heading.textContent = 'Choose a new finger distribution';
  ui.moveOptions.append(heading);

  const choices = legalMoves(state, searchDepth).filter((move) => move.kind === 'split');
  for (const move of choices) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'move-option';
    const score = minimaxTable.get(stateKey(move.nextState)).score;
    button.textContent = `${moveLabel(state, move)}  ·  ${scoreShort(score)}`;
    button.addEventListener('click', () => {
      if (humanMayMove()) commitMove(move);
    });
    ui.moveOptions.append(button);
  }
}

function renderAI() {
  const entry = minimaxTable.get(stateKey(state));
  if (!entry) throw new Error('The current state is missing from the minimax table.');
  const result = getResult(state, searchDepth);
  const role = currentPlayer() === 'A' ? 'MAX · chooses the highest value' :
    'MIN · chooses the lowest value';
  ui.aiRole.textContent = `Player ${currentPlayer()} · ${role}`;
  ui.aiState.textContent = compactState(state);
  ui.aiTurnSimple.textContent = result ? 'The game is complete' :
    `Player ${currentPlayer()} is choosing now`;
  ui.aiScore.textContent = beginnerOutcome(entry.score);
  ui.aiRawScore.textContent = `${entry.score > 0 ? '+' : entry.score < 0 ? '−' : ''}${Math.abs(entry.score)} · ${outcomeLabel(entry.score, searchDepth)}`;
  ui.aiReason.textContent = lastExplanation || scoreDetail(entry.score);
  ui.advancedIntro.textContent = `These are the technical details behind the summary above. The AI built ${minimaxTable.size.toLocaleString()} table rows from move ${searchDepth} backward to the opening.`;
  ui.tieKeyDescription.textContent = `Neither player can force a win before move ${searchDepth}.`;

  const selected = evaluateMoves(state, minimaxTable).find((move) => move.selected);
  if (selected) {
    ui.aiSelected.textContent = moveLabel(state, selected);
  } else if (result === 'tie') {
    ui.aiSelected.textContent = `No move selected: the ${searchDepth}-move horizon has been reached.`;
  } else if (result === 'A' || result === 'B') {
    ui.aiSelected.textContent = `No move selected: Player ${result} has already won.`;
  } else {
    ui.aiSelected.textContent = 'No legal move is available.';
  }
}

function renderDPStats() {
  const result = getResult(state, searchDepth);
  const branches = legalMoves(state, searchDepth).length;
  const remaining = Math.max(0, searchDepth - state[2]);
  const role = currentPlayer() === 'A' ? 'A · MAX' : 'B · MIN';
  const depthPercent = Math.min(100, (state[2] / searchDepth) * 100);

  ui.dpTableRows.textContent = minimaxTable.size.toLocaleString();
  ui.dpBuildTime.textContent = tableBuildDuration < 1 ? '< 1 ms' :
    `${tableBuildDuration.toFixed(1)} ms`;
  ui.dpCurrentLevel.textContent = `${state[2]} / ${searchDepth}`;
  ui.dpMovesRemaining.textContent = String(remaining);
  ui.dpLegalBranches.textContent = String(branches);
  ui.dpActiveRole.textContent = result ? 'Game complete' : role;
  ui.dpDepthProgress.setAttribute('aria-valuenow', String(state[2]));
  ui.dpDepthProgress.setAttribute('aria-valuemax', String(searchDepth));
  ui.dpProgressLabel.textContent = `${state[2]} of ${searchDepth} moves`;
  ui.dpProgressBar.style.width = `${depthPercent}%`;
  ui.dpStatsIntro.textContent = `These numbers show the size and current workload of the bottom-up minimax system. They update as the game moves through its ${searchDepth}-level table.`;
  ui.dpStatsHelpText.textContent = `The table contains 625 possible four-hand combinations at each level and ${searchDepth + 1} levels from 0 through ${searchDepth}. It is built when you select a depth. “Legal branches” is the number of attacks and redistributions available from the current node; A chooses the maximum score and B chooses the minimum.`;
  ui.rulesReminder.textContent = `A tap adds fingers to the target hand. Five or more knocks it out. Lose both hands and you lose; if both players survive ${searchDepth} moves, the score is a tie.`;
}

function renderHistory() {
  ui.history.replaceChildren();
  if (history.length === 0) {
    const item = document.createElement('li');
    item.className = 'quiet-note';
    item.textContent = 'No moves yet. The story starts with one finger on each hand.';
    ui.history.append(item);
    return;
  }
  for (const record of [...history].reverse()) {
    const item = document.createElement('li');
    const label = document.createElement('span');
    label.className = 'history-turn';
    label.textContent = `Turn ${record.turn}`;
    const detail = document.createElement('span');
    detail.textContent = record.label;
    item.append(label, detail);
    ui.history.append(item);
  }
}

function renderPlayedPath() {
  ui.treePath.replaceChildren();
  const positions = [structuredClone(INITIAL_STATE), ...history.map((record) => record.stateAfter)];
  const reviewAvailable = getResult(state, searchDepth) !== null && history.length > 0;
  if (reviewAvailable && (!Number.isSafeInteger(reviewedMoveIndex) ||
      reviewedMoveIndex < 0 || reviewedMoveIndex >= positions.length)) {
    reviewedMoveIndex = positions.length - 1;
  } else if (!reviewAvailable) {
    reviewedMoveIndex = null;
  }

  positions.forEach((position, index) => {
    if (index > 0) {
      const arrow = document.createElement('span');
      arrow.className = 'tree-route-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';
      ui.treePath.append(arrow);
    }

    const node = document.createElement(reviewAvailable ? 'button' : 'span');
    if (reviewAvailable) node.type = 'button';
    const isCurrent = index === positions.length - 1;
    const isReviewed = reviewAvailable && index === reviewedMoveIndex;
    node.className = `tree-route-node${isCurrent ? ' is-current' : ' is-played'}${isReviewed ? ' is-reviewed' : ''}`;
    node.dataset.treeNodeKey = stateKey(position);
    node.textContent = index === 0 ? 'Start · A 1 · 1 / B 1 · 1' :
      `Move ${position[2]} · A ${position[0][0]} · ${position[0][1]} / B ${position[1][0]} · ${position[1][1]}`;
    if (reviewAvailable) {
      node.setAttribute('aria-pressed', String(isReviewed));
      if (isReviewed) node.setAttribute('aria-current', 'step');
      node.setAttribute('aria-label', `${index === 0 ? 'Review the starting position' : `Review move ${index}`}${isCurrent ? ', the final game position' : ''}`);
      node.addEventListener('click', () => setReviewedMove(index));
    }
    ui.treePath.append(node);
  });

  window.requestAnimationFrame(scrollTreeRouteToReviewed);
  return positions;
}

function scrollTreeRouteToReviewed() {
  const selected = ui.treePath.querySelector('.tree-route-node.is-reviewed') ??
    ui.treePath.querySelector('.tree-route-node.is-current');
  if (!selected) return;
  const centered = selected.offsetLeft - ((ui.treePath.clientWidth - selected.offsetWidth) / 2);
  ui.treePath.scrollLeft = Math.max(0, centered);
}

function renderTreeReviewControls(positions) {
  const reviewAvailable = getResult(state, searchDepth) !== null && history.length > 0;
  ui.treeReviewControls.hidden = !reviewAvailable;
  ui.treeReviewNote.hidden = !reviewAvailable;
  if (!reviewAvailable) return;

  const lastIndex = positions.length - 1;
  const index = reviewedMoveIndex ?? lastIndex;
  ui.treeReviewLabel.textContent = index === 0 ?
    `Start · before move 1 of ${lastIndex}` : index === lastIndex ?
      `Final position · move ${index} of ${lastIndex}` :
      `Move ${index} of ${lastIndex}`;
  ui.treeReviewPrevious.disabled = index <= 0;
  ui.treeReviewNext.disabled = index >= lastIndex;
  ui.treeReviewFinal.disabled = index >= lastIndex;
}

function setReviewedMove(index) {
  if (getResult(state, searchDepth) === null || history.length === 0) return;
  reviewedMoveIndex = Math.max(0, Math.min(history.length, index));
  previewedMoveKey = null;
  renderGraph();
}

function createTreeBranch(position, move, options) {
  const interactive = options?.interactive ?? true;
  const wrapper = document.createElement('div');
  wrapper.className = 'tree-branch';
  wrapper.setAttribute('role', 'listitem');

  const node = document.createElement(interactive ? 'button' : 'div');
  if (interactive) node.type = 'button';
  const childKey = stateKey(move.nextState);
  const isPreviewed = childKey === previewedMoveKey;
  node.className = `tree-node${move.selected ? ' is-best' : ''}${move.played ? ' is-played-choice' : ''}${isPreviewed ? ' is-previewed' : ''}`;
  node.dataset.treeNodeKey = childKey;
  node.dataset.previewState = childKey;
  if (interactive) {
    node.setAttribute('aria-pressed', String(isPreviewed));
    node.setAttribute('aria-describedby', 'tree-impact');
  }

  const kicker = document.createElement('span');
  kicker.className = 'tree-node-kicker';
  kicker.textContent = move.played && move.selected ? 'Played · AI choice' :
    move.played ? 'Move actually played' :
      move.selected ? 'AI choice' : interactive ? 'Alternative move' : 'Possible reply';
  const title = document.createElement('strong');
  title.textContent = moveLabel(position, move);
  const nextState = document.createElement('span');
  nextState.className = 'tree-node-state';
  nextState.textContent = compactState(move.nextState);
  const value = document.createElement('span');
  value.className = 'tree-node-value';
  value.textContent = scoreShort(move.score);
  node.append(kicker, title, nextState, value);

  if (interactive) {
    node.addEventListener('click', () => {
      previewedMoveKey = childKey;
      for (const candidate of ui.graphChoices.querySelectorAll('button.tree-node')) {
        const selected = candidate.dataset.treeNodeKey === childKey;
        candidate.classList.toggle('is-previewed', selected);
        candidate.setAttribute('aria-pressed', String(selected));
      }
      renderImpact(position, move);
      renderReplies(move);
    });
  }
  wrapper.append(node);
  return wrapper;
}

function describeMoveImpact(position, move) {
  const actor = currentPlayer(position);
  let change;
  if (move.kind === 'attack') {
    const targetPlayer = opposite(actor);
    const sourceCount = handsFor(position, actor)[move.source];
    const before = handsFor(position, targetPlayer)[move.target];
    const after = handsFor(move.nextState, targetPlayer)[move.target];
    change = after === 0 ?
      `${actor}'s ${HAND_NAMES[move.source]} hand adds ${sourceCount} to ${targetPlayer}'s ${HAND_NAMES[move.target]} hand (${before}); five or more knocks that hand out.` :
      `${targetPlayer}'s ${HAND_NAMES[move.target]} hand changes from ${before} to ${after}.`;
  } else {
    const before = handsFor(position, actor);
    change = `${actor} redistributes ${before[0]} · ${before[1]} into ${move.newHands[0]} · ${move.newHands[1]}.`;
  }

  const nextPlayer = currentPlayer(move.nextState);
  const nextRole = nextPlayer === 'A' ? 'MAX' : 'MIN';
  const remaining = Math.max(0, searchDepth - move.nextState[2]);
  const result = getResult(move.nextState, searchDepth);
  return {
    change,
    consequence: result ? `The branch ends here: ${result === 'tie' ? 'the move limit is a tie' : `Player ${result} wins`}.` :
      `The branch moves to level ${move.nextState[2]}. Player ${nextPlayer} responds as ${nextRole}, with ${remaining} ${remaining === 1 ? 'move' : 'moves'} remaining.`,
    prediction: scoreDetail(move.score),
  };
}

function renderImpact(position, move) {
  ui.treeImpact.replaceChildren();
  const heading = document.createElement('strong');
  heading.textContent = 'Previewed impact';
  const moveText = document.createElement('p');
  moveText.className = 'tree-impact-move';
  moveText.textContent = moveLabel(position, move);
  const impact = describeMoveImpact(position, move);
  const details = document.createElement('ul');
  for (const text of [impact.change, impact.consequence, impact.prediction]) {
    const item = document.createElement('li');
    item.textContent = text;
    details.append(item);
  }
  const note = document.createElement('p');
  note.className = 'tree-preview-note';
  note.textContent = 'Preview only — the game state has not changed.';
  ui.treeImpact.append(heading, moveText, details, note);
}

function renderReplies(move) {
  ui.treeReplies.replaceChildren();
  const result = getResult(move.nextState, searchDepth);
  if (result) {
    const text = document.createElement('p');
    text.className = 'quiet-note';
    text.textContent = result === 'tie' ?
      `This branch reaches the move-${searchDepth} tie boundary.` :
      `This branch ends with Player ${result} winning.`;
    ui.treeReplies.append(text);
    return;
  }

  const replies = evaluateMoves(move.nextState, minimaxTable);
  for (const reply of replies) {
    ui.treeReplies.append(createTreeBranch(move.nextState, reply, { interactive: false }));
  }
}

function renderGraph() {
  const positions = renderPlayedPath();
  renderTreeReviewControls(positions);
  const reviewAvailable = getResult(state, searchDepth) !== null && history.length > 0;
  const reviewIndex = reviewAvailable ? reviewedMoveIndex ?? positions.length - 1 : positions.length - 1;
  const position = reviewAvailable ? positions[reviewIndex] : state;
  const result = getResult(position, searchDepth);
  const nextPlayedKey = reviewAvailable && reviewIndex < positions.length - 1 ?
    stateKey(positions[reviewIndex + 1]) : null;
  const options = evaluateMoves(position, minimaxTable).map((move) => ({
    ...move,
    played: stateKey(move.nextState) === nextPlayedKey,
  }));

  ui.graphCurrent.replaceChildren();
  ui.graphCurrent.dataset.treeNodeKey = stateKey(position);
  const currentLabel = document.createElement('span');
  currentLabel.textContent = reviewAvailable ?
    reviewIndex === 0 ? 'Reviewing game start' :
      reviewIndex === positions.length - 1 ? 'Final position' : `Reviewing move ${reviewIndex}` :
    'You are here';
  const currentState = document.createElement('strong');
  currentState.textContent = compactState(position);
  const currentMeta = document.createElement('span');
  currentMeta.textContent = result ? 'Game complete · review only' :
    `Player ${currentPlayer(position)} · ${currentPlayer(position) === 'A' ? 'MAX' : 'MIN'} · ${options.length} legal moves${reviewAvailable ? ' · review only' : ''}`;
  ui.graphCurrent.append(currentLabel, currentState, currentMeta);

  ui.graphChoices.replaceChildren();
  if (options.length === 0 || result) {
    previewedMoveKey = null;
    const text = document.createElement('p');
    text.className = 'quiet-note';
    text.textContent = 'This is a terminal node, so it has no outgoing branches.';
    ui.graphChoices.append(text);
    ui.treeImpact.replaceChildren(text.cloneNode(true));
    ui.treeReplies.replaceChildren(text.cloneNode(true));
    return;
  }

  if (!options.some((move) => stateKey(move.nextState) === previewedMoveKey)) {
    const defaultMove = options.find((move) => move.played) ??
      options.find((move) => move.selected) ?? options[0];
    previewedMoveKey = stateKey(defaultMove.nextState);
  }

  for (const move of options) ui.graphChoices.append(createTreeBranch(position, move));
  const previewed = options.find((move) => stateKey(move.nextState) === previewedMoveKey);
  if (!previewed) throw new Error('The previewed move is no longer legal.');
  renderImpact(position, previewed);
  renderReplies(previewed);
}

function render() {
  renderControls();
  renderStatus();
  renderHands();
  renderMoveOptions();
  renderAI();
  renderDPStats();
  renderHistory();
  renderGraph();
}

function clearPending() {
  generation += 1;
  if (pendingTimer !== null) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
}

function clearAttackAnimation() {
  document.querySelectorAll('.hand.is-tapping, .hand.is-receiving-tap, .hand.is-splitting-left, .hand.is-splitting-right').forEach((hand) => {
    hand.classList.remove('is-tapping', 'is-receiving-tap', 'is-splitting-left', 'is-splitting-right');
    hand.style.removeProperty('--tap-x');
    hand.style.removeProperty('--tap-y');
  });
  document.querySelectorAll('.player-row.is-attacking').forEach((row) => {
    row.classList.remove('is-attacking');
  });
  const stage = document.querySelector('.game-stage');
  stage?.classList.remove('is-animating');
  stage?.removeAttribute('aria-busy');
}

function playSound(kind) {
  if (!soundEnabled) return;
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    audioContext ??= new Context();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    const notes = kind === 'win' ? [523, 659, 784] :
      kind === 'tie' ? [392, 392] : kind === 'split' ? [440, 554] : [330, 440];
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const start = audioContext.currentTime + index * 0.085;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.075, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.13);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.14);
    });
  } catch (_) {
    // Audio is optional; browsers without Web Audio still play the game normally.
  }
}

function animateAttack(position, move, sourceOverride = null) {
  if (move.kind !== 'attack' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return Promise.resolve();
  }

  const actor = currentPlayer(position);
  const animationId = ++animationSequence;
  const targetPlayer = opposite(actor);
  const sourceIndex = sourceOverride ?? move.source;
  const source = byId(`hand-${actor.toLowerCase()}-${HAND_NAMES[sourceIndex]}`);
  const target = byId(`hand-${targetPlayer.toLowerCase()}-${HAND_NAMES[move.target]}`);
  const sourceBounds = source.getBoundingClientRect();
  const targetBounds = target.getBoundingClientRect();
  const distanceX = targetBounds.left + targetBounds.width / 2 -
    (sourceBounds.left + sourceBounds.width / 2);
  const distanceY = targetBounds.top + targetBounds.height / 2 -
    (sourceBounds.top + sourceBounds.height / 2);

  source.style.setProperty('--tap-x', `${distanceX * 0.72}px`);
  source.style.setProperty('--tap-y', `${distanceY * 0.72}px`);
  const stage = document.querySelector('.game-stage');
  stage?.classList.add('is-animating');
  stage?.setAttribute('aria-busy', 'true');
  source.closest('.player-row')?.classList.add('is-attacking');
  source.classList.add('is-tapping');
  target.classList.add('is-receiving-tap');

  return new Promise((resolve) => {
    let finished = false;
    let fallback;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(fallback);
      source.removeEventListener('animationend', handleAnimationEnd);
      if (animationId === animationSequence) clearAttackAnimation();
      resolve();
    };
    const handleAnimationEnd = (event) => {
      if (event.target === source && event.animationName === 'hand-tap') finish();
    };
    fallback = window.setTimeout(finish, 760);
    source.addEventListener('animationend', handleAnimationEnd);
  });
}

function animateSplit(position) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
  const animationId = ++animationSequence;
  const actor = currentPlayer(position).toLowerCase();
  const left = byId(`hand-${actor}-left`);
  const right = byId(`hand-${actor}-right`);
  const stage = document.querySelector('.game-stage');
  stage?.classList.add('is-animating');
  stage?.setAttribute('aria-busy', 'true');
  left.closest('.player-row')?.classList.add('is-attacking');
  left.classList.add('is-splitting-left');
  right.classList.add('is-splitting-right');
  return new Promise((resolve) => {
    let finished = false;
    let fallback;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(fallback);
      left.removeEventListener('animationend', handleAnimationEnd);
      if (animationId === animationSequence) clearAttackAnimation();
      resolve();
    };
    const handleAnimationEnd = (event) => {
      if (event.target === left && event.animationName === 'hand-redistribute-left') finish();
    };
    fallback = window.setTimeout(finish, 690);
    left.addEventListener('animationend', handleAnimationEnd);
  });
}

function resetGame() {
  clearPending();
  gameRevision += 1;
  animationSequence += 1;
  isAnimating = false;
  clearAttackAnimation();
  state = structuredClone(INITIAL_STATE);
  selectedSource = null;
  showingSplits = false;
  history = [];
  lastExplanation = '';
  autoRunning = false;
  previewedMoveKey = null;
  reviewedMoveIndex = null;
  render();
  scheduleComputerIfNeeded();
}

async function commitMove(move, sourceOverride = null, computer = false) {
  if (isAnimating || getResult(state, searchDepth) !== null) return;
  const legal = legalMoves(state, searchDepth);
  const chosen = legal.find((candidate) => stateKey(candidate.nextState) === stateKey(move.nextState));
  if (!chosen) throw new Error('The chosen move is no longer legal.');
  const positionBeforeMove = structuredClone(state);
  const revisionBeforeMove = gameRevision;
  const actor = currentPlayer();
  const label = moveLabel(state, chosen, sourceOverride);
  const score = minimaxTable.get(stateKey(chosen.nextState)).score;
  isAnimating = true;
  ui.title.textContent = chosen.kind === 'split' ? `${actor} is redistributing…` : `${actor} is tapping…`;
  ui.detail.textContent = label;
  renderControls();
  for (const hand of document.querySelectorAll('.hand')) hand.disabled = true;
  await (chosen.kind === 'split' ? animateSplit(positionBeforeMove) :
    animateAttack(positionBeforeMove, chosen, sourceOverride));
  if (revisionBeforeMove !== gameRevision) return;
  isAnimating = false;
  state = structuredClone(chosen.nextState);
  history.push({ turn: state[2], label, stateAfter: structuredClone(state) });
  previewedMoveKey = null;
  reviewedMoveIndex = getResult(state, searchDepth) === null ? null : history.length;
  selectedSource = null;
  showingSplits = false;
  lastExplanation = `${computer ? 'The computer chose' : mode === 'local' ? `Player ${actor} chose` : 'You chose'}: ${label}. ${scoreDetail(score)}`;
  const result = getResult(state, searchDepth);
  if (result !== null) autoRunning = false;
  playSound(result === 'tie' ? 'tie' : result ? 'win' : chosen.kind);
  render();
  if (mode === 'auto' && autoRunning) scheduleAutoTick();
  if (mode === 'human') scheduleComputerIfNeeded();
}

function selectComputerMove() {
  return bestMove(state, minimaxTable);
}

function scheduleComputerIfNeeded() {
  if (pendingTimer !== null || isAnimating || mode !== 'human' ||
      currentPlayer() === humanPlayer || getResult(state, searchDepth) !== null) return;
  const ticket = generation;
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    if (ticket !== generation || mode !== 'human' || currentPlayer() === humanPlayer) return;
    const move = selectComputerMove();
    if (!move) throw new Error('The computer has no legal move.');
    commitMove(move, null, true);
  }, 420);
}

function scheduleAutoTick() {
  if (pendingTimer !== null || isAnimating || mode !== 'auto' ||
      !autoRunning || getResult(state, searchDepth) !== null) return;
  const ticket = generation;
  const delay = Math.max(150, Math.min(2000, Number(ui.autoSpeed.value) || 700));
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    if (ticket !== generation || mode !== 'auto' || !autoRunning) return;
    const move = selectComputerMove();
    if (!move) throw new Error('The autonomous player has no legal move.');
    commitMove(move, null, true);
  }, delay);
}

function handleHandClick(player, index) {
  if (!humanMayMove() || showingSplits) return;
  const count = handsFor(state, player)[index];
  if (count === 0) return;
  const actor = mode === 'local' ? currentPlayer() : humanPlayer;
  if (player === actor) {
    selectedSource = selectedSource === index ? null : index;
    render();
    return;
  }
  if (selectedSource === null) return;
  const selectedCount = handsFor(state, actor)[selectedSource];
  // Duplicate resulting states are deduplicated in the rule engine. A click on
  // either same-valued source hand must still perform the identical legal tap.
  const move = legalMoves(state, searchDepth).find((candidate) =>
    candidate.kind === 'attack' && candidate.target === index &&
    handsFor(state, actor)[candidate.source] === selectedCount);
  if (move) commitMove(move, selectedSource);
}

ui.modeHuman.addEventListener('click', () => { mode = 'human'; resetGame(); });
ui.modeLocal.addEventListener('click', () => { mode = 'local'; resetGame(); });
ui.modeAuto.addEventListener('click', () => { mode = 'auto'; resetGame(); });
ui.playerA.addEventListener('click', () => { humanPlayer = 'A'; resetGame(); });
ui.playerB.addEventListener('click', () => { humanPlayer = 'B'; resetGame(); });
ui.restart.addEventListener('click', resetGame);
ui.soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  renderControls();
  if (soundEnabled) playSound('split');
});
ui.searchDepth.addEventListener('change', () => {
  const depth = Number(ui.searchDepth.value);
  // The select only exposes supported even horizons. Reject scripted invalid values too.
  if (!Number.isSafeInteger(depth) || depth < 2 || depth > 50 || depth % 2 !== 0) {
    ui.searchDepth.value = String(searchDepth);
    return;
  }
  const cached = getTableAtDepth(depth);
  searchDepth = depth;
  minimaxTable = cached.table;
  tableBuildDuration = cached.duration;
  resetGame();
});
ui.aiToggle.addEventListener('click', () => {
  const expanded = ui.aiToggle.getAttribute('aria-expanded') === 'true';
  ui.aiToggle.setAttribute('aria-expanded', String(!expanded));
  ui.aiContent.hidden = expanded;
  ui.aiToggle.textContent = expanded ? 'Show AI Analysis' : 'Hide AI Analysis';
});
ui.aiAdvanced.addEventListener('toggle', () => {
  if (!ui.aiAdvanced.open) return;
  window.requestAnimationFrame(scrollTreeRouteToReviewed);
});
ui.treeReviewPrevious.addEventListener('click', () =>
  setReviewedMove((reviewedMoveIndex ?? history.length) - 1));
ui.treeReviewNext.addEventListener('click', () =>
  setReviewedMove((reviewedMoveIndex ?? history.length) + 1));
ui.treeReviewFinal.addEventListener('click', () => setReviewedMove(history.length));
ui.split.addEventListener('click', () => {
  if (!humanMayMove()) return;
  showingSplits = !showingSplits;
  selectedSource = null;
  render();
});

for (const player of ['A', 'B']) {
  HAND_NAMES.forEach((name, index) => {
    byId(`hand-${player.toLowerCase()}-${name}`).addEventListener('click', () => handleHandClick(player, index));
  });
}

ui.autoPlay.addEventListener('click', () => {
  if (mode !== 'auto' || getResult(state, searchDepth) !== null) return;
  autoRunning = !autoRunning;
  if (!autoRunning) clearPending();
  render();
  if (autoRunning) scheduleAutoTick();
});
ui.autoStep.addEventListener('click', () => {
  if (mode !== 'auto' || getResult(state, searchDepth) !== null) return;
  clearPending();
  autoRunning = false;
  const move = selectComputerMove();
  if (!move) throw new Error('The autonomous player has no legal move.');
  commitMove(move, null, true);
});
ui.autoSpeed.addEventListener('input', () => {
  renderControls();
  if (autoRunning) {
    clearPending();
    scheduleAutoTick();
  }
});

ui.advantageRun.addEventListener('click', () => {
  ui.advantageResults.replaceChildren();
  const table = document.createElement('table');
  table.className = 'experiment-table';
  const header = document.createElement('tr');
  for (const title of ['Move limit', 'Opening score', 'Meaning']) {
    const cell = document.createElement('th');
    cell.textContent = title;
    header.append(cell);
  }
  table.append(header);
  const depths = [...new Set([10, 20, 26, searchDepth])].sort((a, b) => a - b);
  for (const depth of depths) {
    const row = document.createElement('tr');
    const score = getTableAtDepth(depth).table.get(stateKey(INITIAL_STATE)).score;
    const cells = [String(depth), score > 0 ? '+1' : String(score),
      score === 1 ? 'A can force a win' : score === -1 ? 'B can force a win' : 'No forced win by this limit'];
    for (const value of cells) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    if (depth === searchDepth) row.classList.add('is-current-depth');
    table.append(row);
  }
  const note = document.createElement('p');
  note.className = 'experiment-note';
  note.textContent = 'Highlighted row = current game limit. These are optimal-play predictions from A’s perspective, not win percentages or proof about unlimited play.';
  ui.advantageResults.append(table, note);
});

ui.comparisonRun.addEventListener('click', () => {
  ui.comparisonResults.replaceChildren();
  const result = compareSearch(6);
  const table = document.createElement('table');
  table.className = 'experiment-table';
  const rows = [
    ['Method', 'Positions evaluated', 'Time on this device'],
    ['Bottom-up DP', `${result.dpRows.toLocaleString()} stored rows`, `${result.dpMs.toFixed(1)} ms`],
    ['Plain recursion', `${result.recursiveVisits.toLocaleString()} visits`, `${result.recursiveMs.toFixed(1)} ms`],
  ];
  rows.forEach((values, index) => {
    const row = document.createElement('tr');
    for (const value of values) {
      const cell = document.createElement(index === 0 ? 'th' : 'td');
      cell.textContent = value;
      row.append(cell);
    }
    table.append(row);
  });
  const note = document.createElement('p');
  note.className = 'experiment-note';
  note.textContent = `Both returned ${result.score > 0 ? '+1' : result.score}. Recursion visited ${result.distinctReachable.toLocaleString()} distinct reachable state-level pairs, often revisiting them; DP fills every possible row, including unreachable ones. So these timings compare different workloads and may not favor DP at this small depth.`;
  ui.comparisonResults.append(table, note);
});

render();
