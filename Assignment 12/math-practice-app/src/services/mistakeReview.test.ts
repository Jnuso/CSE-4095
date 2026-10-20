import { describe, expect, it } from 'vitest'
import { completedFixture } from '../test/summaryFixture'
import type { MistakePattern } from '../types/mistake'
import type { MistakeEvent } from './mistakeService'
import { mistakeKey, isReviewEvent } from './mistakeService'
import {
  activeReviewPatterns,
  reviewPriority,
  selectReviewPattern,
  buildReviewedPatterns,
} from './mistakeReview'
import {
  emptySavedData,
  trackMistakes,
  readSavedData,
  writeSavedData,
  MAX_SAVED_SESSIONS,
  isStoredSession,
} from './storageService'
import { startSession, recordResult } from './practiceSession'
import { summarize } from './sessionSummary'

const miss: MistakeEvent = {
  sessionStartedAt: '2026-10-18T12:00:00Z',
  attempt: { ...completedFixture().attempts[1], source: 'regular' },
}
const original = trackMistakes({ ...emptySavedData(), mistakeEvents: [miss] }).mistakePatterns![0]
function review(index: number, correct = true): MistakeEvent {
  return {
    sessionStartedAt: '2026-10-19T00:00:00Z',
    attempt: {
      ...miss.attempt,
      id: `review-${index}`,
      questionId: `rq-${index}`,
      sessionId: 'review-session',
      operation: 'addition',
      firstOperand: 2,
      secondOperand: 5,
      correctAnswer: 7,
      selectedAnswer: 7,
      source: 'mistake-review',
      mistakePatternId: original.id,
      selfReportedCorrect: correct,
      attemptedAt: new Date(Date.parse('2026-10-19T00:00:00Z') + index * 1000).toISOString(),
    },
  }
}
function tracked(reviews: MistakeEvent[], extras: MistakeEvent[] = []) {
  return trackMistakes({
    ...emptySavedData(),
    mistakeEvents: [miss, ...extras],
    reviewEvents: reviews,
  })
}
const config = {
  operations: ['subtraction'] as ['subtraction'],
  difficulty: 2 as const,
  sessionLength: 5 as const,
  reviewMode: 'mistake-review' as const,
}

describe('review priority and eligibility', () => {
  it('filters mastered, invalid, other operations and difficulty', () => {
    expect(
      activeReviewPatterns(
        [
          original,
          { ...original, mastered: true },
          { ...original, difficulty: 1 },
          { ...original, operation: 'addition' },
        ],
        config,
      ),
    ).toEqual([original])
  })
  it('raises priority for frequency and recency and reduces it after success', () => {
    const now = Date.parse('2026-10-20T00:00:00Z')
    expect(reviewPriority({ ...original, incorrectCount: 5 }, now)).toBeGreaterThan(
      reviewPriority(original, now),
    )
    expect(
      reviewPriority({ ...original, lastIncorrectAt: '2026-10-19T23:00:00Z' }, now),
    ).toBeGreaterThan(reviewPriority(original, now))
    expect(reviewPriority({ ...original, similarCorrectCount: 1 }, now)).toBeLessThan(
      reviewPriority(original, now),
    )
  })
  it('randomizes similar priority and mixes different patterns before repeating', () => {
    const other = { ...original, id: 'other', incorrectCount: 20 }
    expect(selectReviewPattern([original, other], [], () => 0).id).toBe(other.id)
    expect(selectReviewPattern([original, other], [other.id], () => 0).id).toBe(original.id)
    const tied = { ...original, id: 'tied' }
    expect(selectReviewPattern([original, tied], [], () => 0).id).toBe(original.id)
    expect(selectReviewPattern([original, tied], [], () => 0.99).id).toBe(tied.id)
    expect(() => selectReviewPattern([{ ...original, mastered: true }])).toThrow(/No active/)
  })
})

describe('durable original-pattern progress', () => {
  it('masters after three correct self-reports, resets on wrong, and does not create a generated-fact pattern', () => {
    expect(tracked([review(1), review(2)]).mistakePatterns![0]).toMatchObject({
      similarCorrectCount: 2,
      mastered: false,
    })
    expect(tracked([review(1), review(2), review(3)]).mistakePatterns![0]).toMatchObject({
      similarCorrectCount: 3,
      mastered: true,
    })
    const data = tracked([review(1), review(2), review(3, false), review(4)])
    expect(data.mistakePatterns).toHaveLength(1)
    expect(data.mistakePatterns![0]).toMatchObject({
      id: original.id,
      firstOperand: 7,
      secondOperand: 2,
      similarCorrectCount: 1,
      mastered: false,
      incorrectCount: 2,
      lastIncorrectAt: review(3).attempt.attemptedAt,
    })
    expect(data.reviewEvents).toHaveLength(4)
    expect(data.mistakeEvents).toHaveLength(1)
  })
  it('replays threshold changes without relying on stale cached mastery', () => {
    const data = tracked([review(1), review(2), review(3)])
    expect(
      trackMistakes({ ...data, settings: { ...data.settings, masteryThreshold: 4 } })
        .mistakePatterns![0].mastered,
    ).toBe(false)
    expect(
      trackMistakes({ ...data, settings: { ...data.settings, masteryThreshold: 2 } })
        .mistakePatterns![0].mastered,
    ).toBe(true)
  })
  it('a later regular miss reopens mastery and resets consecutive progress', () => {
    const again = {
      ...miss,
      attempt: {
        ...miss.attempt,
        id: 'new-miss',
        questionId: 'new-q',
        attemptedAt: '2026-10-20T00:00:00Z',
      },
    }
    expect(tracked([review(1), review(2), review(3)], [again]).mistakePatterns![0]).toMatchObject({
      mastered: false,
      similarCorrectCount: 0,
      incorrectCount: 2,
      lastIncorrectAt: again.attempt.attemptedAt,
    })
  })
  it('deduplicates both report and question identities and sorts out-of-order events', () => {
    const duplicate = review(2)
    const changedId = {
      ...duplicate,
      attempt: { ...duplicate.attempt, id: 'different-report-same-question' },
    }
    const data = tracked([review(3), duplicate, review(1), duplicate, changedId])
    expect(data.reviewEvents).toHaveLength(3)
    expect(data.mistakePatterns![0]).toMatchObject({ similarCorrectCount: 3, mastered: true })
    expect(trackMistakes(data).mistakePatterns).toEqual(data.mistakePatterns)
  })
  it('handles equal timestamps conservatively: another miss wins over successes', () => {
    const at = review(3).attempt.attemptedAt
    const again = {
      ...miss,
      attempt: { ...miss.attempt, id: 'again', questionId: 'again-q', attemptedAt: at },
    }
    expect(tracked([review(1), review(2), review(3)], [again]).mistakePatterns![0]).toMatchObject({
      mastered: false,
      similarCorrectCount: 0,
    })
  })
  it('ignores orphan review targets and regular right reports; retains legacy non-targeted misses', () => {
    expect(
      tracked([{ ...review(1), attempt: { ...review(1).attempt, mistakePatternId: 'unknown' } }])
        .mistakePatterns![0].similarCorrectCount,
    ).toBe(0)
    const data = trackMistakes({ ...emptySavedData(), records: [completedFixture()] })
    expect(data.mistakePatterns![0].id).toBe(mistakeKey(completedFixture().attempts[1]))
    expect(isReviewEvent(review(1))).toBe(true)
    expect(
      isReviewEvent({ ...review(1), attempt: { ...review(1).attempt, mistakePatternId: '' } }),
    ).toBe(false)
  })
  it('does not trust cached mastery when a present review journal has no evidence', () => {
    const data = tracked([review(1), review(2), review(3)])
    expect(trackMistakes({ ...data, reviewEvents: [] }).mistakePatterns![0]).toMatchObject({
      mastered: false,
      similarCorrectCount: 0,
    })
  })
  it('validates targeted inverse attempts and rejects unsupported operations or missing targets', () => {
    let state = startSession(config, undefined, [original], 1)
    const q = state.question!
    state = recordResult(state, {
      questionId: q.id,
      selectedAnswer: q.choices[0],
      selfReportedCorrect: true,
    })
    const inverse = {
      ...state.attempts[0],
      operation: 'addition' as const,
      firstOperand: 2,
      secondOperand: 5,
      correctAnswer: 7,
    }
    expect(isStoredSession({ session: state.session, attempts: [inverse] })).toBe(true)
    expect(summarize({ session: state.session, attempts: [inverse] }).operations).toEqual([
      'addition',
    ])
    expect(
      isStoredSession({
        session: state.session,
        attempts: [{ ...inverse, mistakePatternId: undefined }],
      }),
    ).toBe(false)
    expect(
      isStoredSession({
        session: state.session,
        attempts: [{ ...inverse, operation: 'unsupported' }],
      }),
    ).toBe(false)
  })
  it('reset cutoffs reject stale reviews by session start, even with a later attempt timestamp', () => {
    const data = tracked([review(1)])
    const cutoff = Date.parse('2026-10-19T12:00:00Z')
    const reset = trackMistakes({ ...data, historyResetAt: cutoff })
    expect(reset.reviewEvents).toEqual([])
    expect(reset.mistakeEvents).toEqual([])
    expect(reset.mistakePatterns).toEqual([])
  })
  it('survives real serialization/reload, corrupt cache, record trimming and invalid review recovery', () => {
    let raw: string | null = null
    const access = () => ({
      getItem: () => raw,
      setItem: (_: string, value: string) => {
        raw = value
      },
    })
    const data = tracked([review(1), review(2), review(3)])
    expect(writeSavedData(data, access)).toBeNull()
    expect(readSavedData(access).data.mistakePatterns![0].mastered).toBe(true)
    const parsed = JSON.parse(raw!)
    parsed.mistakePatterns = []
    parsed.reviewEvents.push({ bad: true })
    raw = JSON.stringify(parsed)
    const loaded = readSavedData(access)
    expect(loaded.data.mistakePatterns![0].mastered).toBe(true)
    expect(loaded.warnings.join(' ')).toMatch(/review progress/)
    const records = Array.from({ length: MAX_SAVED_SESSIONS + 1 }, (_, index) => {
      const record = completedFixture()
      record.session.id = `retained-${index}`
      record.session.startedAt = new Date(
        Date.parse('2026-10-20T00:00:00Z') + index * 1000,
      ).toISOString()
      record.session.completedAt = record.session.startedAt
      record.session.attempted = 0
      record.session.correct = 0
      record.session.incorrect = 0
      record.attempts = []
      return record
    })
    const trimmed = trackMistakes({ ...loaded.data, records })
    expect(trimmed.records).toHaveLength(100)
    expect(trimmed.mistakePatterns![0].mastered).toBe(true)
    expect(trimmed.reviewEvents).toHaveLength(3)
  })
})

describe('review session transitions', () => {
  it('uses review source and target identity, validates inverse-operation attempts, ends when mastered', () => {
    let state = startSession(config, undefined, [original], 3)
    for (let index = 0; index < 3; index++) {
      expect(state.question).toMatchObject({
        source: 'mistake-review',
        mistakePatternId: original.id,
        difficulty: 2,
      })
      const question = state.question!
      const old = state
      state = recordResult(state, {
        questionId: question.id,
        selectedAnswer: question.choices[0],
        selfReportedCorrect: true,
      })
      expect(
        recordResult(state, {
          questionId: question.id,
          selectedAnswer: question.choices[0],
          selfReportedCorrect: true,
        }),
      ).toBe(state)
      expect(old.attempts).toHaveLength(index)
    }
    expect(state.isActive).toBe(false)
    expect(state.session.attempted).toBe(3)
    expect(state.reviewPatterns![0].mastered).toBe(true)
    expect(isStoredSession(state)).toBe(true)
    expect(summarize(state).reviewCount).toBe(3)
  })
  it('ends empty review safely and mixes selected patterns without other levels', () => {
    expect(startSession(config).isActive).toBe(false)
    const other: MistakePattern = { ...original, id: 'other', firstOperand: 8, correctAnswer: 6 }
    let state = startSession(config, undefined, [
      original,
      other,
      { ...original, id: 'wrong-level', difficulty: 1 },
    ])
    const targets = []
    for (let index = 0; index < 2; index++) {
      const question = state.question!
      targets.push(question.mistakePatternId)
      state = recordResult(state, {
        questionId: question.id,
        selectedAnswer: question.choices[0],
        selfReportedCorrect: false,
      })
    }
    expect(new Set(targets)).toEqual(new Set([original.id, other.id]))
    expect(state.reviewPatterns!.every((p) => p.similarCorrectCount === 0)).toBe(true)
  })
  it('configurable threshold changes local end behavior and no input is mutated', () => {
    const before = JSON.stringify(original)
    const state = startSession(config, undefined, [original], 1)
    const q = state.question!
    const done = recordResult(state, {
      questionId: q.id,
      selectedAnswer: q.choices[0],
      selfReportedCorrect: true,
    })
    expect(done.isActive).toBe(false)
    expect(JSON.stringify(original)).toBe(before)
    expect(buildReviewedPatterns([miss], [], [original], 3)).toEqual([original])
  })
})
