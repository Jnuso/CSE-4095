import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import OperationSelector from '../components/practice/OperationSelector'
import DifficultySelector from '../components/practice/DifficultySelector'
import SessionLengthSelector from '../components/practice/SessionLengthSelector'
import { configurationFromState, isPracticeConfiguration } from '../services/practiceConfiguration'
import type { PracticeConfiguration } from '../types'
import { usePracticeStorage } from '../components/storage/PracticeStorageProvider'

export default function PracticeSetupPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { data, saveSettings } = usePracticeStorage()
  const [configuration, setConfiguration] = useState<PracticeConfiguration>(
    () =>
      configurationFromState(location.state) ?? {
        operations: data.settings.defaultOperations,
        difficulty: data.settings.defaultDifficulty,
        sessionLength: data.settings.defaultSessionLength,
      },
  )
  const valid = isPracticeConfiguration(configuration)

  function startSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPracticeConfiguration(configuration)) {
      saveSettings({
        defaultOperations: configuration.operations,
        defaultDifficulty: configuration.difficulty,
        defaultSessionLength: configuration.sessionLength,
      })
      navigate('/practice/session', { state: { practiceConfig: configuration } })
    }
  }

  return (
    <section className="setup-page" aria-labelledby="setup-title">
      <p className="eyebrow">YOUR PRACTICE, YOUR PACE</p>
      <h1 id="setup-title" tabIndex={-1}>
        Choose your practice
      </h1>
      <p className="setup-introduction">A quick warm-up or a bigger challenge? Make it yours.</p>
      <form className="setup-form" onSubmit={startSession}>
        <OperationSelector
          value={configuration.operations}
          onChange={(operations) => setConfiguration((previous) => ({ ...previous, operations }))}
        />
        <DifficultySelector
          value={configuration.difficulty}
          onChange={(difficulty) => setConfiguration((previous) => ({ ...previous, difficulty }))}
        />
        <SessionLengthSelector
          value={configuration.sessionLength}
          onChange={(sessionLength) =>
            setConfiguration((previous) => ({ ...previous, sessionLength }))
          }
        />
        <div className="setup-submit">
          <p
            id="setup-validation"
            className={valid ? 'field-help' : 'validation-message'}
            role="status"
          >
            {valid ? 'Your choices are ready.' : 'Choose at least one operation to start.'}
          </p>
          <button
            className="button button-primary"
            type="submit"
            disabled={!valid}
            aria-describedby="setup-validation"
          >
            Start Session
          </button>
        </div>
      </form>
    </section>
  )
}
