import { OPERATIONS } from '../constants/practice'
import type { MistakePattern } from '../types/mistake'
import type { SavedData } from './storageService'
import { mergeAttemptEvents } from './mistakeService'

type StatisticsData = Pick<
  SavedData,
  'records' | 'mistakePatterns' | 'reviewEvents' | 'historyResetAt'
>
const operationOrder = (pattern: MistakePattern) =>
  OPERATIONS.findIndex((op) => op.value === pattern.operation)
export function sortMistakePatterns(patterns: readonly MistakePattern[]): MistakePattern[] {
  return [...patterns].sort(
    (a, b) =>
      b.incorrectCount - a.incorrectCount ||
      Date.parse(b.lastIncorrectAt) - Date.parse(a.lastIncorrectAt) ||
      operationOrder(a) - operationOrder(b) ||
      a.difficulty - b.difficulty ||
      a.firstOperand - b.firstOperand ||
      a.secondOperand - b.secondOperand ||
      a.id.localeCompare(b.id),
  )
}
/** Read-only projection of validated/rebuilt storage. Never increments or changes saved progress. */
export function calculateMistakeStatistics(data: StatisticsData) {
  const patterns = sortMistakePatterns(data.mistakePatterns ?? [])
  const active = patterns.filter((pattern) => !pattern.mastered)
  const mastered = patterns.filter((pattern) => pattern.mastered)
  // Include retained legacy review attempts without target IDs; their outcomes still count as practice.
  const fromRecords = data.records.flatMap((record) =>
    record.attempts
      .filter((attempt) => attempt.source === 'mistake-review')
      .map((attempt) => ({ attempt, sessionStartedAt: record.session.startedAt })),
  )
  const reviews = mergeAttemptEvents(
    [...(data.reviewEvents ?? []), ...fromRecords],
    data.historyResetAt,
  )
  const byOperation = OPERATIONS.map(({ value, label }) => ({
    operation: value,
    label,
    incorrectCount: patterns
      .filter((pattern) => pattern.operation === value)
      .reduce((sum, pattern) => sum + pattern.incorrectCount, 0),
  }))
  const maximum = Math.max(0, ...byOperation.map((op) => op.incorrectCount))
  return {
    active,
    mastered,
    reviewAttempted: reviews.length,
    reviewCorrect: reviews.filter(({ attempt }) => attempt.selfReportedCorrect).length,
    mostMissedOperations: byOperation.filter((op) => maximum > 0 && op.incorrectCount === maximum),
    mostMissedFacts: patterns.filter(
      (pattern) => pattern.incorrectCount === patterns[0]?.incorrectCount,
    ),
  }
}
