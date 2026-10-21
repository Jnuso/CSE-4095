import { expect, it, vi } from 'vitest'
import { startSession } from './practiceSession'
import {
  closeActiveSession,
  isActiveSnapshot,
  readActiveSession,
  saveActiveSession,
  type ActiveSnapshot,
} from './activeSession'
import { emptySavedData, STORAGE_KEY, writeSavedData } from './storageService'
import { trackMistakes } from './storageService'
import { wrongFact } from '../test/mistakeStatisticsFixture'

function fixture(): ActiveSnapshot {
  const state = startSession({ operations: ['addition'], difficulty: 1, sessionLength: 5 })
  return {
    version: 1,
    entryKey: 'entry',
    state,
    card: {
      questionId: state.question!.id,
      selectedAnswer: state.question!.choices[0],
      flipped: true,
    },
  }
}
it('round trips the exact active question, choices, selection and reveal without regenerating it', () => {
  const value = fixture()
  expect(isActiveSnapshot(value)).toBe(true)
  expect(saveActiveSession(value)).toBeNull()
  expect(readActiveSession('entry')).toEqual({ snapshot: value, unavailable: false })
  expect(readActiveSession('another-entry')).toEqual({ snapshot: null, unavailable: false })
})
it('rejects invalid, unsupported, already reported or inconsistent snapshots without rewriting on read', () => {
  const original = fixture()
  for (const value of [
    { ...original, version: 99 },
    { ...original, card: { ...original.card, selectedAnswer: -1 } },
    { ...original, state: { ...original.state, questionIndex: 1 } },
    {
      ...original,
      state: { ...original.state, question: { ...original.state.question, correctAnswer: -1 } },
    },
  ]) {
    const raw = JSON.stringify(value)
    sessionStorage.setItem(STORAGE_KEY, raw)
    expect(readActiveSession('entry')).toEqual({ snapshot: null, unavailable: true })
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe(raw)
  }
})
it('fences recovery against resets, closed entries and protected durable storage', () => {
  const value = fixture()
  saveActiveSession(value)
  writeSavedData({ ...emptySavedData(), historyResetAt: Date.parse(value.state.session.startedAt) })
  expect(readActiveSession('entry').unavailable).toBe(true)
  expect(saveActiveSession(value)).toContain('unavailable')
  closeActiveSession('entry')
  expect(readActiveSession('entry').unavailable).toBe(true)
  expect(readActiveSession('new-entry').unavailable).toBe(false)
  localStorage.setItem(STORAGE_KEY, '{protected')
  expect(saveActiveSession(fixture())).toContain('unavailable')
  expect(localStorage.getItem(STORAGE_KEY)).toBe('{protected')
})
it('reports session-storage write failure instead of claiming recovery succeeded', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('full', 'QuotaExceededError')
  })
  expect(saveActiveSession(fixture())).toContain('could not be saved')
})

it('retains the original fact identity and generated inverse question when recovering review practice', () => {
  const data = trackMistakes({
    ...emptySavedData(),
    mistakeEvents: [wrongFact('origin', 'addition', 3, 2, '2026-10-18T12:00:00Z')],
  })
  expect(writeSavedData(data)).toBeNull()
  const state = startSession(
    { operations: ['addition'], difficulty: 1, sessionLength: 5, reviewMode: 'mistake-review' },
    undefined,
    data.mistakePatterns,
    3,
  )
  const value: ActiveSnapshot = { version: 1, entryKey: 'review', state, card: null }
  expect(state.question?.mistakePatternId).toBe(data.mistakePatterns![0].id)
  expect(saveActiveSession(value)).toBeNull()
  expect(readActiveSession('review').snapshot).toEqual(value)
})
