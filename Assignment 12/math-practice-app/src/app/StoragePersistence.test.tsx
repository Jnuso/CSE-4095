import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { completedFixture } from '../test/summaryFixture'
import {
  emptySavedData,
  readSavedData,
  STORAGE_KEY,
  writeSavedData,
} from '../services/storageService'
import AppRoutes from './AppRoutes'

function renderPage(path = '/practice/setup') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}
async function report(user: ReturnType<typeof userEvent.setup>, right = false) {
  await user.click(
    within(screen.getByRole('group', { name: 'Answer choices' })).getAllByRole('button')[0],
  )
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  await user.click(
    screen.getByRole('button', { name: right ? 'I Got It Right' : 'I Got It Wrong' }),
  )
}

describe('storage integration', () => {
  it('persists saved defaults, animation, completed session and attempts across a fresh app mount', async () => {
    const user = userEvent.setup()
    const initial = emptySavedData()
    initial.settings.defaultOperations = ['division']
    initial.settings.defaultDifficulty = 4
    initial.settings.defaultSessionLength = 5
    writeSavedData(initial)
    const first = renderPage()
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    await user.click(screen.getByRole('checkbox', { name: 'Division' }))
    await user.click(screen.getByRole('radio', { name: /^Advanced/ }))
    await user.click(screen.getByRole('radio', { name: '5 questions' }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    await user.click(screen.getByRole('checkbox', { name: 'Animate card flips' }))
    await report(user)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await user.click(screen.getByRole('button', { name: 'End Session' }))
    const saved = readSavedData().data
    expect(saved.records).toHaveLength(1)
    expect(saved.records[0].session).toMatchObject({ attempted: 1, incorrect: 1 })
    expect(saved.records[0].session.completedAt).toBeTruthy()
    expect(saved.records[0].attempts[0]).toMatchObject({
      operation: 'division',
      difficulty: 4,
      selfReportedCorrect: false,
    })
    expect(saved.records[0].attempts[0].selectedAnswer).toBeGreaterThanOrEqual(0)
    first.unmount()
    const second = renderPage()
    expect(screen.getByRole('checkbox', { name: 'Division' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Addition' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: /^Advanced/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: '5 questions' })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    expect(screen.getByRole('checkbox', { name: 'Animate card flips' })).not.toBeChecked()
    second.unmount()
    renderPage('/practice/summary')
    expect(screen.getByText('Questions attempted').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Marked wrong').parentElement).toHaveTextContent('1')
  })
  it('saves each active attempt immediately without waiting for session completion', async () => {
    const user = userEvent.setup()
    const view = renderPage()
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    await report(user, true)
    view.unmount()
    const record = readSavedData().data.records[0]
    expect(record.session.completedAt).toBeUndefined()
    expect(record.session.attempted).toBe(1)
    expect(record.attempts).toHaveLength(1)
  })
  it('warns on quota failures but continues counting and completing in memory', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    const before = localStorage.getItem(STORAGE_KEY)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    await report(user)
    expect(screen.getByRole('status', { name: 'Saved data notice' })).toHaveTextContent(
      'storage is full',
    )
    expect(screen.getByText('Question 2 of 10')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Session totals' })).toHaveTextContent('Wrong: 1')
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await user.click(screen.getByRole('button', { name: 'End Session' }))
    expect(screen.getByText('Questions attempted').parentElement).toHaveTextContent('1')
  })
  it('uses defaults and keeps corrupt stored bytes intact while practice continues', async () => {
    localStorage.setItem(STORAGE_KEY, '{broken')
    const user = userEvent.setup()
    renderPage()
    expect(screen.getByRole('status', { name: 'Saved data notice' })).toHaveTextContent(
      'could not be read',
    )
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    await report(user)
    expect(screen.getByText('Question 2 of 10')).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{broken')
  })
  it('handles an unavailable storage getter without preventing practice', async () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    const user = userEvent.setup()
    renderPage()
    expect(screen.getByRole('status', { name: 'Saved data notice' })).toHaveTextContent(
      'unavailable',
    )
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    await report(user, true)
    expect(screen.getByRole('status', { name: 'Session totals' })).toHaveTextContent('Right: 1')
  })
  it('loads defaults for invalid settings while preserving the latest valid recap', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, settings: {}, records: [completedFixture()] }),
    )
    renderPage('/practice/summary')
    expect(screen.getByRole('status', { name: 'Saved data notice' })).toHaveTextContent(
      'settings were invalid',
    )
    expect(screen.getByText('Accuracy').parentElement).toHaveTextContent('67%')
  })
  it('merges another tab’s saved sessions instead of discarding them on the next local save', async () => {
    const user = userEvent.setup()
    renderPage()
    writeSavedData({ ...emptySavedData(), records: [completedFixture()] })
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    expect(readSavedData().data.records).toHaveLength(2)
    expect(readSavedData().data.records.some((record) => record.session.id === 'session-1')).toBe(
      true,
    )
  })
})
