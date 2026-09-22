import {
  DEFAULT_DEPTH,
  INITIAL_STATE,
  bestMove,
  bestMoveDP,
  buildReachableGraph,
  getResult,
  legalMoves,
  stateKey,
} from './game.js';

const byId = (id) => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing interface element: ${id}`);
  return element;
};

const ui = {
  modeHuman: byId('mode-human'),
  modeAuto: byId('mode-auto'),
  playerA: byId('player-a'),
  playerB: byId('player-b'),
  playerControls: byId('player-controls'),
  restart: byId('restart-button'),
  split: byId('split-button'),
  title: byId('status-title'),
  detail: byId('status-detail'),
  turn: byId('turn-count'),
  progress: byId('progress-fill'),
  moveOptions: byId('move-options'),
  autoControls: byId('auto-controls'),
  autoPlay: byId('auto-play'),
  autoStep: byId('auto-step'),
  autoSpeed: byId('auto-speed'),
  autoSpeedLabel: byId('auto-speed-label'),
  history: byId('history-list'),
  graphCurrent: byId('graph-current'),
  graphChoices: byId('graph-choices'),
  aiScore: byId('ai-score'),
  aiReason: byId('ai-reason'),
};

const HAND_NAMES = ['left', 'right'];
const table = bestMoveDP(DEFAULT_DEPTH);
const graph = buildReachableGraph();
const graphEdges = [...graph.values()].reduce((total, children) => total + children.length, 0);
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
  if (score === 1) return '+1 · A can force a win';
  if (score === -1) return '−1 · B can force a win';
  return '0 · optimal play ties';
}

function scoreDetail(score) {
  if (score === 1) return 'Player A can force a win before the 20-turn limit.';
  if (score === -1) return 'Player B can force a win before the 20-turn limit.';
  return 'Neither player can force a win before the 20-turn limit.';
}

function compactState(position) {
  return `A ${position[0][0]} · ${position[0][1]}   /   B ${position[1][0]} · ${position[1][1]}`;
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
  return mode === 'human' && currentPlayer() === humanPlayer && getResult(state) === null;
}

function renderHands() {
  for (const player of ['A', 'B']) {
    for (let index = 0; index < 2; index += 1) {
      const button = byId(`hand-${player.toLowerCase()}-${HAND_NAMES[index]}`);
      const count = handsFor(state, player)[index];
      const ownHand = player === humanPlayer;
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
    card.classList.toggle('is-active', currentPlayer() === player && getResult(state) === null);
  }
}

function renderStatus() {
  const result = getResult(state);
  ui.turn.textContent = result ? `${state[2]} / ${DEFAULT_DEPTH} turns` :
    `Turn ${state[2] + 1} of ${DEFAULT_DEPTH}`;
  ui.progress.style.width = `${Math.min(100, (state[2] / DEFAULT_DEPTH) * 100)}%`;
  ui.progress.parentElement?.setAttribute('aria-valuenow', String(state[2]));

  if (result === 'tie') {
    ui.title.textContent = "It's a tie";
    ui.detail.textContent = 'Both players survived the 20-turn horizon. The game is a tie.';
  } else if (result === 'A' || result === 'B') {
    ui.title.textContent = `Player ${result} wins`;
    ui.detail.textContent = `Player ${opposite(result)} has no active hands remaining.`;
  } else if (mode === 'auto') {
    ui.title.textContent = autoRunning ? 'Autonomous game in motion' : 'Autonomous game paused';
    ui.detail.textContent = `Player ${currentPlayer()} moves next. Step through or play both optimal strategies.`;
  } else if (humanMayMove()) {
    ui.title.textContent = `Your move · Player ${humanPlayer}`;
    ui.detail.textContent = showingSplits ? 'Choose a legal split below. A split uses your turn.' :
      selectedSource === null ? 'Select one of your active hands, then an opponent hand to tap.' :
        `Your ${HAND_NAMES[selectedSource]} hand is selected. Now choose an active opponent hand.`;
  } else {
    ui.title.textContent = `Computer's move · Player ${currentPlayer()}`;
    ui.detail.textContent = 'The computer is consulting the bottom-up minimax table.';
  }
}

function renderControls() {
  ui.modeHuman.setAttribute('aria-pressed', String(mode === 'human'));
  ui.modeAuto.setAttribute('aria-pressed', String(mode === 'auto'));
  ui.playerA.setAttribute('aria-pressed', String(humanPlayer === 'A'));
  ui.playerB.setAttribute('aria-pressed', String(humanPlayer === 'B'));
  ui.modeHuman.classList.toggle('is-active', mode === 'human');
  ui.modeAuto.classList.toggle('is-active', mode === 'auto');
  ui.playerA.classList.toggle('is-active', humanPlayer === 'A');
  ui.playerB.classList.toggle('is-active', humanPlayer === 'B');
  ui.playerControls.hidden = mode !== 'human';
  ui.autoControls.hidden = mode !== 'auto';
  ui.autoPlay.textContent = autoRunning ? 'Pause playback' : 'Play both sides';
  ui.autoPlay.disabled = mode !== 'auto' || getResult(state) !== null;
  ui.autoStep.disabled = mode !== 'auto' || getResult(state) !== null;
  ui.autoSpeedLabel.textContent = `${(Number(ui.autoSpeed.value) / 1000).toFixed(1)}s / turn`;
  const splitAvailable = humanMayMove() && legalMoves(state).some((move) => move.kind === 'split');
  ui.split.disabled = !splitAvailable;
  ui.split.setAttribute('aria-pressed', String(showingSplits && splitAvailable));
  ui.split.textContent = showingSplits && splitAvailable ? 'Back to taps' : 'Split fingers';
}

function renderMoveOptions() {
  ui.moveOptions.replaceChildren();
  if (!humanMayMove()) {
    const note = document.createElement('p');
    note.className = 'quiet-note';
    note.textContent = mode === 'auto' ? 'Use the playback controls to explore each move.' :
      getResult(state) ? 'Start a new game to play again.' : 'The computer is choosing a move.';
    ui.moveOptions.append(note);
    return;
  }
  const heading = document.createElement('p');
  heading.className = 'option-heading';
  heading.textContent = showingSplits ? 'Legal finger redistributions' : 'Legal taps';
  ui.moveOptions.append(heading);

  const choices = legalMoves(state).filter((move) =>
    showingSplits ? move.kind === 'split' : move.kind === 'attack');
  for (const move of choices) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'move-option';
    const score = table.get(stateKey(move.nextState)).score;
    button.textContent = `${moveLabel(state, move)}  ·  ${scoreShort(score)}`;
    button.addEventListener('click', () => {
      if (humanMayMove()) commitMove(move);
    });
    ui.moveOptions.append(button);
  }
}

function renderAI() {
  const entry = table.get(stateKey(state));
  const result = getResult(state);
  ui.aiScore.textContent = result === 'tie' ? '0 · tie' :
    result ? `${result === 'A' ? '+1' : '−1'} · Player ${result} wins` : scoreShort(entry.score);
  ui.aiReason.textContent = lastExplanation || scoreDetail(entry.score);
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

function addGraphBranch(parent, position, move) {
  const child = move.nextState;
  const childEntry = table.get(stateKey(child));
  const parentEntry = table.get(stateKey(position));
  const isBest = parentEntry.bestState !== null &&
    stateKey(parentEntry.bestState) === stateKey(child);
  const details = document.createElement('details');
  details.className = `graph-branch${isBest ? ' is-best' : ''}`;
  const summary = document.createElement('summary');
  const title = document.createElement('span');
  title.className = 'graph-branch-title';
  title.textContent = moveLabel(position, move);
  const meta = document.createElement('span');
  meta.className = 'graph-branch-meta';
  const childResult = getResult(child);
  meta.textContent = `${isBest ? 'Optimal choice · ' : ''}${scoreShort(childEntry.score)} · ${compactState(child)}${childResult ? ' · terminal' : ''}`;
  summary.append(title, meta);
  details.append(summary);
  details.addEventListener('toggle', () => {
    if (!details.open || details.dataset.loaded === 'true') return;
    details.dataset.loaded = 'true';
    const children = document.createElement('div');
    children.className = 'graph-children';
    if (childResult) {
      const text = document.createElement('p');
      text.textContent = childResult === 'tie' ? 'Horizon reached: tie.' : `Player ${childResult} wins here.`;
      children.append(text);
    } else {
      for (const next of legalMoves(child)) addGraphBranch(children, child, next);
    }
    details.append(children);
  });
  parent.append(details);
}

function renderGraph() {
  const options = legalMoves(state);
  ui.graphCurrent.textContent = `${compactState(state)} · Player ${currentPlayer()} to move · ${options.length} legal choices. Full graph: ${graph.size.toLocaleString()} positions, ${graphEdges.toLocaleString()} transitions.`;
  ui.graphChoices.replaceChildren();
  if (options.length === 0 || getResult(state)) {
    const text = document.createElement('p');
    text.className = 'quiet-note';
    text.textContent = 'This game position is complete.';
    ui.graphChoices.append(text);
    return;
  }
  for (const move of options) addGraphBranch(ui.graphChoices, state, move);
}

function render() {
  renderControls();
  renderStatus();
  renderHands();
  renderMoveOptions();
  renderAI();
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

function resetGame() {
  clearPending();
  state = structuredClone(INITIAL_STATE);
  selectedSource = null;
  showingSplits = false;
  history = [];
  lastExplanation = '';
  autoRunning = false;
  render();
  scheduleComputerIfNeeded();
}

function commitMove(move, sourceOverride = null, computer = false) {
  if (getResult(state) !== null) return;
  const legal = legalMoves(state);
  const chosen = legal.find((candidate) => stateKey(candidate.nextState) === stateKey(move.nextState));
  if (!chosen) throw new Error('The chosen move is no longer legal.');
  const actor = currentPlayer();
  const label = moveLabel(state, chosen, sourceOverride);
  const score = table.get(stateKey(chosen.nextState)).score;
  history.push({ turn: state[2] + 1, label });
  state = structuredClone(chosen.nextState);
  selectedSource = null;
  showingSplits = false;
  lastExplanation = `${computer ? 'The computer chose' : 'You chose'}: ${label}. ${scoreDetail(score)}`;
  if (getResult(state) !== null) autoRunning = false;
  render();
  if (mode === 'auto' && autoRunning) scheduleAutoTick();
  if (mode === 'human') scheduleComputerIfNeeded();
}

function scheduleComputerIfNeeded() {
  if (mode !== 'human' || currentPlayer() === humanPlayer || getResult(state) !== null) return;
  const ticket = generation;
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    if (ticket !== generation || mode !== 'human' || currentPlayer() === humanPlayer) return;
    const move = bestMove(state, table);
    if (!move) throw new Error('The computer has no legal move.');
    commitMove(move, null, true);
  }, 420);
}

function scheduleAutoTick() {
  if (mode !== 'auto' || !autoRunning || getResult(state) !== null) return;
  const ticket = generation;
  const delay = Math.max(150, Math.min(2000, Number(ui.autoSpeed.value) || 700));
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    if (ticket !== generation || mode !== 'auto' || !autoRunning) return;
    const move = bestMove(state, table);
    if (!move) throw new Error('The autonomous player has no legal move.');
    commitMove(move, null, true);
  }, delay);
}

function handleHandClick(player, index) {
  if (!humanMayMove() || showingSplits) return;
  const count = handsFor(state, player)[index];
  if (count === 0) return;
  if (player === humanPlayer) {
    selectedSource = selectedSource === index ? null : index;
    render();
    return;
  }
  if (selectedSource === null) return;
  const selectedCount = handsFor(state, humanPlayer)[selectedSource];
  // Duplicate resulting states are deduplicated in the rule engine. A click on
  // either same-valued source hand must still perform the identical legal tap.
  const move = legalMoves(state).find((candidate) =>
    candidate.kind === 'attack' && candidate.target === index &&
    handsFor(state, humanPlayer)[candidate.source] === selectedCount);
  if (move) commitMove(move, selectedSource);
}

ui.modeHuman.addEventListener('click', () => { mode = 'human'; resetGame(); });
ui.modeAuto.addEventListener('click', () => { mode = 'auto'; resetGame(); });
ui.playerA.addEventListener('click', () => { humanPlayer = 'A'; resetGame(); });
ui.playerB.addEventListener('click', () => { humanPlayer = 'B'; resetGame(); });
ui.restart.addEventListener('click', resetGame);
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
  if (mode !== 'auto' || getResult(state) !== null) return;
  autoRunning = !autoRunning;
  if (!autoRunning) clearPending();
  render();
  if (autoRunning) scheduleAutoTick();
});
ui.autoStep.addEventListener('click', () => {
  if (mode !== 'auto' || getResult(state) !== null) return;
  clearPending();
  autoRunning = false;
  const move = bestMove(state, table);
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

render();
