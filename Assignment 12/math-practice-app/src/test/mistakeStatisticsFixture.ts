import type { MathOperation } from '../types/question'
import { emptySavedData, trackMistakes } from '../services/storageService'
import type { MistakeEvent } from '../services/mistakeService'
import { mistakeKey } from '../services/mistakeService'

export function wrongFact(
  id: string,
  operation: MathOperation,
  a: number,
  b: number,
  at: string,
): MistakeEvent {
  const correctAnswer =
    operation === 'addition'
      ? a + b
      : operation === 'subtraction'
        ? a - b
        : operation === 'multiplication'
          ? a * b
          : a / b
  return {
    sessionStartedAt: at,
    attempt: {
      id,
      questionId: `q-${id}`,
      sessionId: `session-${id}`,
      operation,
      firstOperand: a,
      secondOperand: b,
      correctAnswer,
      selectedAnswer: correctAnswer,
      selfReportedCorrect: false,
      difficulty: 1,
      source: 'regular',
      attemptedAt: at,
    },
  }
}
export function mistakeStatisticsFixture() {
  const first = wrongFact('addition-one', 'addition', 4, 3, '2026-10-18T00:00:00Z')
  const second = wrongFact('addition-two', 'addition', 4, 3, '2026-10-18T01:00:00Z')
  const third = wrongFact('subtraction-one', 'subtraction', 8, 2, '2026-10-18T02:00:00Z')
  const fourth = wrongFact('subtraction-two', 'subtraction', 8, 2, '2026-10-18T03:00:00Z')
  const reviewEvents = [false, true, true, true].map((correct, index): MistakeEvent => ({
    sessionStartedAt: '2026-10-19T00:00:00Z',
    attempt: {
      ...first.attempt,
      id: `review-${index}`,
      questionId: `review-q-${index}`,
      sessionId: 'review-session',
      source: 'mistake-review',
      mistakePatternId: mistakeKey(third.attempt),
      operation: 'addition',
      firstOperand: 2,
      secondOperand: 6,
      correctAnswer: 8,
      selectedAnswer: 8,
      selfReportedCorrect: correct,
      attemptedAt: new Date(Date.parse('2026-10-19T00:00:00Z') + index * 1000).toISOString(),
    },
  }))
  return trackMistakes({
    ...emptySavedData(),
    records: [],
    mistakeEvents: [first, second, third, fourth],
    reviewEvents,
  })
}
