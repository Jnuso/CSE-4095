import { cycleDialogFocus } from '../utils/cycleDialogFocus'
import MistakeStatistics from '../components/statistics/MistakeStatistics'
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { usePracticeStorage } from '../components/storage/PracticeStorageProvider'
import { DIFFICULTIES, OPERATIONS } from '../constants/practice'
import { accuracy, calculateStatistics } from '../services/statisticsService'
import { MAX_SAVED_SESSIONS, recentRecords } from '../services/storageService'
import type { OperationStatistics } from '../types/statistics'

function Metrics({ totals, label }: { totals: OperationStatistics; label: string }) {
  return (
    <dl className="summary-metrics" aria-label={label}>
      <div>
        <dt>Questions attempted</dt>
        <dd>{totals.attempted}</dd>
      </div>
      <div>
        <dt>Marked right</dt>
        <dd>{totals.correct}</dd>
      </div>
      <div>
        <dt>Marked wrong</dt>
        <dd>{totals.incorrect}</dd>
      </div>
      <div>
        <dt>Accuracy</dt>
        <dd>{accuracy(totals.attempted, totals.correct)}%</dd>
      </div>
    </dl>
  )
}
export default function StatisticsPage() {
  const { data, resetHistory } = usePracticeStorage()
  const [visible, setVisible] = useState(10)
  const [notice, setNotice] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  const records = recentRecords(data.records)
  const totals = calculateStatistics(records)
  function confirmReset() {
    const error = resetHistory()
    setNotice(
      error ?? 'Practice history and statistics have been reset. Your preferences are unchanged.',
    )
    if (!error) setVisible(10)
    dialog.current?.close()
  }
  return (
    <section className="statistics-page" aria-labelledby="statistics-title">
      <div className="feature-card">
        <p className="eyebrow">YOUR PROGRESS</p>
        <h1 id="statistics-title" tabIndex={-1}>
          Your statistics
        </h1>
        <p>
          Every question is a step forward. Results cover your newest {MAX_SAVED_SESSIONS} saved
          sessions on this browser, including unfinished sessions.
        </p>
        <p className="field-help">
          Accuracy uses how you marked each answer, rounded to the nearest whole percent. With no
          attempts, accuracy is 0%.
        </p>
        <Metrics totals={totals} label="Overall results" />
        {totals.attempted === 0 && (
          <p>No questions attempted yet. Start practicing to see your progress.</p>
        )}
        <Link className="button button-primary" to="/practice/setup">
          Start Practice
        </Link>
      </div>
      <section aria-labelledby="operation-title">
        <h2 id="operation-title">By operation</h2>
        <div className="statistics-grid">
          {OPERATIONS.map((option) => (
            <article className="feature-card" key={option.value} aria-label={option.label}>
              <h3>{option.label}</h3>
              <Metrics
                totals={totals.byOperation[option.value]}
                label={`${option.label} results`}
              />
            </article>
          ))}
        </div>
      </section>
      <section aria-labelledby="difficulty-title">
        <h2 id="difficulty-title">By difficulty</h2>
        <div className="statistics-grid">
          {DIFFICULTIES.map((option) => (
            <article
              className="feature-card"
              key={option.value}
              aria-label={`Level ${option.value}`}
            >
              <h3>
                Level {option.value}: {option.label}
              </h3>
              <Metrics
                totals={totals.byDifficulty[option.value]}
                label={`Level ${option.value} results`}
              />
            </article>
          ))}
        </div>
      </section>
      <MistakeStatistics data={data} />
      <section aria-labelledby="recent-title">
        <h2 id="recent-title">Recent sessions</h2>
        {records.length === 0 ? (
          <p>No sessions yet. Your practice history will appear here.</p>
        ) : (
          <ol className="session-history" aria-labelledby="recent-title">
            {records.slice(0, visible).map((record) => {
              const { session, attempts } = record
              const date = session.completedAt ?? attempts.at(-1)?.attemptedAt ?? session.startedAt
              const practiced = OPERATIONS.filter((option) =>
                attempts.some((attempt) => attempt.operation === option.value),
              )
                .map((option) => option.label)
                .join(', ')
              return (
                <li className="feature-card" key={session.id}>
                  <h3>
                    <time dateTime={date}>{new Date(date).toLocaleString()}</time>
                  </h3>
                  <p>
                    {session.completedAt ? 'Completed' : 'Incomplete'} - Level {session.difficulty}:{' '}
                    {DIFFICULTIES.find((option) => option.value === session.difficulty)?.label}
                  </p>
                  <p>Operations practiced: {practiced || 'None yet'}</p>
                  <Metrics totals={session} label="Session results" />
                </li>
              )
            })}
          </ol>
        )}
        {visible < records.length && (
          <button
            className="button button-secondary"
            type="button"
            onClick={() => setVisible((count) => count + 10)}
          >
            Show more sessions
          </button>
        )}
      </section>
      <section className="feature-card" aria-labelledby="reset-title">
        <h2 id="reset-title">Reset practice history</h2>
        <p>
          Erase saved sessions, answers, remembered mistakes, and statistics on this browser. Your
          preferences stay saved.
        </p>
        <button
          className="button button-secondary"
          type="button"
          onClick={() => dialog.current?.showModal()}
        >
          Reset Statistics
        </button>
        <p role="status">{notice}</p>
      </section>
      <dialog
        onKeyDown={cycleDialogFocus}
        ref={dialog}
        className="reset-dialog"
        aria-labelledby="reset-dialog-title"
        aria-describedby="reset-dialog-description"
      >
        <h2 id="reset-dialog-title">Erase practice history?</h2>
        <p id="reset-dialog-description">
          Are you sure you want to erase all practice history and statistics? Your preferences will
          stay saved. This cannot be undone.
        </p>
        <div className="summary-actions">
          <button
            className="button button-secondary"
            type="button"
            autoFocus
            onClick={() => dialog.current?.close()}
          >
            Keep my history
          </button>
          <button className="button button-primary" type="button" onClick={confirmReset}>
            Erase history
          </button>
        </div>
      </dialog>
    </section>
  )
}
