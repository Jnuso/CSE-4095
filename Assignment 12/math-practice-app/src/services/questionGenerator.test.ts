import { describe, expect, it } from 'vitest'
import type { DifficultyLevel, MathOperation } from '../types/question'
import {
  generateAddition,
  generateDivision,
  generateMultiplication,
  generateQuestion,
  generateSubtraction,
  isValidGeneratedQuestion,
} from './questionGenerator'

const levels: DifficultyLevel[] = [1, 2, 3, 4]
const operations: MathOperation[] = ['addition', 'subtraction', 'multiplication', 'division']
const high = 1 - Number.EPSILON
function sequence(...values: number[]) {
  let index = 0
  return () => values[index++ % values.length]
}

describe('difficulty boundaries', () => {
  it.each(levels)('covers addition endpoints and result limits at level %i', (level) => {
    const limit = [10, 50, 100, 1000][level - 1]
    expect(generateAddition(level, () => 0)).toMatchObject({
      firstOperand: 0,
      secondOperand: 0,
      correctAnswer: 0,
    })
    expect(generateAddition(level, () => high)).toMatchObject({
      firstOperand: limit,
      secondOperand: limit,
      correctAnswer: limit * 2,
    })
  })
  it.each(levels)('orders subtraction operands and permits zero at level %i', (level) => {
    const limit = [10, 50, 100, 1000][level - 1]
    expect(generateSubtraction(level, sequence(0, high))).toMatchObject({
      firstOperand: limit,
      secondOperand: 0,
      correctAnswer: limit,
    })
    expect(generateSubtraction(level, () => high).correctAnswer).toBe(0)
    expect(generateSubtraction(level, () => 0).correctAnswer).toBe(0)
  })
  it.each(levels)('covers multiplication factor endpoints at level %i', (level) => {
    expect(generateMultiplication(level, () => high)).toMatchObject({
      firstOperand: [5, 10, 9, 99][level - 1],
      secondOperand: [5, 10, 99, 99][level - 1],
    })
    expect(generateMultiplication(level, () => 0)).toMatchObject({
      firstOperand: level === 4 ? 10 : 0,
      secondOperand: 0,
      correctAnswer: 0,
    })
  })
  it.each(levels)('covers division boundaries with a nonzero divisor at level %i', (level) => {
    expect(generateDivision(level, () => 0)).toMatchObject({
      firstOperand: 0,
      secondOperand: 1,
      correctAnswer: 0,
    })
    const maximum = generateDivision(level, () => high)
    expect(maximum.secondOperand).toBe([5, 10, 12, 99][level - 1])
    expect(maximum.firstOperand).toBe([25, 100, 144, 9999][level - 1])
    expect(generateDivision(level, sequence(0, high)).correctAnswer).toBe(
      [5, 10, 144, 9999][level - 1],
    )
  })
  it('can generate carrying and borrowing', () => {
    expect(generateAddition(3, sequence(19 / 101, 28 / 101)).correctAnswer).toBe(47)
    expect(generateSubtraction(3, sequence(42 / 101, 17 / 101)).correctAnswer).toBe(25)
  })
})

describe('main generator', () => {
  for (const operation of operations) {
    it.each(levels)(`validates varied ${operation} questions at level %i`, (level) => {
      // Deterministic sample set, including near both endpoints; no flaky random assertions.
      for (let index = 0; index < 100; index += 1) {
        const question = generateQuestion(
          operation,
          level,
          sequence(index / 100, (99 - index) / 100),
        )
        const a = question.firstOperand
        const b = question.secondOperand
        const expected =
          operation === 'addition'
            ? a + b
            : operation === 'subtraction'
              ? a - b
              : operation === 'multiplication'
                ? a * b
                : a / b
        expect(question.correctAnswer).toBe(expected)
        expect(Number.isInteger(expected)).toBe(true)
        expect(isValidGeneratedQuestion(question)).toBe(true)
        expect(question).toMatchObject({
          operation,
          difficulty: level,
          source: 'regular',
          choices: [],
        })
        if (operation === 'division') expect(b).toBeGreaterThan(0)
      }
    })
  }
  it('selects each enabled operation and never selects disabled operations', () => {
    operations.forEach((operation, index) => {
      expect(generateQuestion(operations, 1, sequence(index / 4, 0, 0)).operation).toBe(operation)
    })
    expect(generateQuestion(['subtraction', 'division'], 2, sequence(0, 0, 0)).operation).toBe(
      'subtraction',
    )
    expect(generateQuestion(['subtraction', 'division'], 2, sequence(high, 0, 0)).operation).toBe(
      'division',
    )
  })
  it('rejects unsupported configuration', () => {
    for (const value of [[], ['addition', 'addition'], ['unknown']]) {
      expect(() => generateQuestion(value as MathOperation[], 1)).toThrow(RangeError)
    }
    expect(() => generateQuestion('addition', 0 as DifficultyLevel)).toThrow(RangeError)
    expect(() => generateQuestion('addition', 5 as DifficultyLevel)).toThrow(RangeError)
  })
  it('reports generation failures without retries or a fabricated question', () => {
    expect(() => generateQuestion('addition', 1, () => NaN)).toThrow('Unable to generate')
    expect(() =>
      generateQuestion('division', 1, () => {
        throw new Error('source failed')
      }),
    ).toThrow('Unable to generate')
  })
  it('rejects corrupted arithmetic, ranges, display, source, and draft choices', () => {
    const question = generateQuestion('addition', 1, () => 0)
    for (const change of [
      { correctAnswer: 1 },
      { firstOperand: 11 },
      { secondOperand: -1 },
      { displayText: 'wrong' },
      { id: '' },
      { source: 'mistake-review' as const },
      { choices: [0] },
      { difficulty: 5 as DifficultyLevel },
    ]) {
      expect(isValidGeneratedQuestion({ ...question, ...change })).toBe(false)
    }
    const division = generateDivision(1, () => 0)
    expect(isValidGeneratedQuestion({ ...division, secondOperand: 0 })).toBe(false)
  })
})
