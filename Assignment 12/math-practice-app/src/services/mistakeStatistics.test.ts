import { describe, expect, it } from 'vitest'
import { completedFixture } from '../test/summaryFixture'
import { mistakeStatisticsFixture, wrongFact } from '../test/mistakeStatisticsFixture'
import { emptySavedData, trackMistakes } from './storageService'
import { calculateMistakeStatistics, sortMistakePatterns } from './mistakeStatistics'
import { calculateStatistics } from './statisticsService'

describe('remembered mistake statistics', () => {
  it('has honest empty counts and no invented frequent area', () => {
    expect(calculateMistakeStatistics(emptySavedData())).toEqual({
      active: [],
      mastered: [],
      reviewAttempted: 0,
      reviewCorrect: 0,
      mostMissedOperations: [],
      mostMissedFacts: [],
    })
  })
  it('counts active/mastered facts, all reviews, and self-reported right answers', () => {
    const data = mistakeStatisticsFixture()
    const stats = calculateMistakeStatistics(data)
    expect(stats.active).toHaveLength(1)
    expect(stats.mastered).toHaveLength(1)
    expect(stats.reviewAttempted).toBe(4)
    expect(stats.reviewCorrect).toBe(3)
    expect(stats.mostMissedOperations).toEqual([
      { operation: 'subtraction', label: 'Subtraction', incorrectCount: 3 },
    ])
    expect(stats.mostMissedFacts[0]).toMatchObject({
      operation: 'subtraction',
      firstOperand: 8,
      secondOperand: 2,
      incorrectCount: 3,
      mastered: true,
    })
    // Wrong inverse addition review is attributed to the original subtraction, not counted twice.
    expect(stats.mostMissedOperations[0].incorrectCount).toBe(3)
  })
  it('counts retained legacy review attempts without a target and includes incomplete snapshots', () => {
    const record = completedFixture()
    delete record.session.completedAt
    record.attempts[0].source = 'mistake-review'
    const data = trackMistakes({ ...emptySavedData(), records: [record, record] })
    const stats = calculateMistakeStatistics(data)
    expect(stats.reviewAttempted).toBe(2)
    expect(stats.reviewCorrect).toBe(1)
  })
  it('deduplicates journal plus records by report and question identity', () => {
    const data = mistakeStatisticsFixture()
    const event = data.reviewEvents![0]
    data.reviewEvents!.push(event, { ...event, attempt: { ...event.attempt, id: 'different-id' } })
    data.records = [
      {
        session: {
          id: event.attempt.sessionId,
          startedAt: event.sessionStartedAt,
          operations: ['addition'],
          difficulty: 1,
          sessionLength: 5,
          attempted: 1,
          correct: 0,
          incorrect: 1,
        },
        attempts: [event.attempt],
      },
    ]
    const stats = calculateMistakeStatistics(data)
    expect(stats.reviewAttempted).toBe(4)
    expect(stats.reviewCorrect).toBe(3)
  })
  it('preserves journal totals beyond retained history and keeps the existing session statistics separate', () => {
    const data = mistakeStatisticsFixture()
    expect(data.records).toEqual([])
    expect(calculateStatistics(data.records).attempted).toBe(0)
    expect(calculateMistakeStatistics(data).reviewAttempted).toBe(4)
    expect(calculateMistakeStatistics(data).mastered).toHaveLength(1)
  })
  it('returns every tied operation and fact deterministically', () => {
    const addition = wrongFact('a', 'addition', 4, 3, '2026-10-18T00:00:00Z')
    const subtraction = wrongFact('b', 'subtraction', 8, 2, '2026-10-18T00:00:00Z')
    const data = trackMistakes({ ...emptySavedData(), mistakeEvents: [subtraction, addition] })
    expect(calculateMistakeStatistics(data).mostMissedOperations.map((op) => op.operation)).toEqual(
      ['addition', 'subtraction'],
    )
    expect(calculateMistakeStatistics(data).mostMissedFacts.map((p) => p.operation)).toEqual([
      'addition',
      'subtraction',
    ])
  })
  it('sorts by wrong count first, then latest date and stable fact keys, without mutation', () => {
    const source = mistakeStatisticsFixture().mistakePatterns!
    const older = {
      ...source[0],
      id: 'older',
      incorrectCount: 1,
      lastIncorrectAt: '2026-10-18T00:00:00Z',
    }
    const newer = { ...older, id: 'newer', lastIncorrectAt: '2026-10-19T00:00:00Z' }
    const frequent = { ...older, id: 'frequent', incorrectCount: 10 }
    const input = Object.freeze([older, newer, frequent])
    expect(sortMistakePatterns(input).map((p) => p.id)).toEqual(['frequent', 'newer', 'older'])
    expect(input.map((p) => p.id)).toEqual(['older', 'newer', 'frequent'])
    const tied = [
      { ...older, id: 'z' },
      { ...older, id: 'a' },
    ]
    expect(sortMistakePatterns(tied).map((p) => p.id)).toEqual(['a', 'z'])
  })
  it('filters stale review evidence by session start rather than attempt date', () => {
    const data = mistakeStatisticsFixture()
    data.historyResetAt = Date.parse('2026-10-19T01:00:00Z')
    data.reviewEvents![0].attempt.attemptedAt = '2026-10-20T00:00:00Z'
    const stats = calculateMistakeStatistics(data)
    expect(stats.reviewAttempted).toBe(0)
    expect(stats.reviewCorrect).toBe(0)
  })
  it('projection never writes or mutates the validated data', () => {
    const data = mistakeStatisticsFixture()
    const before = JSON.stringify(data)
    const first = calculateMistakeStatistics(data)
    expect(calculateMistakeStatistics(data)).toEqual(first)
    expect(JSON.stringify(data)).toBe(before)
  })
})
