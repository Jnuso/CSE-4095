import FeaturePlaceholder from '../components/common/FeaturePlaceholder'
import { Link, useLocation } from 'react-router'
import { summaryFromState, summarize } from '../services/sessionSummary'
import { DIFFICULTIES, OPERATIONS } from '../constants/practice'
import { usePracticeStorage } from '../components/storage/PracticeStorageProvider'
import { latestCompletedSession, MAX_SAVED_SESSIONS } from '../services/storageService'

export default function SessionSummaryPage() {
  const { state } = useLocation()
  const { data } = usePracticeStorage()
  const completed = summaryFromState(state) ?? (state == null ? latestCompletedSession(data) : null)
  if (completed) {
    const results = summarize(completed)
    const { session } = completed
    const practiceConfig = {
      operations: session.operations,
      difficulty: session.difficulty,
      sessionLength: session.sessionLength,
    }
    return (
      <section className="feature-page" aria-labelledby="summary-title">
        <div className="feature-card summary-card">
          <p className="eyebrow">SESSION COMPLETE</p>
          <h1 id="summary-title" tabIndex={-1}>
            Your practice recap
          </h1>
          <p className="feature-description">
            {results.attempted === 0
              ? 'No questions attempted this time. You can start again whenever you’re ready.'
              : 'Thanks for practicing! Every question is a step forward.'}
          </p>
          <dl className="summary-metrics" aria-label="Session results">
            <div>
              <dt>Questions attempted</dt>
              <dd>{results.attempted}</dd>
            </div>
            <div>
              <dt>Marked right</dt>
              <dd>{results.correct}</dd>
            </div>
            <div>
              <dt>Marked wrong</dt>
              <dd>{results.incorrect}</dd>
            </div>
            <div>
              <dt>Accuracy</dt>
              <dd>{results.accuracy}%</dd>
            </div>
          </dl>
          <p className="field-help">
            Accuracy is based on how you marked each answer
            {results.attempted === 0
              ? '; 0% means no attempts yet'
              : ', rounded to the nearest whole percent'}
            .
          </p>
          <dl className="configuration-summary">
            <div>
              <dt>Operations practiced</dt>
              <dd>
                {results.operations.length
                  ? OPERATIONS.filter((option) => results.operations.includes(option.value))
                      .map((option) => option.label)
                      .join(', ')
                  : 'None yet'}
              </dd>
            </div>
            <div>
              <dt>Difficulty</dt>
              <dd>{DIFFICULTIES.find((option) => option.value === session.difficulty)?.label}</dd>
            </div>
            <div>
              <dt>Mistake-review questions completed</dt>
              <dd>{results.reviewCount}</dd>
            </div>
          </dl>
          <div className="summary-actions" aria-label="Summary actions">
            <Link
              className="button button-primary"
              to="/practice/session"
              state={{ practiceConfig }}
            >
              Practice Again
            </Link>
            <button
              className="button button-secondary"
              type="button"
              disabled
              aria-describedby="mistake-review-note"
            >
              Practice Mistakes
            </button>
            <Link
              className="button button-secondary"
              to="/practice/setup"
              state={{ practiceConfig }}
            >
              Change Settings
            </Link>
            <Link className="button button-secondary" to="/statistics">
              View Statistics
            </Link>
            <Link className="button button-secondary" to="/">
              Return Home
            </Link>
          </div>
          <p id="mistake-review-note" className="field-help">
            Practice Mistakes will be available when mistake review is added.
          </p>
          <p className="field-help">
            Reported answers are saved on this browser when storage is available. The newest{' '}
            {MAX_SAVED_SESSIONS} sessions and their attempts are retained.
          </p>
        </div>
      </section>
    )
  }
  return (
    <FeaturePlaceholder
      category="YOUR RECAP"
      title="Your practice recap"
      description="Finish a practice session to see how you did. There are no session results to show yet."
      actionLabel="Go to practice setup"
      actionTo="/practice/setup"
    />
  )
}
