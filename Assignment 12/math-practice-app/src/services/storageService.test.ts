import { describe, expect, it, vi } from 'vitest'
import { completedFixture } from '../test/summaryFixture'
import {
  defaultSettings,
  emptySavedData,
  isAppSettings,
  isStoredSession,
  latestCompletedSession,
  MAX_SAVED_SESSIONS,
  readSavedData,
  recentRecords,
  STORAGE_KEY,
  writeSavedData,
} from './storageService'

describe('browser storage service', () => {
  it('uses independent defaults when no data exists', () => {
    expect(readSavedData()).toEqual({ data: emptySavedData(), warnings: [], canWrite: true })
    const first = defaultSettings()
    first.defaultOperations.push('division')
    expect(defaultSettings().defaultOperations).toEqual(['addition'])
  })
  it('round trips settings, sessions, and full completed attempt records', () => {
    const data = emptySavedData()
    data.records = [completedFixture()]
    data.settings.defaultOperations = ['division']
    data.settings.cardAnimationEnabled = false
    localStorage.setItem('unrelated-user-data', 'keep me')
    expect(writeSavedData(data)).toBeNull()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).version).toBe(1)
    expect(readSavedData().data).toEqual(data)
    expect(localStorage.getItem('unrelated-user-data')).toBe('keep me')
    expect(latestCompletedSession(readSavedData().data)).toEqual(data.records[0])
  })
  it('validates and saves partial sessions without inventing completion', () => {
    const record = completedFixture()
    delete record.session.completedAt
    expect(isStoredSession(record)).toBe(true)
    expect(writeSavedData({ ...emptySavedData(), records: [record] })).toBeNull()
    expect(readSavedData().data.records[0].session.completedAt).toBeUndefined()
    expect(latestCompletedSession(readSavedData().data)).toBeNull()
  })
  it.each([
    '{broken',
    'null',
    '[]',
    '{"version":99,"settings":{},"records":[]}',
    '{"version":-1}',
    '{}',
  ])('protects unreadable/unsupported data %s from writes', (raw) => {
    localStorage.setItem(STORAGE_KEY, raw)
    const loaded = readSavedData()
    expect(loaded.canWrite).toBe(false)
    expect(loaded.warnings.length).toBeGreaterThan(0)
    expect(writeSavedData(emptySavedData())).not.toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
  })
  it.each([undefined, 0])(
    'loads supported legacy version %s and writes version 1 on next save',
    (version) => {
      const legacy = { version, settings: defaultSettings(), sessions: [completedFixture()] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy))
      const loaded = readSavedData()
      expect(loaded.canWrite).toBe(true)
      expect(loaded.data.records).toHaveLength(1)
      expect(loaded.warnings[0]).toContain('Older')
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).version).toBe(version)
      expect(writeSavedData(loaded.data)).toBeNull()
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).version).toBe(1)
    },
  )
  it('recovers invalid settings and individual records while retaining valid sessions', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        settings: { defaultDifficulty: 99 },
        records: [completedFixture(), { session: {}, attempts: [] }],
      }),
    )
    const loaded = readSavedData()
    expect(loaded.data.settings).toEqual(defaultSettings())
    expect(loaded.data.records).toHaveLength(1)
    expect(loaded.warnings).toHaveLength(2)
    expect(writeSavedData(loaded.data)).toBeNull()
    expect(readSavedData().warnings).toEqual([])
  })
  it.each([
    { cardAnimationEnabled: 'yes' },
    { defaultOperations: [] },
    { defaultDifficulty: 5 },
    { defaultSessionLength: 7 },
    { masteryThreshold: 0 },
    { masteryThreshold: 1.5 },
  ])('rejects invalid setting fields %j', (patch) => {
    expect(isAppSettings({ ...defaultSettings(), ...patch })).toBe(false)
  })
  it('retains the newest 100 coherent session records with their attempts', () => {
    const records = Array.from({ length: MAX_SAVED_SESSIONS + 5 }, (_, index) => {
      const record = completedFixture()
      record.session.id = `session-${index}`
      record.session.completedAt = new Date(
        Date.parse(record.session.completedAt!) + index * 1000,
      ).toISOString()
      record.attempts.forEach((attempt) => {
        attempt.sessionId = record.session.id
      })
      return record
    })
    expect(writeSavedData({ ...emptySavedData(), records })).toBeNull()
    const loaded = readSavedData().data.records
    expect(loaded).toHaveLength(100)
    expect(loaded[0].session.id).toBe('session-104')
    expect(loaded[99].session.id).toBe('session-5')
    expect(loaded.every((record) => record.attempts.length === record.session.attempted)).toBe(true)
  })
  it('upserts repeated saves and never replaces a completed record with a stale active snapshot', () => {
    const completed = completedFixture()
    const active = completedFixture()
    delete active.session.completedAt
    expect(recentRecords([completed, active, completed])).toEqual([completed])
    const older = completedFixture()
    older.attempts = older.attempts.slice(0, 1)
    Object.assign(older.session, { attempted: 1, correct: 1, incorrect: 0 })
    expect(recentRecords([completed, older])).toEqual([completed])
  })
  it('handles unavailable storage getters and read failures without crashing', () => {
    const unavailable = () => {
      throw new DOMException('blocked', 'SecurityError')
    }
    expect(readSavedData(unavailable).canWrite).toBe(false)
    expect(writeSavedData(emptySavedData(), unavailable)).toContain('unavailable')
    expect(readSavedData(() => ({ getItem: unavailable, setItem: vi.fn() })).canWrite).toBe(false)
  })
  it('handles full storage and preserves the last successful save', () => {
    const data = { ...emptySavedData(), records: [completedFixture()] }
    writeSavedData(data)
    const before = localStorage.getItem(STORAGE_KEY)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(writeSavedData(emptySavedData())).toContain('full')
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before)
  })
  it('rejects invalid writes before changing saved data', () => {
    writeSavedData(emptySavedData())
    const before = localStorage.getItem(STORAGE_KEY)
    const invalid = completedFixture()
    invalid.attempts[0].selectedAnswer = -1
    expect(writeSavedData({ ...emptySavedData(), records: [invalid] })).toContain('validation')
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before)
  })
})

describe('history reset marker protection', () => {
  it.each([1e100, -1, 1.5, 'bad', null])(
    'does not lose valid records for invalid reset marker %s',
    (marker) => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...emptySavedData(),
          records: [completedFixture()],
          historyResetAt: marker,
        }),
      )
      const loaded = readSavedData()
      expect(loaded.data.records).toHaveLength(1)
      expect(loaded.data.historyResetAt).toBeUndefined()
    },
  )
  it('excludes erased sessions and preserves new sessions after a valid reset', () => {
    const old = completedFixture()
    const fresh = structuredClone(old)
    fresh.session.id = 'fresh'
    fresh.session.startedAt = '2026-10-19T12:00:00.000Z'
    fresh.session.completedAt = '2026-10-19T12:03:00.000Z'
    fresh.attempts.forEach((attempt) => {
      attempt.sessionId = 'fresh'
    })
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...emptySavedData(),
        records: [old, fresh],
        historyResetAt: Date.parse('2026-10-19T00:00:00Z'),
      }),
    )
    expect(readSavedData().data.records.map((record) => record.session.id)).toEqual(['fresh'])
  })
})
