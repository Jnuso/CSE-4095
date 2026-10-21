import { useEffect, useRef } from 'react'
import { useBlocker } from 'react-router'
import { cycleDialogFocus } from '../../utils/cycleDialogFocus'

export default function SessionNavigationGuard({
  active,
  onLeave,
}: {
  active: boolean
  onLeave: () => void
}) {
  const blocker = useBlocker(active)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (blocker.state === 'blocked') dialog.current?.showModal()
    else if (dialog.current?.open) dialog.current.close()
  }, [blocker.state])
  return (
    <dialog
      ref={dialog}
      className="reset-dialog"
      aria-labelledby="leave-session-title"
      aria-describedby="leave-session-description"
      onKeyDown={cycleDialogFocus}
      onCancel={(event) => {
        event.preventDefault()
        if (blocker.state === 'blocked') blocker.reset()
      }}
    >
      <h2 id="leave-session-title">Leave this session?</h2>
      <p id="leave-session-description">
        You can keep practicing, or end the session and leave. Reported answers stay in your
        history; the current unreported question will not count.
      </p>
      <div className="summary-actions">
        <button
          type="button"
          autoFocus
          className="button button-secondary"
          onClick={() => {
            if (blocker.state === 'blocked') blocker.reset()
          }}
        >
          Keep practicing
        </button>
        <button
          type="button"
          className="button button-primary"
          onClick={() => {
            if (blocker.state !== 'blocked') return
            onLeave()
            blocker.proceed()
          }}
        >
          End session and leave
        </button>
      </div>
    </dialog>
  )
}
