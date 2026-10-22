import { describe, expect, it } from 'vitest'
import { completedFixture } from '../test/summaryFixture'
import { calculateStatistics } from './statisticsService'
import {
  emptySavedData,
  readSavedData,
  STORAGE_KEY,
  trackMistakes,
  writeSavedData,
} from './storageService'
import { isSessionAggregate, mergeSessionAggregates, summarizeSession } from './lifetimeStatistics'

function record(index: number) {
  const value = completedFixture()
  value.session.id = `lifetime-${index}`
  value.session.startedAt = new Date(Date.UTC(2026, 0, 1) + index * 60000).toISOString()
  value.session.completedAt = new Date(Date.UTC(2026, 0, 1) + index * 60000 + 1000).toISOString()
  value.attempts.forEach((a) => {
    a.sessionId = value.session.id
    a.attemptedAt = value.session.startedAt
  })
  return value
}
const totals = (data: ReturnType<typeof emptySavedData>) =>
  calculateStatistics(data.records, data.sessionTotals)

describe('lifetime totals and migration', () => {
  it('retains totals and breakdowns beyond 100 details through save/reload', () => {
    const data = { ...emptySavedData(), records: Array.from({ length: 105 }, (_, i) => record(i)) }
    expect(writeSavedData(data)).toBeNull()
    const loaded = readSavedData().data
    expect(loaded.records).toHaveLength(100)
    expect(loaded.sessionTotals).toHaveLength(105)
    expect(totals(loaded)).toMatchObject({
      attempted: 315,
      correct: 210,
      incorrect: 105,
      byOperation: {
        addition: { attempted: 105, correct: 105 },
        subtraction: { attempted: 105, incorrect: 105 },
      },
      byDifficulty: { 2: { attempted: 315, correct: 210 } },
    })
    expect(writeSavedData(loaded)).toBeNull()
    expect(totals(readSavedData().data)).toEqual(totals(loaded))
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).version).toBe(3)
  })
  it('migrates legacy available history before trimming, without rewriting on read', () => {
    const raw = JSON.stringify({
      ...emptySavedData(),
      records: Array.from({ length: 101 }, (_, i) => record(i)),
    })
    localStorage.setItem(STORAGE_KEY, raw)
    const loaded = readSavedData()
    expect(loaded.warnings).toEqual([])
    expect(totals(loaded.data).attempted).toBe(303)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
    expect(writeSavedData(loaded.data)).toBeNull()
    expect(totals(readSavedData().data).attempted).toBe(303)
  })
  it('deduplicates disk/memory snapshots and never rolls an archived session backward', () => {
    const full = record(0),
      partial = structuredClone(full)
    partial.attempts = partial.attempts.slice(0, 1)
    Object.assign(partial.session, { attempted: 1, correct: 1, incorrect: 0 })
    const archived = summarizeSession(full)
    const merged = mergeSessionAggregates([archived, archived], [partial, full, partial])
    expect(merged).toEqual([archived])
    expect(calculateStatistics([], merged).attempted).toBe(3)
    expect(mergeSessionAggregates(merged, [partial])).toEqual(merged)
  })
  it('merges distinct tab histories in either order and preserves a late archived update', () => {
    const a = record(0),
      b = record(1)
    const first = mergeSessionAggregates([summarizeSession(a)], [b])
    expect(first).toEqual(mergeSessionAggregates([summarizeSession(b)], [a]))
    const partial = structuredClone(a)
    partial.attempts = partial.attempts.slice(0, 1)
    const earlier = summarizeSession(partial)
    expect(calculateStatistics([], mergeSessionAggregates([earlier], [a, b])).attempted).toBe(6)
  })
  it('reset fences discard old summaries and records while allowing fresh practice', () => {
    const old = record(0),
      fresh = record(2)
    const cutoff = Date.parse(old.session.startedAt)
    const saved = trackMistakes({
      ...emptySavedData(),
      historyResetAt: cutoff,
      records: [fresh],
      sessionTotals: [summarizeSession(old)],
    })
    expect(totals(saved).attempted).toBe(3)
    expect(saved.sessionTotals?.map((s) => s.id)).toEqual([fresh.session.id])
  })
  it('repairs damaged aggregate entries independently and protects unknown formats', () => {
    const valid = summarizeSession(record(0))
    const raw = JSON.stringify({
      ...emptySavedData(),
      version: 3,
      sessionTotals: [valid, { ...valid, id: 'bad', counts: [[1, 2]] }],
    })
    localStorage.setItem(STORAGE_KEY, raw)
    const loaded = readSavedData()
    expect(loaded.warnings.join(' ')).toContain('lifetime totals')
    expect(totals(loaded.data).attempted).toBe(3)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...emptySavedData(), version: 3, journalFormat: 'future' }),
    )
    expect(readSavedData().canWrite).toBe(false)
  })
  it('does not count invalid summary fields', () => {
    const valid = summarizeSession(record(0))
    expect(isSessionAggregate(valid)).toBe(true)
    for (const patch of [
      {
        counts: [
          [1, 2],
          [0, 0],
          [0, 0],
          [0, 0],
        ],
      },
      { difficulty: 9 },
      { startedAt: 'bad' },
    ])
      expect(isSessionAggregate({ ...valid, ...patch })).toBe(false)
  })
})
