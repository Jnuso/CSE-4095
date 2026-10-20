import { describe, expect, it } from 'vitest'
import { completedFixture } from '../test/summaryFixture'
import { mistakeEvent } from '../test/mistakeFixture'
import { buildMistakePatterns } from './mistakeService'
import {
  emptySavedData,
  readSavedData,
  STORAGE_KEY,
  trackMistakes,
  writeSavedData,
  MAX_SAVED_SESSIONS,
} from './storageService'

describe('persisted mistake tracking', () => {
  it('backfills old saved history and never increments when loading or saving the same snapshots again', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...emptySavedData(), records: [completedFixture()] }),
    )
    let data = readSavedData().data
    expect(data.mistakePatterns).toHaveLength(1)
    expect(data.mistakePatterns![0].incorrectCount).toBe(1)
    for (let i = 0; i < 3; i++) {
      expect(writeSavedData(data)).toBeNull()
      data = readSavedData().data
    }
    expect(data.mistakePatterns![0].incorrectCount).toBe(1)
    expect(data.mistakeEvents).toHaveLength(1)
  })
  it('remembers the oldest missed fact after session detail retention removes its session', () => {
    const records = Array.from({ length: MAX_SAVED_SESSIONS + 1 }, (_, index) => {
      const record = completedFixture()
      record.session.id = `retained-${index}`
      record.session.completedAt = new Date(Date.UTC(2026, 9, 18, 13, index)).toISOString()
      record.attempts.forEach((attempt) => {
        attempt.sessionId = record.session.id
      })
      if (index > 0) {
        record.attempts[1].firstOperand = 8
        record.attempts[1].correctAnswer = 6
      }
      return record
    })
    const tracked = trackMistakes({ ...emptySavedData(), records })
    expect(tracked.records).toHaveLength(100)
    expect(tracked.mistakeEvents).toHaveLength(101)
    expect(writeSavedData({ ...emptySavedData(), records })).toBeNull()
    const data = readSavedData().data
    expect(data.records.some((record) => record.session.id === 'retained-0')).toBe(false)
    expect(
      data.mistakePatterns!.find((pattern) => pattern.firstOperand === 7)?.incorrectCount,
    ).toBe(1)
    expect(
      data.mistakePatterns!.find((pattern) => pattern.firstOperand === 8)?.incorrectCount,
    ).toBe(100)
  })
  it('recovers malformed entries using valid saved answers and reports the repair', () => {
    const record = completedFixture()
    const event = { sessionStartedAt: record.session.startedAt, attempt: record.attempts[1] }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...emptySavedData(),
        records: [completedFixture()],
        mistakeEvents: [event, { nonsense: true }],
        mistakePatterns: [...buildMistakePatterns([event]), { incorrectCount: -1 }],
      }),
    )
    const loaded = readSavedData()
    expect(loaded.canWrite).toBe(true)
    expect(loaded.warnings.join(' ')).toContain('mistake data could not be read')
    expect(loaded.data.records).toHaveLength(1)
    expect(loaded.data.mistakePatterns![0].incorrectCount).toBe(1)
    expect(writeSavedData(loaded.data)).toBeNull()
    expect(readSavedData().warnings).toEqual([])
  })
  it('rebuilds a corrupt cache from valid events even with no retained session details', () => {
    const event = mistakeEvent()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...emptySavedData(), mistakeEvents: [event], mistakePatterns: 'bad-cache' }),
    )
    const data = readSavedData().data
    expect(data.mistakePatterns).toEqual(buildMistakePatterns([event]))
    expect(data.records).toEqual([])
  })
  it('reset cutoff excludes old journal entries and old session snapshots', () => {
    const event = mistakeEvent()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...emptySavedData(),
        records: [completedFixture()],
        mistakeEvents: [event],
        mistakePatterns: buildMistakePatterns([event]),
        historyResetAt: Date.parse('2026-10-19T00:00:00Z'),
      }),
    )
    const data = readSavedData().data
    expect(data.records).toEqual([])
    expect(data.mistakeEvents).toEqual([])
    expect(data.mistakePatterns).toEqual([])
  })
  it('rejects invalid writes instead of silently persisting an invalid journal', () => {
    const event = mistakeEvent()
    event.attempt.correctAnswer = -1
    expect(writeSavedData({ ...emptySavedData(), mistakeEvents: [event] })).toContain('validation')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
