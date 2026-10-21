import ErrorMessage from '../common/ErrorMessage'
import { chooseFeedback } from '../../services/practiceFeedback'
import { useCallback, useEffect, useRef, useState } from 'react'
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
import {
  closeActiveSession,
  saveActiveSession,
  type ActiveSnapshot,
  type CardSnapshot,
} from '../../services/activeSession'
import SessionNavigationGuard from './SessionNavigationGuard'
import { cycleDialogFocus } from '../../utils/cycleDialogFocus'

export default function PracticeSessionPanel({
  configuration,
  recovery,
  entryKey,
}: {
  configuration: PracticeConfiguration
  recovery: ActiveSnapshot | null
  entryKey: string
}) {
  const { data, saveSession, saveSettings } = usePracticeStorage()
  const [state, setState] = useState(
    () =>
      recovery?.state ??
      startSession(
        configuration,
        undefined,
        data.mistakePatterns,
        data.settings.masteryThreshold,
        data.historyResetAt,
      ),
  )
  const [card, setCard] = useState<CardSnapshot | null>(recovery?.card ?? null)
  const recoveryNotice = useRef<HTMLParagraphElement>(null)
  const endDialog = useRef<HTMLDialogElement>(null)
  const keepPracticing = useRef<HTMLButtonElement>(null)
  const updateCard = useCallback(
    (next: CardSnapshot) =>
      setCard((old) =>
        old?.questionId === next.questionId &&
        old.selectedAnswer === next.selectedAnswer &&
        old.flipped === next.flipped
          ? old
          : next,
      ),
    [],
  )
  const [feedback, setFeedback] = useState('')
  const latest = useRef(state)
  const animationEnabled = data.settings.cardAnimationEnabled
  useEffect(() => {
    saveSession({ session: state.session, attempts: state.attempts })
  }, [state.session, state.attempts, saveSession])
  useEffect(() => {
    if (!state.isActive) {
      closeActiveSession(entryKey)
      return
    }
    const error = saveActiveSession({
      version: 1,
      entryKey,
      state,
      card: card?.questionId === state.question?.id ? card : null,
    })
    if (recoveryNotice.current) {
      recoveryNotice.current.textContent = error ?? ''
      recoveryNotice.current.hidden = !error
    }
  }, [state, card, entryKey])
  useEffect(() => {
    if (!state.isActive) return
    function warn(event: BeforeUnloadEvent) {
      if (!latest.current.isActive) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [state.isActive])
  const erased = Date.parse(state.session.startedAt) <= (data.historyResetAt ?? 0)
  useEffect(() => {
    if (erased) closeActiveSession(entryKey)
  }, [erased, entryKey])
  function leave() {
    const next = endSession(latest.current)
    latest.current = next
    saveSession({ session: next.session, attempts: next.attempts })
    closeActiveSession(entryKey)
  }
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
    if (!next.isActive) closeActiveSession(entryKey)
    setState(next)
  }

  function finish() {
    endDialog.current?.close()
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
  if (erased) return <Navigate to="/practice/setup" replace state={{ sessionMissing: true }} />
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
      <SessionNavigationGuard active={state.isActive && !erased} onLeave={leave} />
      {configuration.reviewMode === 'mistake-review' && (
        <p className="field-help">
          Mistake review: related questions help you strengthen remembered facts. The session ends
          when its question limit is reached or all selected mistakes are mastered.
        </p>
      )}
      <p className="preview-note">
        Reported answers are saved in this browser when storage is available. Refreshing restores
        this session in this tab.
      </p>
      <p role="status" aria-label="Session recovery notice" ref={recoveryNotice} hidden />
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
              initialCard={card}
              onCardChange={updateCard}
            />
          ) : (
            <ErrorMessage title="Let’s try another question" onRetry={retry}>
              <p>{state.error}</p>
            </ErrorMessage>
          )}
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              endDialog.current?.showModal()
              keepPracticing.current?.focus()
            }}
          >
            End Session
          </button>
          <dialog
            ref={endDialog}
            className="reset-dialog"
            aria-labelledby="end-session-title"
            aria-describedby="end-session-description"
            onKeyDown={cycleDialogFocus}
          >
            <h2 id="end-session-title">End this session?</h2>
            <p id="end-session-description">
              Completed answers will appear in your recap. The current unreported question will not
              count.
            </p>
            <div className="summary-actions">
              <button
                type="button"
                className="button button-secondary"
                autoFocus
                ref={keepPracticing}
                onClick={() => endDialog.current?.close()}
              >
                Keep practicing
              </button>
              <button type="button" className="button button-primary" onClick={finish}>
                End session and view recap
              </button>
            </div>
          </dialog>
        </>
      }
    </div>
  )
}
