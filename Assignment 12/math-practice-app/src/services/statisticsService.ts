import type { AppStatistics } from '../types/statistics'
import type { StoredSession } from './storageService'
import {
  lifetimeStatistics,
  mergeSessionAggregates,
  type SessionAggregate,
} from './lifetimeStatistics'

export function accuracy(attempted: number, correct: number): number {
  return attempted === 0 ? 0 : Math.round((correct / attempted) * 100)
}
export function calculateStatistics(
  records: readonly StoredSession[],
  summaries: readonly SessionAggregate[] = [],
): AppStatistics {
  return lifetimeStatistics(mergeSessionAggregates(summaries, records))
}
