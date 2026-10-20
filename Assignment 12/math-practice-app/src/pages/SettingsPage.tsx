import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { usePracticeStorage } from '../components/storage/PracticeStorageProvider'
import OperationSelector from '../components/practice/OperationSelector'
import DifficultySelector from '../components/practice/DifficultySelector'
import SessionLengthSelector from '../components/practice/SessionLengthSelector'
import { isAppSettings } from '../services/storageService'
import type { AppSettings } from '../types/settings'

export default function SettingsPage() {
  const { data, saveSettings, clearAllData } = usePracticeStorage()
  const [draft, setDraft] = useState<{ revision?: number; value: AppSettings } | null>(null)
  const [notice, setNotice] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()
  const settings = draft && draft.revision === data.appResetAt ? draft.value : data.settings
  const valid = isAppSettings(settings)
  function change(patch: Partial<AppSettings>) {
    setDraft({ revision: data.appResetAt, value: { ...settings, ...patch } })
    setNotice('Unsaved changes. Select Save Settings to keep these choices.')
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!valid) return
    const error = saveSettings(settings)
    setDraft(null)
    setNotice(
      error
        ? `These choices apply in this tab, but could not be saved. ${error}`
        : 'Settings saved. Your defaults are ready for your next practice session.',
    )
  }
  function clear() {
    const error = clearAllData()
    if (error) {
      setNotice(error)
      dialog.current?.close()
      return
    }
    dialog.current?.close()
    navigate('/', { replace: true, state: { dataCleared: true } })
  }
  return (
    <section className="setup-page settings-page" aria-labelledby="settings-title">
      <p className="eyebrow">YOUR SPACE</p>
      <h1 id="settings-title" tabIndex={-1}>
        Make it your own
      </h1>
      <p className="setup-introduction">
        Save your usual practice choices here. You can choose something different for a single
        session on the practice setup page.
      </p>
      <form className="setup-form" onSubmit={save}>
        <fieldset className="setup-fieldset">
          <legend>Practice preferences</legend>
          <div className="preference-options">
            <label className="choice-card">
              <input
                type="checkbox"
                checked={settings.soundEffectsEnabled}
                onChange={(event) => change({ soundEffectsEnabled: event.target.checked })}
              />
              <span>
                Sound effects
                <span className="choice-description">Play a gentle tone when you flip a card.</span>
              </span>
            </label>
            <label className="choice-card">
              <input
                type="checkbox"
                checked={settings.cardAnimationEnabled}
                onChange={(event) => change({ cardAnimationEnabled: event.target.checked })}
              />
              <span>
                Card animation
                <span className="choice-description">
                  Animate card flips. Your device's reduced-motion preference is always respected.
                </span>
              </span>
            </label>
            <label className="choice-card">
              <input
                type="checkbox"
                checked={settings.showExplanations}
                onChange={(event) => change({ showExplanations: event.target.checked })}
              />
              <span>
                Show explanations
                <span className="choice-description">
                  Show a short explanation after revealing an answer.
                </span>
              </span>
            </label>
          </div>
        </fieldset>
        <h2>Default practice choices</h2>
        <OperationSelector
          value={settings.defaultOperations}
          onChange={(defaultOperations) => change({ defaultOperations })}
        />
        <DifficultySelector
          value={settings.defaultDifficulty}
          onChange={(defaultDifficulty) => change({ defaultDifficulty })}
        />
        <SessionLengthSelector
          value={settings.defaultSessionLength}
          onChange={(defaultSessionLength) => change({ defaultSessionLength })}
        />
        {!valid && (
          <p className="validation-message" id="settings-validation">
            Choose at least one default operation before saving.
          </p>
        )}
        <button
          className="button button-primary"
          type="submit"
          disabled={!valid}
          aria-describedby={!valid ? 'settings-validation' : undefined}
        >
          Save Settings
        </button>
        <p role="status" aria-label="Settings update">
          {notice}
        </p>
      </form>
      <section className="feature-card settings-clear" aria-labelledby="clear-data-title">
        <h2 id="clear-data-title">Start fresh</h2>
        <p>
          Clear all saved practice history, answers, and preferences on this browser. Any saved
          mistake patterns will also be erased. This cannot be undone.
        </p>
        <button
          className="button button-secondary"
          type="button"
          onClick={() => dialog.current?.showModal()}
        >
          Clear All Application Data
        </button>
      </section>
      <dialog
        ref={dialog}
        className="reset-dialog"
        aria-labelledby="clear-dialog-title"
        aria-describedby="clear-dialog-description"
      >
        <h2 id="clear-dialog-title">Clear all application data?</h2>
        <p id="clear-dialog-description">
          This will permanently erase your practice history, answers, mistake patterns, and saved
          preferences on this browser. The app will return to its original settings and take you
          Home. This cannot be undone. Start a fresh session in any other open tab afterward.
        </p>
        <div className="summary-actions">
          <button
            className="button button-secondary"
            type="button"
            autoFocus
            onClick={() => dialog.current?.close()}
          >
            Keep my data
          </button>
          <button className="button button-primary" type="button" onClick={clear}>
            Erase all app data
          </button>
        </div>
      </dialog>
    </section>
  )
}
