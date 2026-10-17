import FeaturePlaceholder from '../components/common/FeaturePlaceholder'
import { Link, useLocation } from 'react-router'
import { DIFFICULTIES, OPERATIONS, SESSION_LENGTHS } from '../constants/practice'
import { configurationFromState } from '../services/practiceConfiguration'
import CardPreview from '../components/practice/CardPreview'

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
          <CardPreview key={JSON.stringify(configuration)} configuration={configuration} />
        </div>
      </section>
    )
  return (
    <FeaturePlaceholder
      category="PRACTICE"
      title="Your practice space"
      description="Math question cards will appear here once a practice session is ready."
      actionLabel="Go to practice setup"
      actionTo="/practice/setup"
    />
  )
}
