import type { MistakePattern } from '../types/mistake'
import type { MathOperation, Question } from '../types/question'
import { randomInteger, type RandomSource } from '../utils/random'
import { uniqueId } from '../utils/uniqueId'
import { generateAnswerChoices } from './answerChoices'
import { isMistakePattern } from './mistakeService'
import { isValidGeneratedQuestion } from './questionGenerator'

export type SimilarityStrategy = 'nearby' | 'reversed' | 'fact-family'
export interface SimilarQuestionCandidate {
  strategy: SimilarityStrategy
  // Arithmetic drafts only; the public generator attaches identity, choices and review metadata.
  question: Question
}
type RecentQuestion = Pick<Question, 'operation' | 'difficulty' | 'firstOperand' | 'secondOperand'>
export interface SimilarQuestionOptions {
  /** Oldest to newest. Only the most recent ten facts affect repetition avoidance. */
  recentQuestions?: readonly RecentQuestion[]
  random?: RandomSource
}
const symbols = { addition: '+', subtraction: '−', multiplication: '×', division: '÷' }
function factKey(question: RecentQuestion): string {
  return `${question.operation}:${question.difficulty}:${question.firstOperand}:${question.secondOperand}`
}
function draft(
  operation: MathOperation,
  a: number,
  b: number,
  difficulty: Question['difficulty'],
): Question {
  return {
    id: 'candidate',
    operation,
    difficulty,
    firstOperand: a,
    secondOperand: b,
    correctAnswer:
      operation === 'addition'
        ? a + b
        : operation === 'subtraction'
          ? a - b
          : operation === 'multiplication'
            ? a * b
            : a / b,
    displayText: `${a} ${symbols[operation]} ${b} = ?`,
    choices: [],
    source: 'regular',
  }
}

/** Bounded candidate enumeration, validated by exactly the same difficulty rules as regular practice. */
export function getSimilarQuestionCandidates(pattern: MistakePattern): SimilarQuestionCandidate[] {
  if (!isMistakePattern(pattern)) throw new RangeError('A valid mistake pattern is required.')
  const {
    operation,
    firstOperand: a,
    secondOperand: b,
    difficulty,
    correctAnswer: answer,
  } = pattern
  if (!isValidGeneratedQuestion(draft(operation, a, b, difficulty)))
    throw new RangeError('The mistake fact is outside its difficulty range.')
  const candidates: SimilarQuestionCandidate[] = []
  const seen = new Set([factKey(pattern)])
  function add(strategy: SimilarityStrategy, op: MathOperation, first: number, second: number) {
    const question = draft(op, first, second, difficulty)
    const key = factKey(question)
    if (!seen.has(key) && isValidGeneratedQuestion(question)) {
      seen.add(key)
      candidates.push({ strategy, question })
    }
  }
  // Division varies the divisor and quotient, then reconstructs the dividend: never fractions.
  for (let firstOffset = -2; firstOffset <= 2; firstOffset += 1) {
    for (let secondOffset = -2; secondOffset <= 2; secondOffset += 1) {
      if (operation === 'division') {
        const divisor = b + secondOffset
        add('nearby', operation, (answer + firstOffset) * divisor, divisor)
      } else {
        add('nearby', operation, a + firstOffset, b + secondOffset)
      }
    }
  }
  if (operation === 'addition' || operation === 'multiplication') {
    // Give a reversal its own strategy even when it is also a nearby candidate.
    const reversed = draft(operation, b, a, difficulty)
    if (factKey(reversed) !== factKey(pattern) && isValidGeneratedQuestion(reversed)) {
      const nearbyIndex = candidates.findIndex(
        ({ question }) => factKey(question) === factKey(reversed),
      )
      if (nearbyIndex >= 0) candidates.splice(nearbyIndex, 1)
      seen.delete(factKey(reversed))
      add('reversed', operation, b, a)
    }
  }
  switch (operation) {
    case 'addition':
      add('fact-family', 'subtraction', answer, a)
      add('fact-family', 'subtraction', answer, b)
      break
    case 'subtraction':
      add('fact-family', 'addition', b, answer)
      add('fact-family', 'addition', answer, b)
      break
    case 'multiplication':
      add('fact-family', 'division', answer, a)
      add('fact-family', 'division', answer, b)
      break
    case 'division':
      add('fact-family', 'multiplication', b, answer)
      add('fact-family', 'multiplication', answer, b)
      break
  }
  return candidates
}

export function generateSimilarQuestion(
  pattern: MistakePattern,
  options: SimilarQuestionOptions = {},
): Question {
  const random = options.random ?? Math.random
  const candidates = getSimilarQuestionCandidates(pattern)
  if (candidates.length === 0) throw new Error('No valid related question is available.')
  const recent = (options.recentQuestions ?? []).slice(-10).map(factKey)
  let available = candidates.filter(({ question }) => !recent.includes(factKey(question)))
  if (available.length === 0) {
    // A small candidate pool may be exhausted. Reuse the least recently seen fact, never retry forever.
    const oldest = Math.min(
      ...candidates.map(({ question }) => recent.lastIndexOf(factKey(question))),
    )
    available = candidates.filter(
      ({ question }) => recent.lastIndexOf(factKey(question)) === oldest,
    )
  }
  const strategies = [...new Set(available.map(({ strategy }) => strategy))]
  const strategy = strategies[randomInteger(0, strategies.length - 1, random)]
  const choices = available.filter((candidate) => candidate.strategy === strategy)
  const { question } = choices[randomInteger(0, choices.length - 1, random)]
  return {
    ...question,
    id: uniqueId(),
    choices: generateAnswerChoices(question, random),
    source: 'mistake-review',
    mistakePatternId: pattern.id,
  }
}
