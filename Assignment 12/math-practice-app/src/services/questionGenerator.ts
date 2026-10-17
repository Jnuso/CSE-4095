import type { DifficultyLevel, MathOperation, Question } from '../types/question'
import { randomInteger, type RandomSource } from '../utils/random'
import { uniqueId } from '../utils/uniqueId'

const operations: MathOperation[] = ['addition', 'subtraction', 'multiplication', 'division']
const symbols = { addition: '+', subtraction: '−', multiplication: '×', division: '÷' }
const operandLimits = [10, 50, 100, 1000] as const
const divisorLimits = [5, 10, 12, 99] as const

function checkDifficulty(difficulty: DifficultyLevel): void {
  if (![1, 2, 3, 4].includes(difficulty)) throw new RangeError('Unsupported difficulty level.')
}

function answer(operation: MathOperation, first: number, second: number): number {
  switch (operation) {
    case 'addition':
      return first + second
    case 'subtraction':
      return first - second
    case 'multiplication':
      return first * second
    case 'division':
      return first / second
  }
}

// Phase 4 questions carry an empty choices array; Phase 5 will populate four choices.
function createQuestion(
  operation: MathOperation,
  difficulty: DifficultyLevel,
  firstOperand: number,
  secondOperand: number,
): Question {
  const question: Question = {
    id: uniqueId(),
    operation,
    difficulty,
    firstOperand,
    secondOperand,
    displayText: `${firstOperand} ${symbols[operation]} ${secondOperand} = ?`,
    correctAnswer: answer(operation, firstOperand, secondOperand),
    choices: [],
    source: 'regular',
  }
  if (!isValidGeneratedQuestion(question)) throw new Error('Generated question failed validation.')
  return question
}

export function generateAddition(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  checkDifficulty(difficulty)
  const limit = operandLimits[difficulty - 1]
  return createQuestion(
    'addition',
    difficulty,
    randomInteger(0, limit, random),
    randomInteger(0, limit, random),
  )
}

export function generateSubtraction(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  checkDifficulty(difficulty)
  const limit = operandLimits[difficulty - 1]
  const operands = [randomInteger(0, limit, random), randomInteger(0, limit, random)].sort(
    (a, b) => b - a,
  )
  return createQuestion('subtraction', difficulty, operands[0], operands[1])
}

export function generateMultiplication(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  checkDifficulty(difficulty)
  const first =
    difficulty === 4
      ? randomInteger(10, 99, random)
      : randomInteger(0, [5, 10, 9][difficulty - 1], random)
  const second =
    difficulty <= 2
      ? randomInteger(0, difficulty === 1 ? 5 : 10, random)
      : randomInteger(0, 99, random)
  return createQuestion('multiplication', difficulty, first, second)
}

export function generateDivision(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  checkDifficulty(difficulty)
  const divisor = randomInteger(1, divisorLimits[difficulty - 1], random)
  // Explicit product decisions where the specification leaves quotient/dividend limits open.
  const quotientLimit =
    difficulty === 3
      ? Math.floor(144 / divisor)
      : difficulty === 4
        ? Math.floor(9999 / divisor)
        : difficulty === 1
          ? 5
          : 10
  const quotient = randomInteger(0, quotientLimit, random)
  return createQuestion('division', difficulty, divisor * quotient, divisor)
}

export function isValidGeneratedQuestion(question: Question): boolean {
  const { operation, difficulty, firstOperand: a, secondOperand: b, correctAnswer } = question
  if (!operations.includes(operation) || ![1, 2, 3, 4].includes(difficulty)) return false
  if (![a, b, correctAnswer].every((value) => Number.isSafeInteger(value) && value >= 0))
    return false
  if (!question.id || question.source !== 'regular' || question.choices.length !== 0) return false
  if (
    question.displayText !== `${a} ${symbols[operation]} ${b} = ?` ||
    correctAnswer !== answer(operation, a, b)
  )
    return false
  const limit = operandLimits[difficulty - 1]
  switch (operation) {
    case 'addition':
      return a <= limit && b <= limit && correctAnswer <= limit * 2
    case 'subtraction':
      return a <= limit && b <= limit && a >= b
    case 'multiplication':
      return difficulty <= 2
        ? a <= (difficulty === 1 ? 5 : 10) && b <= (difficulty === 1 ? 5 : 10)
        : difficulty === 3
          ? a <= 9 && b <= 99
          : a >= 10 && a <= 99 && b <= 99
    case 'division':
      return (
        b >= 1 &&
        b <= divisorLimits[difficulty - 1] &&
        (difficulty === 3
          ? a <= 144
          : difficulty === 4
            ? a <= 9999
            : correctAnswer <= (difficulty === 1 ? 5 : 10))
      )
  }
}

export function generateQuestion(
  enabled: MathOperation | readonly MathOperation[],
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  checkDifficulty(difficulty)
  const selected = typeof enabled === 'string' ? [enabled] : enabled
  if (
    !Array.isArray(selected) ||
    selected.length === 0 ||
    new Set(selected).size !== selected.length ||
    !selected.every((operation) => operations.includes(operation))
  ) {
    throw new RangeError('Choose one or more distinct supported operations.')
  }
  const generators = {
    addition: generateAddition,
    subtraction: generateSubtraction,
    multiplication: generateMultiplication,
    division: generateDivision,
  }
  try {
    const operation: MathOperation =
      selected.length === 1 ? selected[0] : selected[randomInteger(0, selected.length - 1, random)]
    return generators[operation](difficulty, random)
  } catch (cause) {
    throw new Error('Unable to generate a math question.', { cause })
  }
}
