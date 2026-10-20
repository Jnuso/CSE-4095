import { isValidGeneratedQuestion } from './questionGenerator'
import { reportDevelopmentError } from './reportDevelopmentError'
import type { MistakePattern } from '../types/mistake'
import type { PracticeConfiguration } from '../types/practice'
import type { Question } from '../types/question'
import { randomInteger, type RandomSource } from '../utils/random'
import { buildMistakePatterns, mistakeKey, type MistakeEvent } from './mistakeService'
import { generateSimilarQuestion, getSimilarQuestionCandidates } from './similarQuestionGenerator'

export function activeReviewPatterns(
  patterns: readonly MistakePattern[],
  config?: PracticeConfiguration,
): MistakePattern[] {
  return patterns.filter((pattern) => {
    if (
      pattern.mastered ||
      (config &&
        (pattern.difficulty !== config.difficulty ||
          !config.operations.includes(pattern.operation)))
    )
      return false
    try {
      return getSimilarQuestionCandidates(pattern).length > 0
    } catch {
      return false
    }
  })
}
// Broad recency bands and rounded scores permit random ties without clock-sensitive ordering.
export function reviewPriority(pattern: MistakePattern, now = Date.now()): number {
  const ageDays = Math.max(0, (now - Date.parse(pattern.lastIncorrectAt)) / 86400000)
  const recency = ageDays < 1 ? 3 : ageDays < 7 ? 2 : ageDays < 30 ? 1 : 0
  return pattern.incorrectCount * 2 + recency - pattern.similarCorrectCount * 2
}
export function selectReviewPattern(
  patterns: readonly MistakePattern[],
  recentPatternIds: readonly string[] = [],
  random: RandomSource = Math.random,
  now = Date.now(),
): MistakePattern {
  const active = activeReviewPatterns(patterns)
  if (!active.length) throw new Error('No active mistakes are available for review.')
  // Complete a round through every active pattern before repeating; priority orders each round.
  const lastRound = active.length > 1 ? recentPatternIds.slice(-(active.length - 1)) : []
  let available = active.filter((p) => !lastRound.includes(p.id))
  if (!available.length || active.length === 1) available = active
  const best = Math.max(...available.map((p) => reviewPriority(p, now)))
  const tied = available.filter((p) => reviewPriority(p, now) >= best - 1)
  return tied[randomInteger(0, tied.length - 1, random)]
}
export function nextReviewQuestion(
  patterns: readonly MistakePattern[],
  recent: readonly Question[],
  random: RandomSource = Math.random,
  recentPatternIds?: readonly string[],
): Question {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const source = attempt === 3 ? () => 0 : random
      const pattern = selectReviewPattern(
        patterns,
        recentPatternIds ?? recent.flatMap((q) => (q.mistakePatternId ? [q.mistakePatternId] : [])),
        source,
      )
      const question = generateSimilarQuestion(pattern, { recentQuestions: recent, random: source })
      if (
        question.source === 'mistake-review' &&
        question.mistakePatternId === pattern.id &&
        question.difficulty === pattern.difficulty &&
        question.choices.length === 4 &&
        isValidGeneratedQuestion({ ...question, source: 'regular' })
      )
        return question
    } catch {
      /* Retry within the bound, then use deterministic input. */
    }
    reportDevelopmentError('review-generation-retry', attempt + 1)
  }
  throw new Error('Related questions are unavailable.')
}
export function applyReviewResult(
  pattern: MistakePattern,
  correct: boolean,
  at: string,
  threshold: number,
): MistakePattern {
  const similarCorrectCount = correct ? pattern.similarCorrectCount + 1 : 0
  return {
    ...pattern,
    similarCorrectCount,
    mastered: correct && similarCorrectCount >= threshold,
    incorrectCount: pattern.incorrectCount + Number(!correct),
    lastIncorrectAt:
      correct || Date.parse(at) < Date.parse(pattern.lastIncorrectAt)
        ? pattern.lastIncorrectAt
        : at,
  }
}

/** Replay evidence, not cached totals: retries, tab merges and record trimming cannot add success twice. */
export function buildReviewedPatterns(
  events: readonly MistakeEvent[],
  reviews: readonly MistakeEvent[],
  previous: readonly MistakePattern[],
  threshold: number,
): MistakePattern[] {
  return buildMistakePatterns(events, previous).map((base) => {
    const targeted = reviews.filter(
      (e) => e.attempt.mistakePatternId === base.id && e.attempt.difficulty === base.difficulty,
    )
    if (!targeted.length) return base
    const regular = events.filter((e) => mistakeKey(e.attempt) === base.id)
    const origin = [...regular].sort(
      (a, b) =>
        Date.parse(a.attempt.attemptedAt) - Date.parse(b.attempt.attemptedAt) ||
        a.attempt.id.localeCompare(b.attempt.id),
    )[0]
    if (!origin) return base
    const timeline = [
      ...regular.filter((e) => e !== origin).map((e) => ({ ...e, review: false })),
      ...targeted
        .filter((e) => Date.parse(e.attempt.attemptedAt) >= Date.parse(origin.attempt.attemptedAt))
        .map((e) => ({ ...e, review: true })),
    ]
      // The originating miss is first. On remaining timestamp ties, misses win over successes.
      .sort(
        (a, b) =>
          Date.parse(a.attempt.attemptedAt) - Date.parse(b.attempt.attemptedAt) ||
          Number(b.attempt.selfReportedCorrect) - Number(a.attempt.selfReportedCorrect) ||
          a.attempt.id.localeCompare(b.attempt.id),
      )
    let pattern = { ...base, incorrectCount: 1, similarCorrectCount: 0, mastered: false }
    for (const event of timeline) {
      pattern = applyReviewResult(
        pattern,
        event.review && event.attempt.selfReportedCorrect,
        event.attempt.attemptedAt,
        threshold,
      )
    }
    return pattern
  })
}
