import type { Question } from '../types/question'
import { randomInteger, shuffle, type RandomSource } from '../utils/random'

type ArithmeticQuestion = Pick<
  Question,
  'operation' | 'firstOperand' | 'secondOperand' | 'correctAnswer'
>

// Exposed separately so operation-specific mistake strategies can be tested directly.
export function distractorCandidates(question: ArithmeticQuestion): number[] {
  const { operation, firstOperand: a, secondOperand: b, correctAnswer: answer } = question
  let mistakes: number[]
  switch (operation) {
    case 'addition':
      mistakes = [a - b, a + b + 10, a + b - 10, a, b]
      break
    case 'subtraction':
      mistakes = [a + b, answer + 10, answer - 10, a, b]
      break
    case 'multiplication':
      mistakes = [a * (b - 1), a * (b + 1), (a - 1) * b, (a + 1) * b, a + b]
      break
    case 'division':
      mistakes = [answer - 1, answer + 1, b, a, a - b]
      break
  }
  return [
    ...new Set([...mistakes, answer - 1, answer + 1, answer - 2, answer + 2, answer + 3]),
  ].filter((value) => Number.isSafeInteger(value) && value >= 0 && value !== answer)
}

export function generateIncorrectAnswers(
  question: ArithmeticQuestion,
  random: RandomSource = Math.random,
): number[] {
  const answer = question.correctAnswer
  if (!Number.isSafeInteger(answer) || answer < 0 || answer > Number.MAX_SAFE_INTEGER - 3) {
    throw new RangeError('Answer must be a supported nonnegative safe integer.')
  }
  const candidates = distractorCandidates(question)
  const selected = new Set<number>()
  // A bounded random selection permits repeats without risking an endless retry loop.
  for (let attempt = 0; attempt < 12 && selected.size < 3; attempt += 1) {
    selected.add(candidates[randomInteger(0, candidates.length - 1, random)])
  }
  // Deterministic completion handles even a random source that always returns zero.
  for (const candidate of candidates) {
    if (selected.size === 3) break
    selected.add(candidate)
  }
  if (selected.size !== 3) throw new Error('Unable to generate three distinct incorrect answers.')
  return [...selected]
}

export function isValidAnswerChoices(choices: readonly number[], correctAnswer: number): boolean {
  return (
    choices.length === 4 &&
    new Set(choices).size === 4 &&
    choices.every((value) => Number.isSafeInteger(value) && value >= 0) &&
    choices.filter((value) => value === correctAnswer).length === 1
  )
}

export function generateAnswerChoices(
  question: ArithmeticQuestion,
  random: RandomSource = Math.random,
): number[] {
  const choices = shuffle(
    [question.correctAnswer, ...generateIncorrectAnswers(question, random)],
    random,
  )
  if (!isValidAnswerChoices(choices, question.correctAnswer))
    throw new Error('Generated answer choices failed validation.')
  return choices
}
