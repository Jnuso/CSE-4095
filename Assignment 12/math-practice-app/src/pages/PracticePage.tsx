import { Link, Navigate, useLocation } from 'react-router'
import { DIFFICULTIES, OPERATIONS, SESSION_LENGTHS } from '../constants/practice'
import { configurationFromState } from '../services/practiceConfiguration'
import PracticeSessionPanel from '../components/practice/PracticeSessionPanel'

export default function PracticePage() {
  const location = useLocation()
  const configuration = configurationFromState(location.state)
  if (configuration)
    return (
      <section className="feature-page" aria-labelledby="session-title">
        <div className="feature-card">
          <p className="eyebrow">YOUR CHOICES</p>
          <h1 id="session-title" tabIndex={-1}>
            Your practice space
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
          <PracticeSessionPanel key={location.key} configuration={configuration} />
        </div>
      </section>
    )
  return <Navigate to="/practice/setup" replace />
}
