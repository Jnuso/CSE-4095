import { describe, expect, it, vi } from 'vitest'
import type { PracticeConfiguration } from '../types/practice'
import {
  endSession,
  nextQuestion,
  recordResult,
  retryQuestion,
  startSession,
} from './practiceSession'
import { generateQuestion } from './questionGenerator'

const config: PracticeConfiguration = { operations: ['addition'], difficulty: 1, sessionLength: 5 }

describe('practice session transitions', () => {
  it('creates an active session with configuration, ID, timestamp, and first question', () => {
    const state = startSession(config)
    expect(state).toMatchObject({ isActive: true, questionIndex: 0, attempts: [], error: null })
    expect(state.session).toMatchObject({ ...config, attempted: 0, correct: 0, incorrect: 0 })
    expect(state.session.id).toBeTruthy()
    expect(Number.isNaN(Date.parse(state.session.startedAt))).toBe(false)
    expect(state.question?.operation).toBe('addition')
    expect(state.session.operations).not.toBe(config.operations)
  })
  it('stores a full attempt and counts self-report independently from the selected solution', () => {
    const initial = startSession(config)
    const question = initial.question!
    const selectedAnswer = question.choices.find((value) => value !== question.correctAnswer)!
    const updated = recordResult(initial, {
      questionId: question.id,
      selectedAnswer,
      selfReportedCorrect: true,
    })
    expect(updated.session).toMatchObject({ attempted: 1, correct: 1, incorrect: 0 })
    expect(updated.attempts[0]).toMatchObject({
      questionId: question.id,
      sessionId: initial.session.id,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      selfReportedCorrect: true,
      operation: question.operation,
      firstOperand: question.firstOperand,
      secondOperand: question.secondOperand,
      difficulty: 1,
      source: 'regular',
    })
    expect(updated.attempts[0].id).toBeTruthy()
    expect(Number.isNaN(Date.parse(updated.attempts[0].attemptedAt))).toBe(false)
    expect(updated.questionIndex).toBe(1)
    expect(updated.question?.id).not.toBe(question.id)
    expect(updated.question?.displayText).not.toBe(question.displayText)
    expect(initial.session.attempted).toBe(0)
  })
  it('ignores duplicate/stale reports and invalid selected answers', () => {
    const state = startSession(config)
    const result = {
      questionId: state.question!.id,
      selectedAnswer: state.question!.choices[0],
      selfReportedCorrect: false,
    }
    expect(recordResult(state, { ...result, selectedAnswer: -1 })).toBe(state)
    expect(recordResult(state, { ...result, questionId: 'stale' })).toBe(state)
    const next = recordResult(state, result)
    expect(next.session).toMatchObject({ attempted: 1, correct: 0, incorrect: 1 })
    expect(recordResult(next, result)).toBe(next)
  })
  it.each([5, 10, 20] as const)(
    'stops at exactly %i attempts without generating an extra question',
    (length) => {
      let state = startSession({ ...config, sessionLength: length })
      for (let index = 0; index < length; index += 1) {
        const generator = vi.fn(generateQuestion)
        const question = state.question!
        state = recordResult(
          state,
          {
            questionId: question.id,
            selectedAnswer: question.choices[0],
            selfReportedCorrect: index % 2 === 0,
          },
          generator,
        )
        if (index === length - 1) expect(generator).not.toHaveBeenCalled()
      }
      expect(state.isActive).toBe(false)
      expect(state.question).toBeNull()
      expect(state.session.attempted).toBe(length)
      expect(state.attempts).toHaveLength(length)
      expect(state.session.correct + state.session.incorrect).toBe(length)
      expect(state.session.completedAt).toBeTruthy()
      expect(endSession(state)).toBe(state)
    },
  )
  it('continues beyond 20 questions until explicitly ended', () => {
    let state = startSession({ ...config, sessionLength: 'continuous' })
    for (let index = 0; index < 23; index += 1) {
      state = recordResult(state, {
        questionId: state.question!.id,
        selectedAnswer: state.question!.choices[0],
        selfReportedCorrect: false,
      })
    }
    expect(state.isActive).toBe(true)
    expect(state.questionIndex).toBe(23)
    const finished = endSession(state)
    expect(finished).toMatchObject({ isActive: false, question: null })
    expect(finished.session).toMatchObject({ attempted: 23, correct: 0, incorrect: 23 })
    expect(finished.attempts).toHaveLength(23)
  })
  it('bounds repeat avoidance and uses distinct endpoint fallback', () => {
    const repeated = generateQuestion('addition', 1, () => 0)
    const generator = vi.fn((...args: Parameters<typeof generateQuestion>) =>
      args[2] ? generateQuestion(...args) : repeated,
    )
    const question = nextQuestion(config, repeated, generator)
    expect(question.displayText).not.toBe(repeated.displayText)
    expect(generator).toHaveBeenCalledTimes(10)
    const faulty = vi.fn(() => repeated)
    expect(nextQuestion(config, repeated, faulty).displayText).not.toBe(repeated.displayText)
    expect(faulty).toHaveBeenCalledTimes(10)
  })
  it('uses fallback after generation fails without losing or recounting an answer', () => {
    const fail = () => {
      throw new Error('generation failed')
    }
    const initialFailure = startSession(config, fail)
    expect(initialFailure.question?.choices).toHaveLength(4)
    expect(initialFailure.error).toBeNull()
    const initial = retryQuestion(initialFailure)
    const next = recordResult(
      initial,
      {
        questionId: initial.question!.id,
        selectedAnswer: initial.question!.choices[0],
        selfReportedCorrect: true,
      },
      fail,
    )
    expect(next.session.attempted).toBe(1)
    expect(next.question?.choices).toHaveLength(4)
    expect(next.error).toBeNull()
    const recovered = retryQuestion(next)
    expect(recovered.question).not.toBeNull()
    expect(recovered.session.attempted).toBe(1)
    expect(recovered.error).toBeNull()
  })
  it('allows an empty ending recap without counting an unanswered card', () => {
    const finished = endSession(startSession(config))
    expect(finished.session.attempted).toBe(0)
    expect(finished.attempts).toEqual([])
    expect(retryQuestion(finished)).toBe(finished)
  })
})
