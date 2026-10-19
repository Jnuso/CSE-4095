import { describe, expect, it } from 'vitest'
import { completedFixture } from '../test/summaryFixture'
import { isCompletedSession, summaryFromState, summarize } from './sessionSummary'

describe('completed session summaries', () => {
  it('calculates rounded self-reported accuracy, actual practiced operations, and review count', () => {
    const completed = completedFixture()
    expect(isCompletedSession(completed)).toBe(true)
    expect(summarize(completed)).toEqual({
      attempted: 3,
      correct: 2,
      incorrect: 1,
      accuracy: 67,
      operations: ['addition', 'subtraction', 'multiplication'],
      reviewCount: 1,
    })
    expect(summaryFromState({ completedSession: completed })).toBe(completed)
  })
  it('handles zero attempts and both accuracy extremes', () => {
    const empty = completedFixture()
    empty.attempts = []
    Object.assign(empty.session, { attempted: 0, correct: 0, incorrect: 0 })
    expect(isCompletedSession(empty)).toBe(true)
    expect(summarize(empty)).toMatchObject({ accuracy: 0, operations: [], reviewCount: 0 })
    for (const correct of [true, false]) {
      const completed = completedFixture()
      completed.attempts.forEach((attempt) => {
        attempt.selfReportedCorrect = correct
      })
      Object.assign(completed.session, { correct: correct ? 3 : 0, incorrect: correct ? 0 : 3 })
      expect(isCompletedSession(completed)).toBe(true)
      expect(summarize(completed).accuracy).toBe(correct ? 100 : 0)
    }
  })
  it('rejects incomplete or inconsistent session records', () => {
    for (const change of [
      { completedAt: undefined },
      { completedAt: 'invalid' },
      { completedAt: '2000-01-01' },
      { id: '' },
      { attempted: -1 },
      { attempted: 2 },
      { correct: 3 },
      { operations: [] },
      { difficulty: 99 },
    ]) {
      const completed = completedFixture()
      expect(
        isCompletedSession({ ...completed, session: { ...completed.session, ...change } }),
      ).toBe(false)
    }
  })
  it('rejects corrupt attempts and mismatched IDs, arithmetic, and totals', () => {
    for (const change of [
      { sessionId: 'other' },
      { id: '' },
      { questionId: '' },
      { operation: 'unknown' },
      { difficulty: 1 },
      { selectedAnswer: NaN },
      { correctAnswer: 99 },
      { source: 'unknown' },
      { attemptedAt: 'bad' },
      { selfReportedCorrect: false },
    ]) {
      const completed = completedFixture()
      Object.assign(completed.attempts[0], change)
      expect(isCompletedSession(completed)).toBe(false)
    }
    const duplicate = completedFixture()
    duplicate.attempts[1] = { ...duplicate.attempts[0] }
    expect(isCompletedSession(duplicate)).toBe(false)
  })
  it.each([
    undefined,
    null,
    {},
    { completedSession: {} },
    { completedSession: { session: {}, attempts: [] } },
  ])('returns no summary for unsupported navigation data %j', (state) => {
    expect(summaryFromState(state)).toBeNull()
  })
})
