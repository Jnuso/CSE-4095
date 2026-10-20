import type { MistakePattern } from '../types/mistake'
import { activeReviewPatterns, applyReviewResult, nextReviewQuestion } from './mistakeReview'
import type { PracticeConfiguration } from '../types/practice'
import type { PracticeAttempt, PracticeSession } from '../types/session'
import type { Question } from '../types/question'
import type { CardResult } from '../components/practice/QuestionCard'
import { generateQuestion } from './questionGenerator'
import { uniqueId } from '../utils/uniqueId'

export interface SessionState {
  reviewPatterns?: MistakePattern[]
  reviewQuestions?: Question[]
  masteryThreshold?: number
  session: PracticeSession
  attempts: PracticeAttempt[]
  question: Question | null
  previousQuestion: Question | null
  questionIndex: number
  isActive: boolean
  error: string | null
}

type Generator = typeof generateQuestion

function sameMath(a: Question, b: Question): boolean {
  return (
    a.operation === b.operation &&
    a.firstOperand === b.firstOperand &&
    a.secondOperand === b.secondOperand
  )
}

export function nextQuestion(
  configuration: PracticeConfiguration,
  previous: Question | null,
  generator: Generator = generateQuestion,
): Question {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const question = generator(configuration.operations, configuration.difficulty)
    if (!previous || !sameMath(previous, question)) return question
  }
  // Guaranteed distinct endpoint candidates for the supported arithmetic ranges.
  // Still bounded if a replacement generator is faulty or ignores its random source.
  for (const value of [0, 1 - Number.EPSILON]) {
    const question = generator(configuration.operations, configuration.difficulty, () => value)
    if (!previous || !sameMath(previous, question)) return question
  }
  throw new Error('Could not create a different question.')
}

function configuration(state: SessionState): PracticeConfiguration {
  return {
    reviewMode: state.session.reviewMode,
    operations: state.session.operations,
    difficulty: state.session.difficulty,
    sessionLength: state.session.sessionLength,
  }
}

export function retryQuestion(
  state: SessionState,
  generator: Generator = generateQuestion,
): SessionState {
  if (!state.isActive || state.question) return state
  try {
    if (
      state.session.reviewMode === 'mistake-review' &&
      !activeReviewPatterns(state.reviewPatterns ?? []).length
    )
      return endSession(state)
    const question =
      state.session.reviewMode === 'mistake-review'
        ? nextReviewQuestion(
            state.reviewPatterns ?? [],
            state.reviewQuestions ?? [],
            Math.random,
            state.attempts.flatMap((a) => (a.mistakePatternId ? [a.mistakePatternId] : [])),
          )
        : nextQuestion(configuration(state), state.previousQuestion, generator)
    return {
      ...state,
      question,
      error: null,
    }
  } catch {
    return {
      ...state,
      error:
        'We couldn’t create the next question. Your completed answers are still counted. Try again or end the session.',
    }
  }
}

export function startSession(
  config: PracticeConfiguration,
  generator: Generator = generateQuestion,
  reviewPatterns: readonly MistakePattern[] = [],
  masteryThreshold = 3,
): SessionState {
  const initial: SessionState = {
    ...(config.reviewMode === 'mistake-review'
      ? {
          reviewPatterns: activeReviewPatterns(reviewPatterns, config).map((p) => ({ ...p })),
          reviewQuestions: [],
          masteryThreshold,
        }
      : {}),
    session: {
      id: uniqueId(),
      startedAt: new Date().toISOString(),
      ...config,
      operations: [...config.operations],
      attempted: 0,
      correct: 0,
      incorrect: 0,
    },
    attempts: [],
    question: null,
    previousQuestion: null,
    questionIndex: 0,
    isActive: true,
    error: null,
  }
  return retryQuestion(initial, generator)
}

export function endSession(state: SessionState): SessionState {
  if (!state.isActive) return state
  return {
    ...state,
    isActive: false,
    question: null,
    error: null,
    session: { ...state.session, completedAt: new Date().toISOString() },
  }
}

export function recordResult(
  state: SessionState,
  result: CardResult,
  generator: Generator = generateQuestion,
): SessionState {
  const question = state.question
  if (
    !state.isActive ||
    !question ||
    result.questionId !== question.id ||
    typeof result.selfReportedCorrect !== 'boolean' ||
    !question.choices.includes(result.selectedAnswer) ||
    state.attempts.some((attempt) => attempt.questionId === question.id)
  )
    return state
  const attempt: PracticeAttempt = {
    id: uniqueId(),
    questionId: question.id,
    operation: question.operation,
    firstOperand: question.firstOperand,
    secondOperand: question.secondOperand,
    correctAnswer: question.correctAnswer,
    selectedAnswer: result.selectedAnswer,
    selfReportedCorrect: result.selfReportedCorrect,
    difficulty: question.difficulty,
    source: question.source,
    ...(question.mistakePatternId ? { mistakePatternId: question.mistakePatternId } : {}),
    attemptedAt: new Date(
      Math.max(
        Date.now(),
        Date.parse(state.session.startedAt),
        state.attempts.at(-1) ? Date.parse(state.attempts.at(-1)!.attemptedAt) + 1 : 0,
      ),
    ).toISOString(),
    sessionId: state.session.id,
  }
  const updated: SessionState = {
    ...state,
    ...(state.reviewPatterns
      ? {
          reviewPatterns: state.reviewPatterns.map((p) =>
            p.id === question.mistakePatternId
              ? applyReviewResult(
                  p,
                  result.selfReportedCorrect,
                  attempt.attemptedAt,
                  state.masteryThreshold ?? 3,
                )
              : p,
          ),
          reviewQuestions: [...(state.reviewQuestions ?? []).slice(-9), question],
        }
      : {}),
    attempts: [...state.attempts, attempt],
    question: null,
    previousQuestion: question,
    questionIndex: state.questionIndex + 1,
    session: {
      ...state.session,
      attempted: state.session.attempted + 1,
      correct: state.session.correct + Number(result.selfReportedCorrect),
      incorrect: state.session.incorrect + Number(!result.selfReportedCorrect),
    },
  }
  if (
    updated.session.sessionLength !== 'continuous' &&
    updated.session.attempted >= updated.session.sessionLength
  )
    return endSession(updated)
  return retryQuestion(updated, generator)
}
