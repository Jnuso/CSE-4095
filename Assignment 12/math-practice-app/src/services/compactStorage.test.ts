import { expect, it } from 'vitest'
import { completedFixture } from '../test/summaryFixture'
import { packEvent, unpackEvent, packPattern, unpackPattern } from './compactStorage'
import { buildMistakePatterns, type MistakeEvent } from './mistakeService'
import { emptySavedData, readSavedData, writeSavedData, STORAGE_KEY } from './storageService'

it('preserves every field of regular and targeted review evidence and legacy mastery caches', () => {
  const attempt = completedFixture().attempts[1]
  const base: MistakeEvent = {
    sessionStartedAt: completedFixture().session.startedAt,
    attempt: { ...attempt, source: 'regular' },
  }
  const pattern = { ...buildMistakePatterns([base])[0], similarCorrectCount: 2, mastered: true }
  const review = {
    ...base,
    attempt: {
      ...attempt,
      id: 'review',
      questionId: 'review-question',
      attemptedAt: '2026-10-18T12:03:00.000Z',
      selfReportedCorrect: true,
      mistakePatternId: pattern.id,
    },
  }
  expect(unpackEvent(packEvent(base))).toEqual(base)
  expect(unpackEvent(packEvent(review))).toEqual(review)
  expect(unpackPattern(packPattern(pattern))).toEqual(pattern)
  const encoded = {
    ...emptySavedData(),
    version: 2,
    journalFormat: 'tuple-v1',
    mistakeEvents: [packEvent(base)],
    reviewEvents: [packEvent(review)],
    mistakePatterns: [packPattern(pattern)],
  }
  const raw = JSON.stringify(encoded)
  localStorage.setItem(STORAGE_KEY, raw)
  const restored = readSavedData()
  expect(restored.canWrite).toBe(true)
  expect(restored.warnings).toEqual([])
  expect(restored.data.mistakeEvents).toEqual([base])
  expect(restored.data.reviewEvents).toEqual([review])
  expect(restored.data.mistakePatterns![0].similarCorrectCount).toBe(1)
  expect(restored.data.mistakePatterns![0].mastered).toBe(false)
  expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
  delete (encoded as { reviewEvents?: unknown }).reviewEvents
  localStorage.setItem(STORAGE_KEY, JSON.stringify(encoded))
  expect(readSavedData().data.mistakePatterns![0]).toEqual(pattern)
})

it('protects unsupported compact formats and repairs only damaged journal entries in known formats', () => {
  for (const journalFormat of [undefined, 'future']) {
    const raw = JSON.stringify({ ...emptySavedData(), version: 2, journalFormat })
    localStorage.setItem(STORAGE_KEY, raw)
    expect(readSavedData().canWrite).toBe(false)
    expect(writeSavedData(emptySavedData())).not.toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
  }
  const raw = JSON.stringify({
    ...emptySavedData(),
    version: 2,
    journalFormat: 'tuple-v1',
    mistakeEvents: [['broken']],
    mistakePatterns: [],
    reviewEvents: [],
  })
  localStorage.setItem(STORAGE_KEY, raw)
  const result = readSavedData()
  expect(result.canWrite).toBe(true)
  expect(result.warnings.join(' ')).toContain('mistake data')
  expect(result.data.mistakeEvents).toEqual([])
  expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
})
