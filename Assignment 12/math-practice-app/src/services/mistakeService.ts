import type { MistakePattern } from '../types/mistake'
import type { PracticeAttempt } from '../types/session'
import { isCompletedSession } from './sessionSummary'

export interface MistakeEvent {
  attempt: PracticeAttempt
  sessionStartedAt: string
}
type Fact = Pick<MistakePattern, 'operation' | 'firstOperand' | 'secondOperand' | 'difficulty'>
export function mistakeKey(fact: Fact): string {
  return `mistake:${fact.operation}:${fact.difficulty}:${fact.firstOperand}:${fact.secondOperand}`
}
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
function whole(value: unknown, minimum = 0): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum
}
function date(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}
export function isMistakeEvent(value: unknown): value is MistakeEvent {
  if (!object(value) || !object(value.attempt) || !date(value.sessionStartedAt)) return false
  const attempt = value.attempt
  if (attempt.selfReportedCorrect !== false || !date(attempt.attemptedAt)) return false
  return isCompletedSession({
    session: {
      id: attempt.sessionId,
      operations: [attempt.operation],
      difficulty: attempt.difficulty,
      sessionLength: 'continuous',
      startedAt: value.sessionStartedAt,
      completedAt: new Date(
        Math.max(Date.parse(value.sessionStartedAt), Date.parse(attempt.attemptedAt)),
      ).toISOString(),
      attempted: 1,
      correct: 0,
      incorrect: 1,
    },
    attempts: [attempt],
  })
}
export function isMistakePattern(value: unknown): value is MistakePattern {
  if (
    !object(value) ||
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    !['addition', 'subtraction', 'multiplication', 'division'].includes(
      value.operation as string,
    ) ||
    ![1, 2, 3, 4].includes(value.difficulty as number) ||
    !whole(value.firstOperand) ||
    !whole(value.secondOperand) ||
    !whole(value.correctAnswer) ||
    !whole(value.incorrectCount, 1) ||
    !whole(value.similarCorrectCount) ||
    !date(value.lastIncorrectAt) ||
    typeof value.mastered !== 'boolean'
  )
    return false
  const a = value.firstOperand,
    b = value.secondOperand
  const answer =
    value.operation === 'addition'
      ? a + b
      : value.operation === 'subtraction'
        ? a - b
        : value.operation === 'multiplication'
          ? a * b
          : a / b
  return Number.isSafeInteger(answer) && answer === value.correctAnswer
}
// Both identities must be unique: retries and duplicate callbacks represent one reported question.
export function mergeMistakeEvents(
  events: readonly MistakeEvent[],
  cutoff?: number,
): MistakeEvent[] {
  const ids = new Set<string>(),
    questions = new Set<string>()
  return events.filter((event) => {
    if (event.attempt.selfReportedCorrect) return false
    if (cutoff !== undefined && Date.parse(event.sessionStartedAt) <= cutoff) return false
    const id = JSON.stringify([event.attempt.sessionId, event.attempt.id])
    const question = JSON.stringify([event.attempt.sessionId, event.attempt.questionId])
    if (ids.has(id) || questions.has(question)) return false
    ids.add(id)
    questions.add(question)
    return true
  })
}
export function buildMistakePatterns(
  events: readonly MistakeEvent[],
  previous: readonly MistakePattern[] = [],
): MistakePattern[] {
  const patterns = new Map<string, MistakePattern>()
  for (const { attempt } of mergeMistakeEvents(events)) {
    const key = mistakeKey(attempt)
    const current = patterns.get(key)
    if (current) {
      current.incorrectCount++
      if (Date.parse(attempt.attemptedAt) > Date.parse(current.lastIncorrectAt))
        current.lastIncorrectAt = attempt.attemptedAt
    } else
      patterns.set(key, {
        id: key,
        operation: attempt.operation,
        firstOperand: attempt.firstOperand,
        secondOperand: attempt.secondOperand,
        correctAnswer: attempt.correctAnswer,
        difficulty: attempt.difficulty,
        incorrectCount: 1,
        similarCorrectCount: 0,
        lastIncorrectAt: attempt.attemptedAt,
        mastered: false,
      })
  }
  const prior = new Map(previous.map((pattern) => [mistakeKey(pattern), pattern]))
  for (const [key, pattern] of patterns) {
    const old = prior.get(key)
    // Preserve review progress on an unchanged pattern; any new miss reopens it.
    if (
      old &&
      old.incorrectCount === pattern.incorrectCount &&
      Date.parse(old.lastIncorrectAt) === Date.parse(pattern.lastIncorrectAt)
    ) {
      pattern.similarCorrectCount = old.similarCorrectCount
      pattern.mastered = old.mastered
    }
  }
  return [...patterns.values()]
}
