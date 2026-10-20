import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
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

function mount() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <AppRoutes />
    </MemoryRouter>,
  )
}
describe('settings', () => {
  it('requires a valid explicit save and loads defaults without overwriting practice history', async () => {
    const data = { ...emptySavedData(), records: [completedFixture()] }
    writeSavedData(data)
    const user = userEvent.setup()
    mount()
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
    mount()
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
    mount()
    await user.click(screen.getByRole('checkbox', { name: /^Sound effects/ }))
    clearSavedData()
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY })))
    expect(screen.getByRole('checkbox', { name: /^Sound effects/ })).not.toBeChecked()
  })
})

it('does not restore pending preferences when another tab clears before a local history reset', () => {
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
