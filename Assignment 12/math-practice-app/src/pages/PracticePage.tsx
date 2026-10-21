import { Link, Navigate, useLocation } from 'react-router'
import { useState } from 'react'
import { readActiveSession } from '../services/activeSession'
import { DIFFICULTIES, OPERATIONS, SESSION_LENGTHS } from '../constants/practice'
import { configurationFromState } from '../services/practiceConfiguration'
import PracticeSessionPanel from '../components/practice/PracticeSessionPanel'

export default function PracticePage() {
  const location = useLocation()
  return <PracticeEntry key={location.key} />
}

function PracticeEntry() {
  const location = useLocation()
  const [recovery] = useState(() => readActiveSession(location.key))
  const configuration = recovery.snapshot?.state.session ?? configurationFromState(location.state)
  if (recovery.unavailable)
    return <Navigate to="/practice/setup" replace state={{ sessionMissing: true }} />
  if (configuration)
    return (
      <section className="feature-page" aria-labelledby="session-title">
        <div className="feature-card">
          <p className="eyebrow">YOUR CHOICES</p>
          <h1 id="session-title" tabIndex={-1}>
            {configuration.reviewMode === 'mistake-review'
              ? 'Your mistake review'
              : 'Your practice space'}
          </h1>
          <dl className="configuration-summary">
            <div>
              <dt>Operations</dt>
              <dd>
                {OPERATIONS.filter((option) => configuration.operations.includes(option.value))
                  .map((option) => option.label)
                  .join(', ')}
              </dd>
            </div>
            <div>
              <dt>Difficulty</dt>
              <dd>
                {DIFFICULTIES.find((option) => option.value === configuration.difficulty)?.label}
              </dd>
            </div>
            <div>
              <dt>Session length</dt>
              <dd>
                {
                  SESSION_LENGTHS.find((option) => option.value === configuration.sessionLength)
                    ?.label
                }
              </dd>
            </div>
          </dl>
          <Link
            className="button button-primary"
            to="/practice/setup"
            state={{ practiceConfig: configuration }}
          >
            Edit choices
          </Link>
          <PracticeSessionPanel
            key={location.key}
            configuration={configuration}
            recovery={recovery.snapshot}
            entryKey={location.key}
          />
        </div>
      </section>
    )
  return <Navigate to="/practice/setup" replace state={{ sessionMissing: true }} />
}
