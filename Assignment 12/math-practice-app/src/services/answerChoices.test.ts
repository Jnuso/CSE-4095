import { describe, expect, it } from 'vitest'
import type { DifficultyLevel, MathOperation } from '../types/question'
import {
  distractorCandidates,
  generateAnswerChoices,
  generateIncorrectAnswers,
  isValidAnswerChoices,
} from './answerChoices'
import { generateQuestion } from './questionGenerator'

const operations: MathOperation[] = ['addition', 'subtraction', 'multiplication', 'division']
const levels: DifficultyLevel[] = [1, 2, 3, 4]
const high = 1 - Number.EPSILON

function example(
  operation: MathOperation,
  firstOperand: number,
  secondOperand: number,
  correctAnswer: number,
) {
  return { operation, firstOperand, secondOperand, correctAnswer }
}

describe('operation-specific distractors', () => {
  it('includes addition and subtraction mistakes and nearby values', () => {
    expect(distractorCandidates(example('addition', 28, 17, 45))).toEqual(
      expect.arrayContaining([11, 35, 55, 44, 46]),
    )
    expect(distractorCandidates(example('subtraction', 42, 17, 25))).toEqual(
      expect.arrayContaining([59, 15, 35, 24, 26]),
    )
  })
  it('includes nearby multiplication table facts', () => {
    expect(distractorCandidates(example('multiplication', 8, 7, 56))).toEqual(
      expect.arrayContaining([48, 64, 49, 63]),
    )
  })
  it('includes adjacent division facts and fact-family confusion', () => {
    expect(distractorCandidates(example('division', 56, 7, 8))).toEqual(
      expect.arrayContaining([7, 9, 56]),
    )
  })
  it.each(operations)(
    'has enough unique nonnegative candidates for a zero %s answer',
    (operation) => {
      const question = example(operation, 0, operation === 'division' ? 1 : 0, 0)
      const incorrect = generateIncorrectAnswers(question, () => 0)
      expect(incorrect).toHaveLength(3)
      expect(new Set(incorrect).size).toBe(3)
      expect(incorrect.every((value) => Number.isInteger(value) && value > 0)).toBe(true)
    },
  )
  it('finishes despite a constant random source and bounds random retries', () => {
    let calls = 0
    const choices = generateIncorrectAnswers(example('multiplication', 0, 0, 0), () => {
      calls += 1
      return 0
    })
    expect(calls).toBe(12)
    expect(choices).toEqual([1, 2, 3])
  })
  it('rejects invalid answers and invalid random sources', () => {
    for (const answer of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
      expect(() => generateIncorrectAnswers(example('addition', 0, 0, answer))).toThrow(RangeError)
    }
    expect(() => generateAnswerChoices(example('addition', 1, 1, 2), () => 1)).toThrow(RangeError)
  })
})

describe('complete multiple-choice questions', () => {
  it('keeps choices whole and nonnegative for answers of one', () => {
    for (const question of [
      example('addition', 0, 1, 1),
      example('subtraction', 2, 1, 1),
      example('multiplication', 1, 1, 1),
      example('division', 7, 7, 1),
    ]) {
      expect(
        isValidAnswerChoices(
          generateAnswerChoices(question, () => 0),
          1,
        ),
      ).toBe(true)
    }
  })
  for (const operation of operations) {
    it.each(levels)(`creates four valid ${operation} choices at level %i`, (level) => {
      // Reproducible pseudo-random sequence gives varied inputs without flaky tests.
      let seed = 83
      const random = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0
        return seed / 4294967296
      }
      for (let index = 0; index < 100; index += 1) {
        const question = generateQuestion(operation, level, random)
        expect(isValidAnswerChoices(question.choices, question.correctAnswer)).toBe(true)
        expect(question.choices).toHaveLength(4)
        expect(new Set(question.choices).size).toBe(4)
        expect(question.choices.filter((value) => value === question.correctAnswer)).toHaveLength(1)
        expect(question.choices.every((value) => Number.isInteger(value) && value >= 0)).toBe(true)
      }
    })
  }
  it('can put the correct answer in every position', () => {
    const question = example('addition', 2, 3, 5)
    const positions = new Set<number>()
    for (const swaps of [
      [0, 0, 0],
      [high, 0, 0],
      [high, high, 0],
      [high, high, high],
    ]) {
      let index = 0
      // Three distinct candidate draws, then the three Fisher–Yates swaps.
      const values = [0, 0.2, 0.4, ...swaps]
      const choices = generateAnswerChoices(question, () => values[index++])
      positions.add(choices.indexOf(question.correctAnswer))
    }
    expect([...positions].sort()).toEqual([0, 1, 2, 3])
  })
  it('does not mutate the supplied question', () => {
    const question = Object.freeze(example('division', 0, 1, 0))
    expect(generateAnswerChoices(question, () => 0)).toHaveLength(4)
    expect(question).toEqual(example('division', 0, 1, 0))
  })
  it('rejects missing, duplicate, fractional, negative, and absent-correct choices', () => {
    for (const choices of [
      [1, 2, 3],
      [0, 0, 1, 2],
      [0, 1, 2, 2.5],
      [-1, 0, 1, 2],
      [1, 2, 3, 4],
    ]) {
      expect(isValidAnswerChoices(choices, 0)).toBe(false)
    }
    expect(isValidAnswerChoices([3, 1, 0, 2], 0)).toBe(true)
  })
})
