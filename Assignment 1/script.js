"use strict";

const MIN_CHECKERS = 1;
const MAX_CHECKERS = 20;
const BASE_STEP_DURATION = 1000;

const checkerCountInput = document.querySelector("#checker-count");
const startButton = document.querySelector("#start-button");
const pauseButton = document.querySelector("#pause-button");
const previousButton = document.querySelector("#previous-button");
const nextButton = document.querySelector("#next-button");
const resetButton = document.querySelector("#reset-button");
const speedSlider = document.querySelector("#speed-slider");
const speedOutput = document.querySelector("#speed-output");
const checkerBoard = document.querySelector("#checker-board");
const stateArray = document.querySelector("#state-array");
const statusMessage = document.querySelector("#status-message");
const recursionDetail = document.querySelector("#recursion-detail");
const recursionLevel = document.querySelector("#recursion-level");
const targetState = document.querySelector("#target-state");
const stepNumber = document.querySelector("#step-number");
const stepTotal = document.querySelector("#step-total");
const swapLog = document.querySelector("#swap-log");

let frames = [];
let currentFrame = 0;
let activeN = Number(checkerCountInput.value);
let timerId = null;
let isPlaying = false;
let hasStarted = false;
let activeAnimations = [];
let motionGeneration = 0;

/**
 * Build every state in the solution using the same recursive strategy as the
 * Python program. Each recorded move swaps neighboring array positions only.
 */
function buildRecursiveSolution(n) {
  const checkers = [
    ...Array(n).fill(0),
    ...Array(n).fill(1),
  ];
  const solutionFrames = [{
    number: 0,
    leftIndex: null,
    rightIndex: null,
    recursionLevel: 0,
    state: [...checkers],
  }];

  function recordSwap(leftIndex, rightIndex, level) {
    solutionFrames.push({
      number: solutionFrames.length,
      leftIndex,
      rightIndex,
      recursionLevel: level,
      state: [...checkers],
    });
  }

  function moveBlackLeft(currentIndex, destinationIndex, level) {
    if (currentIndex === destinationIndex) {
      return;
    }

    const leftIndex = currentIndex - 1;
    [checkers[leftIndex], checkers[currentIndex]] = [
      checkers[currentIndex],
      checkers[leftIndex],
    ];
    recordSwap(leftIndex, currentIndex, level);
    moveBlackLeft(currentIndex - 1, destinationIndex, level);
  }

  function arrangeRecursively(startIndex, pairsRemaining, level = 1) {
    if (pairsRemaining <= 1) {
      return;
    }

    const firstBlackIndex = startIndex + pairsRemaining;
    const blackDestination = startIndex + 1;
    moveBlackLeft(firstBlackIndex, blackDestination, level);
    arrangeRecursively(startIndex + 2, pairsRemaining - 1, level + 1);
  }

  arrangeRecursively(0, n);
  return solutionFrames;
}

function getValidCheckerCount(showMessage = true) {
  const value = Number(checkerCountInput.value);
  const isWholeNumber = Number.isInteger(value);
  const isInRange = value >= MIN_CHECKERS && value <= MAX_CHECKERS;

  if (!isWholeNumber || !isInRange) {
    checkerCountInput.setAttribute("aria-invalid", "true");
    if (showMessage) {
      statusMessage.textContent = `Enter a whole number from ${MIN_CHECKERS} to ${MAX_CHECKERS}.`;
    }
    return null;
  }

  checkerCountInput.removeAttribute("aria-invalid");
  return value;
}

function prepareSolution(n) {
  cancelMotion();
  hasStarted = false;
  activeN = n;
  frames = buildRecursiveSolution(n);
  currentFrame = 0;
  isPlaying = false;
  render();
}

function stopTimer() {
  if (timerId !== null) {
    window.clearTimeout(timerId);
    timerId = null;
  }
}

function cancelMotion() {
  stopTimer();
  motionGeneration += 1;
  activeAnimations.forEach(animation => animation.cancel());
  activeAnimations = [];
}

function scheduleNextFrame() {
  stopTimer();
  if (!isPlaying) {
    return;
  }

  if (currentFrame >= frames.length - 1) {
    finishAnimation();
    return;
  }

  const pauseBetweenSwaps = (BASE_STEP_DURATION * 0.14) / Number(speedSlider.value);
  timerId = window.setTimeout(animateNextSwap, pauseBetweenSwaps);
}

async function animateNextSwap() {
  timerId = null;
  if (!isPlaying || currentFrame >= frames.length - 1) {
    return;
  }

  const nextFrame = frames[currentFrame + 1];
  const leftChecker = checkerBoard.children[nextFrame.leftIndex];
  const rightChecker = checkerBoard.children[nextFrame.rightIndex];

  if (!leftChecker || !rightChecker || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    currentFrame += 1;
    render();
    scheduleNextFrame();
    return;
  }

  const horizontalDistance = rightChecker.getBoundingClientRect().left
    - leftChecker.getBoundingClientRect().left;
  const liftDistance = Math.max(22, leftChecker.getBoundingClientRect().height * 0.48);
  const animationDuration = BASE_STEP_DURATION * 0.82;
  const generation = ++motionGeneration;

  statusMessage.textContent = `Moving red above and black below — positions ${nextFrame.leftIndex + 1} and ${nextFrame.rightIndex + 1}`;

  const redAnimation = leftChecker.animate([
    { transform: "translate(0, 0)", offset: 0 },
    { transform: `translate(0, ${-liftDistance}px)`, offset: 0.24 },
    { transform: `translate(${horizontalDistance}px, ${-liftDistance}px)`, offset: 0.76 },
    { transform: `translate(${horizontalDistance}px, 0)`, offset: 1 },
  ], {
    duration: animationDuration,
    easing: "cubic-bezier(0.45, 0, 0.2, 1)",
    fill: "forwards",
  });

  const blackAnimation = rightChecker.animate([
    { transform: "translate(0, 0)", offset: 0 },
    { transform: `translate(0, ${liftDistance}px)`, offset: 0.24 },
    { transform: `translate(${-horizontalDistance}px, ${liftDistance}px)`, offset: 0.76 },
    { transform: `translate(${-horizontalDistance}px, 0)`, offset: 1 },
  ], {
    duration: animationDuration,
    easing: "cubic-bezier(0.45, 0, 0.2, 1)",
    fill: "forwards",
  });

  activeAnimations = [redAnimation, blackAnimation];
  const playbackSpeed = Number(speedSlider.value);
  activeAnimations.forEach(animation => {
    animation.playbackRate = playbackSpeed;
  });

  try {
    await Promise.all(activeAnimations.map(animation => animation.finished));
  } catch {
    return;
  }

  if (!isPlaying || generation !== motionGeneration) {
    return;
  }

  activeAnimations = [];
  currentFrame += 1;
  render();
  scheduleNextFrame();
}

function startAnimation() {
  const n = getValidCheckerCount();
  if (n === null) {
    return;
  }

  if (n !== activeN || currentFrame >= frames.length - 1) {
    prepareSolution(n);
  }

  hasStarted = true;
  isPlaying = true;
  statusMessage.textContent = currentFrame === 0
    ? "Starting recursive solution…"
    : "Animation resumed";
  renderControls();
  scheduleNextFrame();
}

function togglePause() {
  if (isPlaying) {
    isPlaying = false;
    cancelMotion();
    statusMessage.textContent = "Animation paused";
    renderControls();
    return;
  }

  if (currentFrame < frames.length - 1) {
    isPlaying = true;
    statusMessage.textContent = "Animation resumed";
    renderControls();
    scheduleNextFrame();
  }
}

function finishAnimation() {
  isPlaying = false;
  cancelMotion();
  statusMessage.textContent = "Solved — the checkers now alternate red and black";
  renderControls();
}

function pauseForManualStep() {
  isPlaying = false;
  cancelMotion();
}

function showNextFrame() {
  const n = getValidCheckerCount();
  if (n === null) {
    return;
  }

  if (n !== activeN) {
    prepareSolution(n);
  }

  pauseForManualStep();
  if (currentFrame < frames.length - 1) {
    currentFrame += 1;
    render();
  }

  statusMessage.textContent = currentFrame === frames.length - 1
    ? "Solved — the checkers now alternate red and black"
    : "Manual step forward";
  renderControls();
}

function showPreviousFrame() {
  pauseForManualStep();
  if (currentFrame > 0) {
    currentFrame -= 1;
    render();
    statusMessage.textContent = currentFrame === 0
      ? "Returned to the initial arrangement"
      : "Manual step backward";
    renderControls();
  }
}

function resetAnimation() {
  const n = getValidCheckerCount(false) ?? activeN;
  checkerCountInput.value = n;
  prepareSolution(n);
  statusMessage.textContent = "Reset to the initial arrangement";
  renderControls();
}

function render() {
  const frame = frames[currentFrame];
  if (!frame) {
    return;
  }

  checkerBoard.replaceChildren(...frame.state.map((checker, index) => {
    const element = document.createElement("span");
    const color = checker === 0 ? "red" : "black";
    element.className = `checker checker-${color}`;
    element.textContent = checker;
    element.setAttribute("aria-label", `${color} checker at position ${index + 1}`);

    if (index === frame.leftIndex || index === frame.rightIndex) {
      element.classList.add("checker-swapped");
    }
    return element;
  }));

  checkerBoard.setAttribute(
    "aria-label",
    `Current arrangement: ${frame.state.map(value => value === 0 ? "red" : "black").join(", ")}`,
  );
  stateArray.textContent = `[${frame.state.join(", ")}]`;
  targetState.textContent = `[${Array.from({ length: activeN * 2 }, (_, index) => index % 2).join(", ")}]`;
  stepNumber.textContent = `Step ${currentFrame}`;
  stepTotal.textContent = `${frames.length - 1} ${frames.length === 2 ? "swap" : "swaps"}`;

  if (currentFrame === 0) {
    recursionDetail.hidden = true;
  } else {
    recursionDetail.hidden = false;
    recursionLevel.textContent = frame.recursionLevel;
  }

  if (isPlaying && currentFrame > 0) {
    statusMessage.textContent = `Swapped positions ${frame.leftIndex + 1} and ${frame.rightIndex + 1}`;
  }

  renderSwapLog();
  renderControls();
}

function renderSwapLog() {
  if (currentFrame === 0) {
    swapLog.innerHTML = `
      <div class="empty-log">
        <span class="empty-log-icon" aria-hidden="true">↔</span>
        <p>Press Play or Next to reveal the recursive swap sequence.</p>
      </div>
    `;
    return;
  }

  const visibleFrames = frames.slice(1, currentFrame + 1);
  swapLog.replaceChildren(...visibleFrames.map(frame => {
    const entry = document.createElement("div");
    entry.className = "log-entry";
    if (frame.number === currentFrame) {
      entry.classList.add("log-entry-current");
    }

    const step = document.createElement("span");
    step.className = "log-step";
    step.textContent = `Step ${frame.number}`;

    const swap = document.createElement("span");
    swap.className = "log-swap";
    swap.innerHTML = `Positions <strong>${frame.leftIndex + 1} ↔ ${frame.rightIndex + 1}</strong>`;

    const state = document.createElement("span");
    state.className = "log-state";
    state.textContent = `[${frame.state.join(", ")}]`;

    entry.append(step, swap, state);
    return entry;
  }));

  window.requestAnimationFrame(() => {
    swapLog.scrollTo({
      top: swapLog.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  });
}

function renderControls() {
  const atStart = currentFrame === 0;
  const atEnd = currentFrame === frames.length - 1;

  startButton.textContent = atEnd && currentFrame > 0 ? "Replay" : "Play";
  startButton.disabled = isPlaying;
  pauseButton.disabled = !isPlaying && (atEnd || (atStart && !hasStarted));
  pauseButton.textContent = isPlaying ? "Pause" : "Resume";
  previousButton.disabled = atStart;
  nextButton.disabled = atEnd;
}

startButton.addEventListener("click", startAnimation);
pauseButton.addEventListener("click", togglePause);
previousButton.addEventListener("click", showPreviousFrame);
nextButton.addEventListener("click", showNextFrame);
resetButton.addEventListener("click", resetAnimation);

checkerCountInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    startAnimation();
  }
});

checkerCountInput.addEventListener("input", () => {
  const n = getValidCheckerCount(false);

  if (n === null) {
    isPlaying = false;
    cancelMotion();
    startButton.textContent = "Play";
    startButton.disabled = false;
    pauseButton.disabled = true;
    previousButton.disabled = true;
    nextButton.disabled = true;
    statusMessage.textContent = `Enter a whole number from ${MIN_CHECKERS} to ${MAX_CHECKERS}.`;
    return;
  }

  prepareSolution(n);
  statusMessage.textContent = "Ready to play with the new checker count";
  renderControls();
});

speedSlider.addEventListener("input", () => {
  speedOutput.value = `${Number(speedSlider.value)}×`;
  activeAnimations.forEach(animation => {
    animation.playbackRate = Number(speedSlider.value);
  });
  if (isPlaying && activeAnimations.length === 0) {
    scheduleNextFrame();
  }
});

prepareSolution(activeN);
