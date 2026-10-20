import type { KeyboardEvent } from 'react'

// Keep Tab and Shift+Tab on the modal's controls, including at either boundary.
export function cycleDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return
  const controls = [
    ...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
  ]
  const first = controls[0]
  const last = controls.at(-1)
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
