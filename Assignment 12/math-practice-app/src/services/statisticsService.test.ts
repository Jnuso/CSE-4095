import { describe, expect, it } from 'vitest'
import { calculateStatistics, accuracy } from './statisticsService'
import { completedFixture } from '../test/summaryFixture'

describe('statistics calculations', () => {
  it('handles no attempts and rounds half percentages upward', () => {
    expect(accuracy(0, 0)).toBe(0)
    expect(accuracy(8, 1)).toBe(13)
    expect(accuracy(3, 2)).toBe(67)
    expect(calculateStatistics([])).toMatchObject({ attempted: 0, correct: 0, incorrect: 0 })
  })
  it('uses reported outcomes, actual operations, and includes incomplete snapshots only once', () => {
    const complete = completedFixture()
    const incomplete = structuredClone(complete)
    delete incomplete.session.completedAt
    incomplete.attempts = incomplete.attempts.slice(0, 1)
    Object.assign(incomplete.session, { attempted: 1, correct: 1, incorrect: 0 })
    const result = calculateStatistics([incomplete, complete])
    expect(result).toMatchObject({ attempted: 3, correct: 2, incorrect: 1 })
    expect(result.byOperation.addition).toEqual({ attempted: 1, correct: 1, incorrect: 0 })
    expect(result.byOperation.subtraction).toEqual({ attempted: 1, correct: 0, incorrect: 1 })
    expect(result.byOperation.division.attempted).toBe(0)
    expect(result.byDifficulty[2].attempted).toBe(3)
    expect(calculateStatistics([incomplete]).attempted).toBe(1)
    expect(incomplete.attempts).toHaveLength(1)
  })
  it('groups all four operations and difficulty levels independently', () => {
    const records = ([1, 2, 3, 4] as const).map((level) => {
      const record = completedFixture()
      record.session.id = `session-${level}`
      record.session.difficulty = level
      record.attempts.forEach((attempt) => {
        attempt.sessionId = record.session.id
        attempt.difficulty = level
      })
      record.attempts[2] = {
        ...record.attempts[2],
        operation: 'division',
        firstOperand: 6,
        secondOperand: 2,
        correctAnswer: 3,
        selectedAnswer: 3,
      }
      return record
    })
    const result = calculateStatistics(records)
    expect(result.attempted).toBe(12)
    for (const level of [1, 2, 3, 4] as const)
      expect(result.byDifficulty[level]).toEqual({ attempted: 3, correct: 2, incorrect: 1 })
    expect(result.byOperation.division).toEqual({ attempted: 4, correct: 4, incorrect: 0 })
  })
})
