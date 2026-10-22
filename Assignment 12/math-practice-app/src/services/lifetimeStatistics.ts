import type { DifficultyLevel, MathOperation } from '../types/question'
import type { AppStatistics } from '../types/statistics'
import type { StoredSession } from './storageService'

const operations: MathOperation[] = ['addition', 'subtraction', 'multiplication', 'division']
/** One monotonic snapshot per session, rather than an accumulating counter or full answer archive. */
export interface SessionAggregate {
  id: string
  startedAt: string
  difficulty: DifficultyLevel
  counts: [number, number][] // attempted, self-reported correct, in operation order
}

export function isSessionAggregate(value: unknown): value is SessionAggregate {
  if (typeof value !== 'object' || value === null) return false
  const a = value as SessionAggregate
  return (
    typeof a.id === 'string' &&
    !!a.id.trim() &&
    typeof a.startedAt === 'string' &&
    Number.isFinite(Date.parse(a.startedAt)) &&
    [1, 2, 3, 4].includes(a.difficulty) &&
    Array.isArray(a.counts) &&
    a.counts.length === 4 &&
    a.counts.every(
      (pair) =>
        Array.isArray(pair) &&
        pair.length === 2 &&
        pair.every((n) => Number.isSafeInteger(n) && n >= 0) &&
        pair[1] <= pair[0],
    ) &&
    Number.isSafeInteger(a.counts.reduce((sum, pair) => sum + pair[0], 0))
  )
}

export function summarizeSession(record: StoredSession): SessionAggregate {
  const counts: [number, number][] = operations.map(() => [0, 0])
  for (const attempt of record.attempts) {
    const pair = counts[operations.indexOf(attempt.operation)]
    pair[0]++
    pair[1] += Number(attempt.selfReportedCorrect)
  }
  return {
    id: record.session.id,
    startedAt: record.session.startedAt,
    difficulty: record.session.difficulty,
    counts,
  }
}

export function mergeSessionAggregates(
  summaries: readonly SessionAggregate[],
  records: readonly StoredSession[] = [],
  cutoff = 0,
): SessionAggregate[] {
  const byId = new Map<string, SessionAggregate>()
  for (const candidate of [...summaries, ...records.map(summarizeSession)]) {
    if (Date.parse(candidate.startedAt) <= cutoff) continue
    const old = byId.get(candidate.id)
    const size = (a: SessionAggregate) => a.counts.reduce((sum, pair) => sum + pair[0], 0)
    // A repeated/older active snapshot cannot increment totals. Deterministic ties converge across tabs.
    if (
      !old ||
      size(candidate) > size(old) ||
      (size(candidate) === size(old) && JSON.stringify(candidate) > JSON.stringify(old))
    )
      byId.set(candidate.id, candidate)
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id))
}

export function lifetimeStatistics(summaries: readonly SessionAggregate[]): AppStatistics {
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
  for (const summary of summaries) {
    summary.counts.forEach(([attempted, correct], index) => {
      for (const bucket of [
        result,
        result.byOperation[operations[index]],
        result.byDifficulty[summary.difficulty],
      ]) {
        bucket.attempted += attempted
        bucket.correct += correct
        bucket.incorrect += attempted - correct
      }
    })
  }
  return result
}
