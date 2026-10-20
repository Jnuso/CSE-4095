import type { AppStatistics } from '../types/statistics'
import type { StoredSession } from './storageService'
import { recentRecords } from './storageService'

export function accuracy(attempted: number, correct: number): number {
  return attempted === 0 ? 0 : Math.round((correct / attempted) * 100)
}
export function calculateStatistics(records: readonly StoredSession[]): AppStatistics {
  const empty = () => ({ attempted: 0, correct: 0, incorrect: 0 })
  const result: AppStatistics = {
    ...empty(),
    byOperation: {
      addition: empty(),
      subtraction: empty(),
      multiplication: empty(),
      division: empty(),
    },
    byDifficulty: { 1: empty(), 2: empty(), 3: empty(), 4: empty() },
  }
  for (const record of recentRecords(records)) {
    for (const attempt of record.attempts) {
      for (const bucket of [
        result,
        result.byOperation[attempt.operation],
        result.byDifficulty[attempt.difficulty],
      ]) {
        bucket.attempted++
        bucket.correct += Number(attempt.selfReportedCorrect)
        bucket.incorrect += Number(!attempt.selfReportedCorrect)
      }
    }
  }
  return result
}
