import type { PracticeAttempt, PracticeSession } from '../types/session'
import { isPracticeConfiguration } from './practiceConfiguration'

export interface CompletedSession {
  session: PracticeSession
  attempts: PracticeAttempt[]
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
function count(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}
function date(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}
function identifier(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function isCompletedSession(value: unknown): value is CompletedSession {
  if (!object(value) || !object(value.session) || !Array.isArray(value.attempts)) return false
  const { session, attempts } = value
  if (
    !isPracticeConfiguration(session) ||
    !identifier(session.id) ||
    !date(session.startedAt) ||
    !date(session.completedAt) ||
    Date.parse(session.completedAt) < Date.parse(session.startedAt) ||
    !count(session.attempted) ||
    !count(session.correct) ||
    !count(session.incorrect) ||
    session.correct + session.incorrect !== session.attempted ||
    attempts.length !== session.attempted ||
    (session.sessionLength !== 'continuous' && session.attempted > session.sessionLength)
  )
    return false
  const ids = new Set<string>()
  const questionIds = new Set<string>()
  let correct = 0
  for (const attempt of attempts) {
    if (
      !object(attempt) ||
      !identifier(attempt.id) ||
      ids.has(attempt.id) ||
      !identifier(attempt.questionId) ||
      questionIds.has(attempt.questionId) ||
      attempt.sessionId !== session.id ||
      !session.operations.includes(attempt.operation as PracticeAttempt['operation']) ||
      attempt.difficulty !== session.difficulty ||
      !count(attempt.firstOperand) ||
      !count(attempt.secondOperand) ||
      !count(attempt.correctAnswer) ||
      !count(attempt.selectedAnswer) ||
      typeof attempt.selfReportedCorrect !== 'boolean' ||
      !['regular', 'mistake-review'].includes(attempt.source as string) ||
      !date(attempt.attemptedAt)
    )
      return false
    const a = attempt.firstOperand
    const b = attempt.secondOperand
    const answer =
      attempt.operation === 'addition'
        ? a + b
        : attempt.operation === 'subtraction'
          ? a - b
          : attempt.operation === 'multiplication'
            ? a * b
            : a / b
    if (answer !== attempt.correctAnswer || !Number.isSafeInteger(answer)) return false
    ids.add(attempt.id)
    questionIds.add(attempt.questionId)
    correct += Number(attempt.selfReportedCorrect)
  }
  return correct === session.correct
}

export function summaryFromState(state: unknown): CompletedSession | null {
  return object(state) && isCompletedSession(state.completedSession) ? state.completedSession : null
}

export function summarize({ session, attempts }: CompletedSession) {
  return {
    attempted: session.attempted,
    correct: session.correct,
    incorrect: session.incorrect,
    accuracy: session.attempted === 0 ? 0 : Math.round((session.correct / session.attempted) * 100),
    operations: session.operations.filter((operation) =>
      attempts.some((attempt) => attempt.operation === operation),
    ),
    reviewCount: attempts.filter((attempt) => attempt.source === 'mistake-review').length,
  }
}
