import type { MistakeEvent } from './mistakeService'
import type { MistakePattern } from '../types/mistake'

/** Lossless transport encoding. Version 2 makes older clients protect these saves from writes. */
export function packEvent({ sessionStartedAt, attempt: a }: MistakeEvent): unknown[] {
  return [
    sessionStartedAt,
    a.id,
    a.questionId,
    a.sessionId,
    a.operation,
    a.firstOperand,
    a.secondOperand,
    a.correctAnswer,
    a.selectedAnswer,
    a.selfReportedCorrect,
    a.difficulty,
    a.source,
    a.attemptedAt,
    a.mistakePatternId ?? null,
  ]
}
export function unpackEvent(value: unknown): unknown {
  if (!Array.isArray(value) || value.length !== 14) return null
  const [
    sessionStartedAt,
    id,
    questionId,
    sessionId,
    operation,
    firstOperand,
    secondOperand,
    correctAnswer,
    selectedAnswer,
    selfReportedCorrect,
    difficulty,
    source,
    attemptedAt,
    mistakePatternId,
  ] = value
  return {
    sessionStartedAt,
    attempt: {
      id,
      questionId,
      sessionId,
      operation,
      firstOperand,
      secondOperand,
      correctAnswer,
      selectedAnswer,
      selfReportedCorrect,
      difficulty,
      source,
      attemptedAt,
      ...(mistakePatternId === null ? {} : { mistakePatternId }),
    },
  }
}
export function packPattern(p: MistakePattern): unknown[] {
  return [
    p.id,
    p.operation,
    p.firstOperand,
    p.secondOperand,
    p.correctAnswer,
    p.difficulty,
    p.incorrectCount,
    p.similarCorrectCount,
    p.lastIncorrectAt,
    p.mastered,
  ]
}
export function unpackPattern(value: unknown): unknown {
  if (!Array.isArray(value) || value.length !== 10) return null
  const [
    id,
    operation,
    firstOperand,
    secondOperand,
    correctAnswer,
    difficulty,
    incorrectCount,
    similarCorrectCount,
    lastIncorrectAt,
    mastered,
  ] = value
  return {
    id,
    operation,
    firstOperand,
    secondOperand,
    correctAnswer,
    difficulty,
    incorrectCount,
    similarCorrectCount,
    lastIncorrectAt,
    mastered,
  }
}
