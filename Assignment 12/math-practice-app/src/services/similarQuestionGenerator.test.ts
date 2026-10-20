import { describe, expect, it } from 'vitest'
import type { MistakePattern } from '../types/mistake'
import type { DifficultyLevel, MathOperation, Question } from '../types/question'
import { isValidAnswerChoices } from './answerChoices'
import { generateQuestion, isValidGeneratedQuestion } from './questionGenerator'
import { generateSimilarQuestion, getSimilarQuestionCandidates } from './similarQuestionGenerator'

function pattern(
  operation: MathOperation = 'addition',
  a = 4,
  b = 3,
  difficulty: DifficultyLevel = 1,
): MistakePattern {
  return {
    id: 'saved-mistake',
    operation,
    firstOperand: a,
    secondOperand: b,
    difficulty,
    correctAnswer:
      operation === 'addition'
        ? a + b
        : operation === 'subtraction'
          ? a - b
          : operation === 'multiplication'
            ? a * b
            : a / b,
    incorrectCount: 2,
    similarCorrectCount: 1,
    mastered: false,
    lastIncorrectAt: '2026-10-20T00:00:00Z',
  }
}
function key(q: Pick<Question, 'operation' | 'firstOperand' | 'secondOperand'>): string {
  return `${q.operation}:${q.firstOperand}:${q.secondOperand}`
}
function sequence(...values: number[]) {
  let index = 0
  return () => values[index++ % values.length]
}
const operations: MathOperation[] = ['addition', 'subtraction', 'multiplication', 'division']
const levels: DifficultyLevel[] = [1, 2, 3, 4]

describe('related arithmetic strategies', () => {
  it.each(operations)(
    'creates genuinely nearby valid %s facts without the original',
    (operation) => {
      const original = operation === 'division' ? pattern(operation, 12, 3) : pattern(operation)
      const candidates = getSimilarQuestionCandidates(original)
      const nearby = candidates.filter((candidate) => candidate.strategy === 'nearby')
      expect(nearby.length).toBeGreaterThan(0)
      for (const { question } of nearby) {
        expect(question.operation).toBe(operation)
        expect(key(question)).not.toBe(key(original))
        if (operation === 'division') {
          expect(Math.abs(question.correctAnswer - original.correctAnswer)).toBeLessThanOrEqual(2)
          expect(Math.abs(question.secondOperand - original.secondOperand)).toBeLessThanOrEqual(2)
        } else {
          expect(Math.abs(question.firstOperand - original.firstOperand)).toBeLessThanOrEqual(2)
          expect(Math.abs(question.secondOperand - original.secondOperand)).toBeLessThanOrEqual(2)
        }
      }
    },
  )
  it.each(['addition', 'multiplication'] as const)('reverses %s operands', (operation) => {
    expect(
      getSimilarQuestionCandidates(pattern(operation))
        .filter((c) => c.strategy === 'reversed')
        .map((c) => key(c.question)),
    ).toEqual([`${operation}:3:4`])
  })
  it.each(['subtraction', 'division'] as const)(
    'never treats reversed %s as equivalent',
    (operation) => {
      const original = operation === 'division' ? pattern(operation, 12, 3) : pattern(operation)
      expect(getSimilarQuestionCandidates(original).some((c) => c.strategy === 'reversed')).toBe(
        false,
      )
    },
  )
  it.each([
    [pattern('addition'), ['subtraction:7:4', 'subtraction:7:3']],
    [pattern('subtraction'), ['addition:3:1', 'addition:1:3']],
    [pattern('multiplication'), ['division:12:4', 'division:12:3']],
    [pattern('division', 12, 3), ['multiplication:3:4', 'multiplication:4:3']],
  ] as const)('creates the inverse fact family for $operation', (original, expected) => {
    expect(
      getSimilarQuestionCandidates(original)
        .filter((c) => c.strategy === 'fact-family')
        .map((c) => key(c.question)),
    ).toEqual(expected)
  })
  it('filters inverse addition when the sum exceeds the subtraction operand limit', () => {
    const candidates = getSimilarQuestionCandidates(pattern('addition', 10, 10))
    expect(candidates.some((c) => c.strategy === 'fact-family')).toBe(false)
    expect(generateSimilarQuestion(pattern('addition', 10, 10)).difficulty).toBe(1)
  })
  it('filters reversals outside asymmetric multiplication bounds', () => {
    for (const original of [
      pattern('multiplication', 9, 99, 3),
      pattern('multiplication', 10, 0, 4),
    ]) {
      expect(getSimilarQuestionCandidates(original).some((c) => c.strategy === 'reversed')).toBe(
        false,
      )
      expect(getSimilarQuestionCandidates(original).length).toBeGreaterThan(0)
    }
  })
  it('handles zero products without division by zero and deduplicates equal operands', () => {
    const candidates = getSimilarQuestionCandidates(pattern('multiplication', 0, 3))
    expect(
      candidates.filter((c) => c.strategy === 'fact-family').map((c) => key(c.question)),
    ).toEqual(['division:0:3'])
    const equal = getSimilarQuestionCandidates(pattern('addition', 3, 3))
    expect(equal.filter((c) => c.strategy === 'reversed')).toHaveLength(0)
    expect(new Set(equal.map((c) => key(c.question))).size).toBe(equal.length)
    expect(equal.filter((c) => c.strategy === 'fact-family')).toHaveLength(1)
  })
})

describe('completed review questions', () => {
  it.each(levels)('enforces independent numeric bounds at all level %i endpoints', (level) => {
    const originals: MistakePattern[] = []
    for (const operation of operations) {
      for (const random of [() => 0, () => 1 - Number.EPSILON, sequence(0, 1 - Number.EPSILON)]) {
        const q = generateQuestion(operation, level, random)
        originals.push(pattern(operation, q.firstOperand, q.secondOperand, level))
      }
    }
    for (const original of originals) {
      const candidates = getSimilarQuestionCandidates(original)
      expect(candidates.length).toBeGreaterThan(0)
      for (const { question: q } of candidates) {
        const a = q.firstOperand,
          b = q.secondOperand
        expect(q.difficulty).toBe(level)
        expect([a, b, q.correctAnswer].every((n) => Number.isSafeInteger(n) && n >= 0)).toBe(true)
        if (q.operation === 'addition' || q.operation === 'subtraction') {
          expect(Math.max(a, b)).toBeLessThanOrEqual([10, 50, 100, 1000][level - 1])
          expect(q.correctAnswer).toBe(q.operation === 'addition' ? a + b : a - b)
        } else if (q.operation === 'multiplication') {
          expect(a).toBeGreaterThanOrEqual(level === 4 ? 10 : 0)
          expect(a).toBeLessThanOrEqual([5, 10, 9, 99][level - 1])
          expect(b).toBeLessThanOrEqual([5, 10, 99, 99][level - 1])
          expect(q.correctAnswer).toBe(a * b)
        } else {
          expect(b).toBeGreaterThan(0)
          expect(b).toBeLessThanOrEqual([5, 10, 12, 99][level - 1])
          expect(a % b).toBe(0)
          expect(q.correctAnswer).toBe(a / b)
          if (level <= 2) expect(q.correctAnswer).toBeLessThanOrEqual(level === 1 ? 5 : 10)
          else expect(a).toBeLessThanOrEqual(level === 3 ? 144 : 9999)
        }
      }
    }
  })
  for (const operation of operations) {
    it.each(levels)(`validates ${operation} boundaries and varied facts at level %i`, (level) => {
      for (let sample = 0; sample < 30; sample += 1) {
        const base = generateQuestion(operation, level, sequence(sample / 30, (29 - sample) / 30))
        const original = pattern(operation, base.firstOperand, base.secondOperand, level)
        const candidates = getSimilarQuestionCandidates(original)
        expect(candidates.length).toBeGreaterThan(0)
        for (const { question } of candidates) {
          expect(isValidGeneratedQuestion(question)).toBe(true)
          expect(question.difficulty).toBe(level)
          expect(key(question)).not.toBe(key(original))
          expect(Number.isInteger(question.correctAnswer)).toBe(true)
          expect(question.correctAnswer).toBeGreaterThanOrEqual(0)
        }
        const question = generateSimilarQuestion(original, { random: sequence(0, 0.99, 0.5) })
        expect(question).toMatchObject({
          source: 'mistake-review',
          mistakePatternId: original.id,
          difficulty: level,
        })
        expect(question.id).not.toBe('candidate')
        expect(isValidAnswerChoices(question.choices, question.correctAnswer)).toBe(true)
        expect(isValidGeneratedQuestion({ ...question, source: 'regular' })).toBe(true)
      }
    })
  }
  it('can select each available strategy rather than letting nearby candidates swamp the others', () => {
    const original = pattern()
    const candidates = getSimilarQuestionCandidates(original)
    const strategies = [...new Set(candidates.map((c) => c.strategy))]
    expect(strategies).toEqual(['nearby', 'reversed', 'fact-family'])
    for (let index = 0; index < strategies.length; index += 1) {
      const q = generateSimilarQuestion(original, {
        random: sequence((index + 0.1) / strategies.length, 0),
      })
      expect(candidates.find((c) => key(c.question) === key(q))?.strategy).toBe(strategies[index])
    }
  })
  it('avoids the original and the last ten facts even with a constant random source', () => {
    const original = pattern()
    const recent: Question[] = []
    for (let index = 0; index < 25; index += 1) {
      const question = generateSimilarQuestion(original, {
        random: () => 0,
        recentQuestions: recent,
      })
      expect(key(question)).not.toBe(key(original))
      expect(recent.slice(-10).map(key)).not.toContain(key(question))
      recent.push(question)
    }
    expect(new Set(recent.map((q) => q.id)).size).toBe(recent.length)
  })
  it('uses the least recently seen fact when a small pool is exhausted', () => {
    const original = pattern('multiplication', 0, 0)
    const candidates = getSimilarQuestionCandidates(original).map((c) => c.question)
    expect(candidates.length).toBeLessThanOrEqual(10)
    const recent = [...candidates, candidates[0]]
    const question = generateSimilarQuestion(original, { recentQuestions: recent, random: () => 0 })
    expect(key(question)).toBe(key(candidates[1]))
    expect(key(question)).not.toBe(key(recent[recent.length - 1]))
  })
  it('does not mutate a saved pattern or recent questions and is independent between calls', () => {
    const original = Object.freeze(pattern())
    const recent = Object.freeze([Object.freeze(generateSimilarQuestion(original))])
    const before = JSON.stringify({ original, recent })
    generateSimilarQuestion(original, { recentQuestions: recent })
    expect(JSON.stringify({ original, recent })).toBe(before)
    const a = generateSimilarQuestion(original, { random: () => 0 })
    const b = generateSimilarQuestion(original, { random: () => 0 })
    expect(key(a)).toBe(key(b))
    expect(a.id).not.toBe(b.id)
  })
  it.each([NaN, -0.1, 1, Infinity])('rejects invalid random value %s', (value) => {
    expect(() => generateSimilarQuestion(pattern(), { random: () => value })).toThrow(RangeError)
  })
  it('rejects malformed, incorrect arithmetic and out-of-difficulty patterns', () => {
    for (const original of [
      null,
      { ...pattern(), id: '' },
      { ...pattern(), correctAnswer: 99 },
      pattern('division', 1, 0),
      pattern('addition', 100, 100, 1),
    ]) {
      expect(() => generateSimilarQuestion(original as MistakePattern)).toThrow(RangeError)
    }
  })
})
