import { expect, it } from 'vitest'
import { explainQuestion } from './questionExplanation'
import { generateQuestion } from './questionGenerator'
import type { MathOperation } from '../types/question'
it.each([
  ['addition', 15, '12 plus 3 makes 15.'],
  ['subtraction', 9, '12 take away 3 leaves 9.'],
  ['multiplication', 36, '12 groups of 3 make 36.'],
  ['division', 4, '12 shared into 3 equal groups gives 4 in each group.'],
] as const)(
  'explains %s using the actual operands',
  (operation: MathOperation, answer, expected) => {
    const question = generateQuestion([operation], 1)
    expect(
      explainQuestion({ ...question, firstOperand: 12, secondOperand: 3, correctAnswer: answer }),
    ).toBe(expected)
  },
)
