import { describe, expect, it } from 'vitest'
import {
  buildMistakePatterns,
  isMistakeEvent,
  isMistakePattern,
  mergeMistakeEvents,
  mistakeKey,
} from './mistakeService'
import { mistakeEvent } from '../test/mistakeFixture'

describe('mistake patterns', () => {
  it('stores the actual marked-wrong fact and initializes progress', () => {
    const event = mistakeEvent()
    expect(event.attempt.selectedAnswer).toBe(event.attempt.correctAnswer)
    expect(buildMistakePatterns([event])).toEqual([
      {
        id: 'mistake:subtraction:2:7:2',
        operation: 'subtraction',
        firstOperand: 7,
        secondOperand: 2,
        correctAnswer: 5,
        difficulty: 2,
        incorrectCount: 1,
        similarCorrectCount: 0,
        lastIncorrectAt: event.attempt.attemptedAt,
        mastered: false,
      },
    ])
    expect(
      buildMistakePatterns([
        { ...event, attempt: { ...event.attempt, selfReportedCorrect: true } },
      ]),
    ).toEqual([])
  })
  it('counts retries and duplicate question callbacks once while allowing distinct sessions', () => {
    const one = mistakeEvent()
    const duplicateQuestion = structuredClone(one)
    duplicateQuestion.attempt.id = 'different-attempt-id'
    expect(buildMistakePatterns([one, one, duplicateQuestion])[0].incorrectCount).toBe(1)
    const otherSession = structuredClone(one)
    otherSession.attempt.sessionId = 'other-session'
    expect(buildMistakePatterns([one, otherSession])[0].incorrectCount).toBe(2)
  })
  it('adds distinct misses, keeps latest date despite out-of-order saves, and resets prior mastery progress', () => {
    const one = mistakeEvent()
    const previous = buildMistakePatterns([one])
    previous[0].similarCorrectCount = 3
    previous[0].mastered = true
    expect(buildMistakePatterns([one], previous)[0]).toMatchObject({
      similarCorrectCount: 3,
      mastered: true,
    })
    const newer = mistakeEvent('miss-2', '2026-10-18T12:03:00Z')
    const older = mistakeEvent('miss-3', '2026-10-18T12:01:00Z')
    expect(buildMistakePatterns([newer, one, older], previous)[0]).toMatchObject({
      incorrectCount: 3,
      lastIncorrectAt: newer.attempt.attemptedAt,
      similarCorrectCount: 0,
      mastered: false,
    })
  })
  it('separates operand order, operation, and difficulty without mutating inputs', () => {
    const one = mistakeEvent()
    one.attempt.operation = 'addition'
    one.attempt.correctAnswer = 9
    const reversed = structuredClone(one)
    reversed.attempt.id = 'reverse'
    reversed.attempt.questionId = 'reverse-q'
    reversed.attempt.firstOperand = 2
    reversed.attempt.secondOperand = 7
    const harder = structuredClone(one)
    harder.attempt.id = 'harder'
    harder.attempt.questionId = 'harder-q'
    harder.attempt.difficulty = 3
    const subtract = mistakeEvent('subtraction')
    const events = [one, reversed, harder, subtract]
    const before = structuredClone(events)
    const result = buildMistakePatterns(events)
    expect(result).toHaveLength(4)
    expect(new Set(result.map(mistakeKey)).size).toBe(4)
    expect(events).toEqual(before)
  })
  it('uses session start for reset protection and supports old valid dates without a cutoff', () => {
    const one = mistakeEvent()
    expect(mergeMistakeEvents([one], Date.parse(one.sessionStartedAt))).toEqual([])
    const old = mistakeEvent('old', '1970-01-01T00:00:00Z')
    old.sessionStartedAt = '1970-01-01T00:00:00Z'
    expect(mergeMistakeEvents([old])).toHaveLength(1)
  })
  it.each([
    { operation: 'unknown' },
    { difficulty: 5 },
    { firstOperand: -1 },
    { correctAnswer: 123 },
    { attemptedAt: 'bad' },
    { selfReportedCorrect: true },
    { selectedAnswer: -1 },
    { source: 'unknown' },
    { sessionId: '' },
  ])('rejects invalid mistake event %j', (patch) => {
    const event = mistakeEvent()
    expect(isMistakeEvent({ ...event, attempt: { ...event.attempt, ...patch } })).toBe(false)
  })
  it.each([
    { incorrectCount: 0 },
    { incorrectCount: 1.5 },
    { similarCorrectCount: -1 },
    { mastered: 'yes' },
    { lastIncorrectAt: 'bad' },
    { correctAnswer: 999 },
    { secondOperand: -1 },
    { id: '' },
  ])('rejects invalid pattern %j', (patch) => {
    const pattern = buildMistakePatterns([mistakeEvent()])[0]
    expect(isMistakePattern({ ...pattern, ...patch })).toBe(false)
  })
  it('accepts valid events/patterns and rejects invalid division and absent data', () => {
    const event = mistakeEvent()
    expect(isMistakeEvent(event)).toBe(true)
    expect(isMistakePattern(buildMistakePatterns([event])[0])).toBe(true)
    expect(
      isMistakeEvent({
        ...event,
        attempt: { ...event.attempt, operation: 'division', secondOperand: 0 },
      }),
    ).toBe(false)
    expect(isMistakeEvent(null)).toBe(false)
    expect(isMistakePattern(null)).toBe(false)
  })
})
