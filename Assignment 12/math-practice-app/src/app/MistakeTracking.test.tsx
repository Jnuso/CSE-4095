import { act, fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import PracticeStorageProvider, {
  usePracticeStorage,
} from '../components/storage/PracticeStorageProvider'
import { completedFixture } from '../test/summaryFixture'
import {
  emptySavedData,
  readSavedData,
  STORAGE_KEY,
  writeSavedData,
} from '../services/storageService'

function fixture(id: string) {
  const record = completedFixture()
  record.session.id = id
  record.attempts.forEach((attempt) => {
    attempt.sessionId = id
  })
  return record
}
it('retains a delayed missed fact even when the corresponding session is outside newest100', () => {
  const records = Array.from({ length: 100 }, (_, index) => {
    const record = fixture(`newer-${index}`)
    record.session.completedAt = new Date(Date.UTC(2026, 9, 19, 12, index)).toISOString()
    return record
  })
  writeSavedData({ ...emptySavedData(), records })
  function Harness() {
    const { data, saveSession } = usePracticeStorage()
    return (
      <>
        <p>Patterns: {data.mistakePatterns?.length ?? 0}</p>
        <button
          onClick={() => {
            const delayed = fixture('delayed')
            delayed.attempts[1].firstOperand = 9
            delayed.attempts[1].correctAnswer = 7
            saveSession(delayed)
          }}
        >
          Save delayed
        </button>
      </>
    )
  }
  render(
    <PracticeStorageProvider>
      <Harness />
    </PracticeStorageProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Save delayed' }))
  expect(screen.getByText('Patterns: 2')).toBeInTheDocument()
  const data = readSavedData().data
  expect(data.records).toHaveLength(100)
  expect(data.records.some((record) => record.session.id === 'delayed')).toBe(false)
  expect(data.mistakePatterns!.find((pattern) => pattern.firstOperand === 9)?.incorrectCount).toBe(
    1,
  )
})
it('keeps pending misses in memory after write failure and persists each exactly once on retry', () => {
  writeSavedData({ ...emptySavedData(), records: [fixture('existing')] })
  function Harness() {
    const { data, saveSession, saveSettings } = usePracticeStorage()
    const count =
      data.mistakePatterns?.reduce((sum, pattern) => sum + pattern.incorrectCount, 0) ?? 0
    return (
      <>
        <p>Misses: {count}</p>
        <button onClick={() => saveSession(fixture('pending'))}>Save pending</button>
        <button onClick={() => saveSettings({ soundEffectsEnabled: true })}>Retry</button>
      </>
    )
  }
  render(
    <PracticeStorageProvider>
      <Harness />
    </PracticeStorageProvider>,
  )
  const fail = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('full', 'QuotaExceededError')
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save pending' }))
  fireEvent.click(screen.getByRole('button', { name: 'Save pending' }))
  expect(screen.getByText('Misses: 2')).toBeInTheDocument()
  expect(readSavedData().data.mistakeEvents).toHaveLength(1)
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY })))
  expect(screen.getByText('Misses: 2')).toBeInTheDocument()
  fail.mockRestore()
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(readSavedData().data.mistakeEvents).toHaveLength(2)
  expect(readSavedData().data.mistakePatterns![0].incorrectCount).toBe(2)
})
