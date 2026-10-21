import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from '../test/MemoryRouter'
import { describe, expect, it, vi } from 'vitest'
import AppRoutes from './AppRoutes'
import PracticeStorageProvider, {
  usePracticeStorage,
} from '../components/storage/PracticeStorageProvider'
import {
  defaultSettings,
  emptySavedData,
  readSavedData,
  STORAGE_KEY,
  writeSavedData,
  clearSavedData,
} from '../services/storageService'
import { completedFixture } from '../test/summaryFixture'

async function mount() {
  const view = render(
    <MemoryRouter initialEntries={['/settings']}>
      <AppRoutes />
    </MemoryRouter>,
  )
  await screen.findByRole('heading', { level: 1, name: 'Make it your own' })
  return view
}
describe('settings', () => {
  it('validates and explicitly saves a mastery threshold across a fresh mount', async () => {
    const user = userEvent.setup()
    const view = await mount()
    const threshold = screen.getByRole('spinbutton', { name: 'Mastery threshold' })
    expect(threshold).toHaveValue(3)
    for (const value of ['', '0', '101', '1.5']) {
      fireEvent.change(threshold, { target: { value } })
      expect(screen.getByRole('button', { name: 'Save Settings' })).toBeDisabled()
      expect(readSavedData().data.settings.masteryThreshold).toBe(3)
    }
    fireEvent.change(threshold, { target: { value: '2' } })
    expect(readSavedData().data.settings.masteryThreshold).toBe(3)
    await user.click(screen.getByRole('button', { name: 'Save Settings' }))
    expect(readSavedData().data.settings.masteryThreshold).toBe(2)
    view.unmount()
    await mount()
    expect(screen.getByRole('spinbutton', { name: 'Mastery threshold' })).toHaveValue(2)
  })
  it('requires a valid explicit save and loads defaults without overwriting practice history', async () => {
    const data = { ...emptySavedData(), records: [completedFixture()] }
    writeSavedData(data)
    const user = userEvent.setup()
    await mount()
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(screen.getByRole('button', { name: 'Save Settings' })).toBeDisabled()
    expect(readSavedData().data.settings).toEqual(defaultSettings())
    await user.click(screen.getByRole('checkbox', { name: 'Division' }))
    await user.click(screen.getByRole('radio', { name: /^Advanced/ }))
    await user.click(screen.getByRole('radio', { name: '5 questions' }))
    await user.click(screen.getByRole('checkbox', { name: /^Sound effects/ }))
    await user.click(screen.getByRole('checkbox', { name: /^Show explanations/ }))
    await user.click(screen.getByRole('button', { name: 'Save Settings' }))
    expect(screen.getByRole('status', { name: 'Settings update' })).toHaveTextContent(
      'Settings saved',
    )
    expect(readSavedData().data.settings).toMatchObject({
      defaultOperations: ['division'],
      defaultDifficulty: 4,
      defaultSessionLength: 5,
      soundEffectsEnabled: true,
      showExplanations: false,
    })
    expect(readSavedData().data.records).toEqual(data.records)
    await user.click(screen.getByRole('link', { name: 'Practice' }))
    expect(screen.getByRole('checkbox', { name: 'Division' })).toBeChecked()
    expect(screen.getByRole('radio', { name: /^Advanced/ })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: /^Beginner/ }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    expect(readSavedData().data.records[0].session.difficulty).toBe(1)
    expect(readSavedData().data.settings.defaultDifficulty).toBe(4)
  })
  it('shows save failure honestly while keeping the current choices in memory', async () => {
    const user = userEvent.setup()
    await mount()
    await user.click(screen.getByRole('checkbox', { name: /^Show explanations/ }))
    const fail = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    await user.click(screen.getByRole('button', { name: 'Save Settings' }))
    expect(screen.getByRole('status', { name: 'Settings update' })).toHaveTextContent(
      'could not be saved',
    )
    expect(screen.getByRole('checkbox', { name: /^Show explanations/ })).not.toBeChecked()
    fail.mockRestore()
  })
  it('drops an unsaved draft after clear-all in another tab', async () => {
    const user = userEvent.setup()
    await mount()
    sessionStorage.setItem(STORAGE_KEY, 'old recovery snapshot')
    await user.click(screen.getByRole('checkbox', { name: /^Sound effects/ }))
    clearSavedData()
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY })))
    expect(screen.getByRole('checkbox', { name: /^Sound effects/ })).not.toBeChecked()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

it.each(['history', 'all'])(
  'erases this tab’s recovery data after a successful %s reset while preserving unrelated data',
  (kind) => {
    function Harness() {
      const { resetHistory, clearAllData } = usePracticeStorage()
      return (
        <button onClick={() => (kind === 'history' ? resetHistory() : clearAllData())}>
          Erase
        </button>
      )
    }
    render(
      <PracticeStorageProvider>
        <Harness />
      </PracticeStorageProvider>,
    )
    sessionStorage.setItem(STORAGE_KEY, 'old recovery snapshot')
    sessionStorage.setItem('unrelated', 'keep')
    fireEvent.click(screen.getByRole('button', { name: 'Erase' }))
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(sessionStorage.getItem('unrelated')).toBe('keep')
  },
)

it('does not restore pending preferences when another tab clears before a local history reset', async () => {
  function Harness() {
    const { saveSettings, resetHistory } = usePracticeStorage()
    return (
      <>
        <button onClick={() => saveSettings({ soundEffectsEnabled: true })}>Save pending</button>
        <button onClick={() => resetHistory()}>Reset history</button>
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
  fail.mockRestore()
  expect(clearSavedData().error).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Reset history' }))
  expect(readSavedData().data.settings).toEqual(defaultSettings())
  expect(readSavedData().data.records).toEqual([])
})
