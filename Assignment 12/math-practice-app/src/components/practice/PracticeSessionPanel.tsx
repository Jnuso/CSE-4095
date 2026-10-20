import { chooseFeedback } from '../../services/practiceFeedback'
import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router'
import type { PracticeConfiguration } from '../../types/practice'
import {
  endSession,
  recordResult,
  retryQuestion,
  startSession,
} from '../../services/practiceSession'
import QuestionCard, { type CardResult } from './QuestionCard'
import { usePracticeStorage } from '../storage/PracticeStorageProvider'

export default function PracticeSessionPanel({
  configuration,
}: {
  configuration: PracticeConfiguration
}) {
  const { data, saveSession, saveSettings } = usePracticeStorage()
  const [state, setState] = useState(() =>
    startSession(configuration, undefined, data.mistakePatterns, data.settings.masteryThreshold),
  )
  const [feedback, setFeedback] = useState('')
  const latest = useRef(state)
  const animationEnabled = data.settings.cardAnimationEnabled
  useEffect(() => {
    saveSession({ session: state.session, attempts: state.attempts })
  }, [state.session, state.attempts, saveSession])
  function report(result: CardResult) {
    const current = latest.current
    const activeIds = new Set(
      (data.mistakePatterns ?? []).filter((p) => !p.mastered).map((p) => p.id),
    )
    const next = recordResult(
      current.reviewPatterns
        ? {
            ...current,
            masteryThreshold: data.settings.masteryThreshold,
            reviewPatterns: current.reviewPatterns
              .filter((p) => activeIds.has(p.id))
              .map((p) => data.mistakePatterns?.find((saved) => saved.id === p.id) ?? p),
          }
        : current,
      result,
    )
    if (next !== current) setFeedback(chooseFeedback(result.selfReportedCorrect))
    latest.current = next
    setState(next)
  }

  function finish() {
    if (
      !window.confirm(
        'End this session? Completed answers will appear in your recap. The current unreported question will not count.',
      )
    )
      return
    const next = endSession(latest.current)
    latest.current = next
    setState(next)
  }

  function retry() {
    const next = retryQuestion(latest.current)
    latest.current = next
    setState(next)
  }

  const { session } = state
  if (!state.isActive)
    return (
      <Navigate
        to="/practice/summary"
        replace
        state={{
          completedSession: { session, attempts: state.attempts },
          practiceFeedback: feedback,
        }}
      />
    )
  return (
    <div className="session-panel">
      {configuration.reviewMode === 'mistake-review' && (
        <p className="field-help">
          Mistake review: related questions help you strengthen remembered facts. The session ends
          when its question limit is reached or all selected mistakes are mastered.
        </p>
      )}
      <p className="preview-note">
        Reported answers are saved in this browser when storage is available. Refreshing starts a
        new session.
      </p>
      <p
        className="practice-feedback"
        role="status"
        aria-label="Practice encouragement"
        aria-atomic="true"
      >
        {data.settings.feedbackEnabled !== false ? feedback : ''}
      </p>
      <p className="session-totals" role="status" aria-label="Session totals" aria-atomic="true">
        Completed: {session.attempted} · Right: {session.correct} · Wrong: {session.incorrect}
      </p>
      {
        <>
          {session.sessionLength !== 'continuous' && (
            <div className="session-progress">
              <label htmlFor="session-progress">
                Completed {session.attempted} of {session.sessionLength}
              </label>
              <progress
                id="session-progress"
                aria-label="Session progress"
                value={session.attempted}
                max={session.sessionLength}
              />
            </div>
          )}
          <label className="animation-setting">
            <input
              type="checkbox"
              checked={animationEnabled}
              onChange={(event) => {
                saveSettings({ cardAnimationEnabled: event.target.checked })
              }}
            />{' '}
            Animate card flips
          </label>
          {state.question ? (
            <QuestionCard
              question={state.question}
              questionNumber={state.questionIndex + 1}
              totalQuestions={
                session.sessionLength === 'continuous' ? undefined : session.sessionLength
              }
              animationEnabled={animationEnabled}
              soundEnabled={data.settings.soundEffectsEnabled}
              showExplanations={data.settings.showExplanations}
              focusOnMount={state.questionIndex > 0}
              onResult={report}
            />
          ) : (
            <div role="alert">
              <p>{state.error}</p>
              <button type="button" className="button button-primary" onClick={retry}>
                Try again
              </button>
            </div>
          )}
          <button type="button" className="button button-secondary" onClick={finish}>
            End Session
          </button>
        </>
      }
    </div>
  )
}
