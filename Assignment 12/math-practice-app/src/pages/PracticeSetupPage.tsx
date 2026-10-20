import ErrorMessage from '../components/common/ErrorMessage'
import { activeReviewPatterns } from '../services/mistakeReview'
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
  const { data } = usePracticeStorage()
  const [configuration, setConfiguration] = useState<PracticeConfiguration>(
    () =>
      configurationFromState(location.state) ?? {
        operations: data.settings.defaultOperations,
        difficulty: data.settings.defaultDifficulty,
        sessionLength: data.settings.defaultSessionLength,
      },
  )
  const allActive = activeReviewPatterns(data.mistakePatterns ?? [])
  const eligible = activeReviewPatterns(allActive, configuration)
  const review = configuration.reviewMode === 'mistake-review'
  const valid = isPracticeConfiguration(configuration) && (!review || eligible.length > 0)

  function startSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (valid) {
      navigate('/practice/session', { state: { practiceConfig: configuration } })
    }
  }

  return (
    <section className="setup-page" aria-labelledby="setup-title">
      <p className="eyebrow">YOUR PRACTICE, YOUR PACE</p>
      <h1 id="setup-title" tabIndex={-1}>
        Choose your practice
      </h1>
      <p className="setup-introduction">
        A quick warm-up or a bigger challenge? Changes here apply to this session. Save your usual
        choices in Settings.
      </p>
      {location.state?.sessionMissing === true && (
        <ErrorMessage title="Choose a new session">
          <p>
            There is no practice session to open. Choose your practice below to start. Any reported
            answers are still in Statistics when saving was available.
          </p>
        </ErrorMessage>
      )}
      <form className="setup-form" onSubmit={startSession}>
        <fieldset className="setup-fieldset" aria-describedby="review-help">
          <legend>Practice mode</legend>
          <div className="preference-options">
            <label className="choice-card">
              <input
                type="radio"
                name="practice-mode"
                checked={!review}
                onChange={() => setConfiguration((p) => ({ ...p, reviewMode: 'regular' }))}
              />
              Regular practice
            </label>
            <label className="choice-card">
              <input
                type="radio"
                name="practice-mode"
                checked={review}
                disabled={!allActive.length}
                onChange={() => setConfiguration((p) => ({ ...p, reviewMode: 'mistake-review' }))}
              />
              Mistake review
            </label>
          </div>
          <p id="review-help" className="field-help" aria-live="polite">
            {allActive.length} active mistake patterns available.{' '}
            {allActive.length
              ? 'Choose the operations and difficulty of mistakes you want to strengthen. Related questions may use an inverse operation.'
              : 'Mark a practice answer wrong to remember a mistake. Mastered mistakes do not need review.'}
          </p>
          {review && (
            <p className="field-help" aria-live="polite">
              {eligible.length} active mistake patterns match these choices.{' '}
              {data.settings.masteryThreshold} correct review answers in a row master a pattern. A
              miss resets its progress.
            </p>
          )}
        </fieldset>
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
            {valid
              ? 'Your choices are ready.'
              : review && eligible.length === 0
                ? 'No active mistakes match these choices. Change the operations or difficulty, or choose regular practice.'
                : 'Choose at least one operation to start.'}
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
