import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from '../test/MemoryRouter'
import { describe, expect, it, vi } from 'vitest'
import AppRoutes from './AppRoutes'
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

async function mount() {
  const view = render(
    <MemoryRouter initialEntries={['/statistics']}>
      <AppRoutes />
    </MemoryRouter>,
  )
  await screen.findByRole('heading', { level: 1, name: 'Your statistics' })
  return view
}
describe('statistics dashboard', () => {
  it('renders empty totals and all operation/level cards', async () => {
    await mount()
    expect(screen.getByText(/No questions attempted yet/)).toBeInTheDocument()
    expect(screen.getByText(/No sessions yet/)).toBeInTheDocument()
    expect(screen.getByLabelText('Overall results')).toHaveTextContent('0%')
    expect(screen.getByRole('heading', { name: 'Division' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Level 4: Advanced' })).toBeInTheDocument()
  })
  it('shows saved totals and incomplete sessions with actual practiced operations', async () => {
    const record = completedFixture()
    delete record.session.completedAt
    writeSavedData({ ...emptySavedData(), records: [record] })
    await mount()
    expect(screen.getByRole('list', { name: 'Recent sessions' })).toHaveTextContent('Incomplete')
    const totals = screen.getByLabelText('Overall results')
    expect(totals).toHaveTextContent('3')
    expect(
      screen.getByText('Operations practiced: Addition, Subtraction, Multiplication'),
    ).toBeInTheDocument()
  })
  it('updates after another tab resets history and keeps disk preferences', async () => {
    const data = { ...emptySavedData(), records: [completedFixture()] }
    writeSavedData(data)
    await mount()
    data.settings.cardAnimationEnabled = false
    writeSavedData({ ...data, records: [], historyResetAt: Date.now() })
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY })))
    expect(screen.getByText(/No sessions yet/)).toBeInTheDocument()
    expect(readSavedData().data.settings.cardAnimationEnabled).toBe(false)
  })
  it('preserves malformed data instead of overwriting it', async () => {
    localStorage.setItem(STORAGE_KEY, '{broken')
    await mount()
    expect(screen.getByRole('status', { name: 'Saved data notice' })).toHaveTextContent(
      'left unchanged',
    )
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{broken')
    vi.restoreAllMocks()
  })
})

it('keeps post-reset memory records when storage becomes unreadable', async () => {
  function Harness() {
    const { data, resetHistory, saveSession } = usePracticeStorage()
    return (
      <>
        <p>Saved records: {data.records.length}</p>
        <button onClick={() => resetHistory()}>Reset</button>
        <button
          onClick={() => {
            const record = completedFixture()
            record.session.id = `fresh-${data.records.length}`
            record.session.startedAt = new Date(Date.now() + 1000).toISOString()
            record.session.completedAt = new Date(Date.now() + 2000).toISOString()
            record.attempts.forEach((attempt) => {
              attempt.sessionId = record.session.id
            })
            saveSession(record)
          }}
        >
          Save
        </button>
      </>
    )
  }
  render(
    <PracticeStorageProvider>
      <Harness />
    </PracticeStorageProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  expect(screen.getByText('Saved records: 1')).toBeInTheDocument()
  const blocked = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError')
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  expect(screen.getByText('Saved records: 2')).toBeInTheDocument()
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY })))
  expect(screen.getByText('Saved records: 2')).toBeInTheDocument()
  blocked.mockRestore()
})
