import { expect, it, vi } from 'vitest'
import { completedFixture } from '../test/summaryFixture'
import { emptySavedData, readSavedData, STORAGE_KEY, writeSavedData } from './storageService'
import { generateQuestion, isValidGeneratedQuestion } from './questionGenerator'
import { nextQuestion } from './practiceSession'
import type { Question } from '../types/question'
import { nextReviewQuestion } from './mistakeReview'
import { mistakeKey } from './mistakeService'

it('recovers valid answers from a damaged session and repairs totals without changing preferences', () => {
  const record = completedFixture()
  record.attempts[0].selectedAnswer = -1
  const data = { ...emptySavedData(), records: [record] }
  data.settings.soundEffectsEnabled = true
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  const loaded = readSavedData()
  expect(loaded.warnings.join(' ')).toContain('damaged answers')
  expect(loaded.data.settings).toEqual(data.settings)
  expect(loaded.data.records[0].attempts.map((a) => a.id)).toEqual(['attempt-2', 'attempt-3'])
  expect(loaded.data.records[0].session).toMatchObject({ attempted: 2, correct: 1, incorrect: 1 })
  expect(loaded.data.mistakePatterns).toHaveLength(1)
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(data)
  expect(writeSavedData(loaded.data)).toBeNull()
  expect(readSavedData().warnings).toEqual([])
})

it('isolates a malformed records category while retaining valid settings and mistake evidence', () => {
  const data = { ...emptySavedData(), records: [completedFixture()] }
  writeSavedData(data)
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
  saved.records = null
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  const loaded = readSavedData()
  expect(loaded.canWrite).toBe(true)
  expect(loaded.data.records).toEqual([])
  expect(loaded.data.settings).toEqual(data.settings)
  expect(loaded.data.mistakePatterns).toHaveLength(1)
  expect(loaded.warnings).toHaveLength(1)
})

it('drops duplicate answer identities, repairs cached totals and rejects malformed session headers', () => {
  const record = completedFixture()
  record.attempts.push(record.attempts[0])
  record.session.correct = 999
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...emptySavedData(), records: [record, { session: null, attempts: [] }] }),
  )
  const loaded = readSavedData()
  expect(loaded.data.records).toHaveLength(1)
  expect(loaded.data.records[0].session).toMatchObject({ attempted: 3, correct: 2, incorrect: 1 })
})

it('retries thrown, malformed and out-of-configuration questions, then uses a bounded valid fallback', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const config = {
    operations: ['division'] as const,
    difficulty: 4 as const,
    sessionLength: 5 as const,
  }
  const previous = generateQuestion('division', 4, () => 0)
  const invalid = vi.fn(() => null as unknown as Question)
  const fallback = nextQuestion(
    { ...config, operations: [...config.operations] },
    previous,
    invalid,
  )
  expect(invalid).toHaveBeenCalledTimes(10)
  expect(isValidGeneratedQuestion(fallback)).toBe(true)
  expect(fallback.choices).toHaveLength(4)
  expect(fallback.operation).toBe('division')
  expect(fallback.difficulty).toBe(4)
  expect(fallback.displayText).not.toBe(previous.displayText)
  const valid = generateQuestion('division', 4)
  const recovered = vi
    .fn()
    .mockImplementationOnce(() => {
      throw new Error('private detail')
    })
    .mockReturnValueOnce(generateQuestion('addition', 1))
    .mockReturnValue(valid)
  expect(nextQuestion({ ...config, operations: [...config.operations] }, null, recovered)).toBe(
    valid,
  )
  expect(recovered).toHaveBeenCalledTimes(3)
  expect(console.warn).not.toHaveBeenCalledWith(expect.stringContaining('private detail'))
})

it('validates unknown generated values without crashing', () => {
  for (const value of [null, undefined, {}, { choices: null }, { id: 'x', choices: [] }]) {
    expect(isValidGeneratedQuestion(value)).toBe(false)
  }
})

it('recovers review generation from a broken random source without changing the source pattern', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const pattern = {
    id: '',
    operation: 'addition' as const,
    difficulty: 1 as const,
    firstOperand: 3,
    secondOperand: 2,
    correctAnswer: 5,
    incorrectCount: 1,
    similarCorrectCount: 0,
    mastered: false,
    lastIncorrectAt: '2026-10-20T12:00:00Z',
  }
  pattern.id = mistakeKey(pattern)
  const original = structuredClone(pattern)
  const question = nextReviewQuestion([pattern], [], () => NaN)
  expect(question.mistakePatternId).toBe(pattern.id)
  expect(question.source).toBe('mistake-review')
  expect(question.choices).toHaveLength(4)
  expect(isValidGeneratedQuestion({ ...question, source: 'regular' })).toBe(true)
  expect(pattern).toEqual(original)
})
