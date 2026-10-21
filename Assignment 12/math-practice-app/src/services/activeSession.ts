import type { SessionState } from './practiceSession'
import { isValidGeneratedQuestion } from './questionGenerator'
import { isMistakePattern } from './mistakeService'
import { isStoredSession, readSavedData, STORAGE_KEY } from './storageService'

export interface CardSnapshot {
  questionId: string
  selectedAnswer: number | null
  flipped: boolean
}
export interface ActiveSnapshot {
  version: 1
  entryKey: string
  state: SessionState
  card: CardSnapshot | null
}
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

function question(value: unknown): boolean {
  return (
    object(value) &&
    isValidGeneratedQuestion({ ...value, source: 'regular' }) &&
    Array.isArray(value.choices) &&
    value.choices.length === 4 &&
    ((value.source === 'regular' && value.mistakePatternId === undefined) ||
      (value.source === 'mistake-review' &&
        typeof value.mistakePatternId === 'string' &&
        !!value.mistakePatternId.trim()))
  )
}

export function isActiveSnapshot(value: unknown): value is ActiveSnapshot {
  if (
    !object(value) ||
    value.version !== 1 ||
    typeof value.entryKey !== 'string' ||
    !object(value.state)
  )
    return false
  const state = value.state
  if (
    !isStoredSession(state) ||
    state.isActive !== true ||
    state.session.completedAt !== undefined ||
    !Number.isSafeInteger(state.questionIndex) ||
    state.questionIndex !== state.attempts.length ||
    (state.session.sessionLength !== 'continuous' &&
      state.attempts.length >= state.session.sessionLength) ||
    (state.error !== null && typeof state.error !== 'string') ||
    (state.question === null ? typeof state.error !== 'string' : !question(state.question)) ||
    (state.previousQuestion !== null && !question(state.previousQuestion))
  )
    return false
  if (state.question) {
    const q = state.question as SessionState['question'] & {}
    if (
      q.difficulty !== state.session.difficulty ||
      state.attempts.some((a) => a.questionId === q.id)
    )
      return false
    if (state.session.reviewMode === 'mistake-review') {
      if (q.source !== 'mistake-review') return false
    } else if (q.source !== 'regular' || !state.session.operations.includes(q.operation))
      return false
  }
  if (state.session.reviewMode === 'mistake-review') {
    if (
      !Array.isArray(state.reviewPatterns) ||
      !state.reviewPatterns.every(isMistakePattern) ||
      !state.reviewPatterns.every(
        (p) =>
          p.difficulty === state.session.difficulty &&
          state.session.operations.includes(p.operation),
      ) ||
      !Array.isArray(state.reviewQuestions) ||
      !state.reviewQuestions.every(question) ||
      !Number.isSafeInteger(state.masteryThreshold) ||
      Number(state.masteryThreshold) < 1 ||
      Number(state.masteryThreshold) > 100
    )
      return false
    const q = state.question as SessionState['question']
    if (
      q &&
      !state.reviewPatterns.some(
        (p) => p.id === q.mistakePatternId && p.difficulty === q.difficulty,
      )
    )
      return false
  } else if (
    state.reviewPatterns !== undefined ||
    state.reviewQuestions !== undefined ||
    state.masteryThreshold !== undefined
  ) {
    return false
  }
  if (value.card !== null) {
    if (
      !object(value.card) ||
      !object(state.question) ||
      value.card.questionId !== state.question.id ||
      typeof value.card.flipped !== 'boolean' ||
      (value.card.selectedAnswer !== null &&
        !(state.question.choices as number[]).includes(value.card.selectedAnswer as number)) ||
      (value.card.flipped && value.card.selectedAnswer === null)
    )
      return false
  }
  return true
}

/** Per-tab recovery uses the same app key in sessionStorage; resets are fenced by the durable save. */
export function readActiveSession(entryKey: string): {
  snapshot: ActiveSnapshot | null
  unavailable: boolean
} {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { snapshot: null, unavailable: false }
    const value: unknown = JSON.parse(raw)
    if (object(value) && value.entryKey !== entryKey) return { snapshot: null, unavailable: false }
    if (!isActiveSnapshot(value)) return { snapshot: null, unavailable: true }
    const disk = readSavedData()
    const started = Date.parse(value.state.session.startedAt)
    const saved = disk.data.records.find((r) => r.session.id === value.state.session.id)
    if (
      !disk.canWrite ||
      started <= (disk.data.historyResetAt ?? 0) ||
      saved?.session.completedAt ||
      (saved && saved.attempts.length > value.state.attempts.length)
    )
      return { snapshot: null, unavailable: true }
    return { snapshot: value, unavailable: false }
  } catch {
    return { snapshot: null, unavailable: true }
  }
}

export function saveActiveSession(snapshot: ActiveSnapshot): string | null {
  try {
    const disk = readSavedData()
    if (
      !disk.canWrite ||
      Date.parse(snapshot.state.session.startedAt) <= (disk.data.historyResetAt ?? 0)
    )
      return 'Session recovery is unavailable. Your completed answers may still be saved.'
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    return null
  } catch {
    return 'This session could not be saved for recovery. Avoid refreshing until you finish.'
  }
}

export function closeActiveSession(entryKey: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, entryKey, closed: true }))
  } catch {
    /* Storage warning is handled by the caller's normal history save. */
  }
}
