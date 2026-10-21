import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

afterEach(() => cleanup())

// jsdom lacks native dialogs. Real modal focus/inert behavior is covered in browser checks.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
    this.querySelector<HTMLElement>('[autofocus]')?.focus()
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
}
