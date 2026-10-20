import { useId, useState } from 'react'
import { DIFFICULTIES } from '../../constants/practice'
import type { MistakePattern } from '../../types/mistake'
import type { SavedData } from '../../services/storageService'
import { calculateMistakeStatistics } from '../../services/mistakeStatistics'

const symbols = { addition: '+', subtraction: '−', multiplication: '×', division: '÷' }
function fact(pattern: MistakePattern): string {
  return `${pattern.firstOperand} ${symbols[pattern.operation]} ${pattern.secondOperand} = ${pattern.correctAnswer}`
}
function PatternDetails({ pattern, threshold }: { pattern: MistakePattern; threshold: number }) {
  const progressId = useId()
  return (
    <article
      className="feature-card mistake-detail"
      aria-label={`${fact(pattern)}, level ${pattern.difficulty}`}
    >
      <h4>{fact(pattern)}</h4>
      <p>
        Level {pattern.difficulty}:{' '}
        {DIFFICULTIES.find((option) => option.value === pattern.difficulty)?.label}
      </p>
      <dl className="configuration-summary">
        <div>
          <dt>Times marked wrong</dt>
          <dd>{pattern.incorrectCount}</dd>
        </div>
        <div>
          <dt>Latest miss</dt>
          <dd>
            <time dateTime={pattern.lastIncorrectAt}>
              {new Date(pattern.lastIncorrectAt).toLocaleString()}
            </time>
          </dd>
        </div>
      </dl>
      <label htmlFor={progressId}>
        Mastery progress: {pattern.similarCorrectCount} consecutive review answers marked right
        (goal: {threshold})
      </label>
      <progress
        id={progressId}
        value={Math.min(pattern.similarCorrectCount, threshold)}
        max={threshold}
      />
      <p className="field-help">
        {pattern.mastered
          ? 'Mastered. Another miss on this original fact will bring it back for review.'
          : 'Active. A wrong review answer resets this progress.'}
      </p>
    </article>
  )
}

export default function MistakeStatistics({ data }: { data: SavedData }) {
  const results = calculateMistakeStatistics(data)
  const [view, setView] = useState<'active' | 'mastered'>('active')
  const [visible, setVisible] = useState(10)
  const patterns = results[view]
  return (
    <section aria-labelledby="mistake-statistics-title" className="mistake-statistics">
      <div className="feature-card">
        <h2 id="mistake-statistics-title">Mistakes and review</h2>
        <p>
          Remembered facts and available review answers on this browser, including unfinished
          sessions. These can outlast the newest 100 session details above. Older review answers
          without a saved journal count only while their session details remain.
        </p>
        <dl className="summary-metrics" aria-label="Mistake and review totals">
          <div>
            <dt>Active mistake patterns</dt>
            <dd>{results.active.length}</dd>
          </div>
          <div>
            <dt>Mastered mistake patterns</dt>
            <dd>{results.mastered.length}</dd>
          </div>
          <div>
            <dt>Similar questions practiced</dt>
            <dd>{results.reviewAttempted}</dd>
          </div>
          <div>
            <dt>Review questions marked right</dt>
            <dd>{results.reviewCorrect}</dd>
          </div>
        </dl>
        <p className="field-help">
          Outcomes use how you marked each answer. Frequently missed areas include active and
          mastered facts. A wrong related review answer belongs to its original fact and operation.
        </p>
        {results.active.length + results.mastered.length === 0 ? (
          <p>
            No remembered mistakes yet. Mark a practice answer wrong to start tracking facts to
            strengthen.
          </p>
        ) : (
          <>
            <h3>Most frequently missed operation</h3>
            <p>
              {results.mostMissedOperations.map((op) => op.label).join(', ')} —{' '}
              {results.mostMissedOperations[0]?.incorrectCount} misses
              {results.mostMissedOperations.length > 1 ? ' each (tied)' : ''}.
            </p>
            <h3>Most frequently missed facts</h3>
            <ul className="frequent-facts" aria-label="Most frequently missed facts">
              {results.mostMissedFacts.map((pattern) => (
                <li key={pattern.id}>
                  {fact(pattern)} · Level {pattern.difficulty} · {pattern.incorrectCount} misses
                  {results.mostMissedFacts.length > 1 ? ' (tied)' : ''}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <div>
        <h3>Mistake details</h3>
        <fieldset className="setup-fieldset">
          <legend>Choose which mistakes to view</legend>
          <div className="preference-options">
            <label className="choice-card">
              <input
                type="radio"
                name="mistake-view"
                checked={view === 'active'}
                onChange={() => {
                  setView('active')
                  setVisible(10)
                }}
              />
              Active mistakes ({results.active.length})
            </label>
            <label className="choice-card">
              <input
                type="radio"
                name="mistake-view"
                checked={view === 'mastered'}
                onChange={() => {
                  setView('mastered')
                  setVisible(10)
                }}
              />
              Mastered mistakes ({results.mastered.length})
            </label>
          </div>
        </fieldset>
        <p className="field-help" aria-live="polite">
          Showing {Math.min(visible, patterns.length)} of {patterns.length} {view} patterns, sorted
          by times marked wrong, then latest miss. All highest-count ties appear above.
        </p>
        {patterns.length === 0 ? (
          <p>
            {view === 'active'
              ? 'No active mistakes to strengthen. Any mastered facts are available in the mastered view.'
              : 'No mastered patterns yet. Correct review answers build mastery.'}
          </p>
        ) : (
          <ol
            className="mistake-history"
            aria-label={`${view === 'active' ? 'Active' : 'Mastered'} mistake details`}
          >
            {patterns.slice(0, visible).map((pattern) => (
              <li key={pattern.id}>
                <PatternDetails pattern={pattern} threshold={data.settings.masteryThreshold} />
              </li>
            ))}
          </ol>
        )}
        {visible < patterns.length && (
          <button
            className="button button-secondary"
            type="button"
            onClick={() => setVisible((count) => count + 10)}
          >
            Show more mistakes
          </button>
        )}
      </div>
    </section>
  )
}
