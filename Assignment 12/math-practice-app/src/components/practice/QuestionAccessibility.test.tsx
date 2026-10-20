import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { Question } from '../../types/question'
import QuestionCard from './QuestionCard'

const question: Question = {
  id: 'q1',
  operation: 'addition',
  firstOperand: 2,
  secondOperand: 3,
  correctAnswer: 5,
  choices: [4, 5, 6, 7],
  difficulty: 1,
  displayText: '2 + 3 = ?',
  source: 'regular',
}
function mount() {
  return render(
    <>
      <input aria-label="Outside input" />
      <QuestionCard question={question} questionNumber={1} totalQuestions={5} />
    </>,
  )
}
describe('card accessibility', () => {
  it('maps four scoped plain number keys to choices, pressed state and focus', () => {
    mount()
    const card = screen.getByRole('region', { name: 'Math question card' })
    const buttons = within(card).getAllByRole('button', { name: /^Answer / })
    for (let index = 0; index < 4; index++) {
      expect(buttons[index]).toHaveAttribute('aria-keyshortcuts', String(index + 1))
      fireEvent.keyDown(buttons[0], { key: String(index + 1) })
      expect(buttons[index]).toHaveFocus()
      expect(buttons[index]).toHaveAttribute('aria-pressed', 'true')
      expect(buttons.filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(1)
    }
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeEnabled()
  })
  it('does not capture number keys outside the card or in editable descendants', () => {
    mount()
    const card = screen.getByRole('region', { name: 'Math question card' })
    const external = screen.getByRole('textbox', { name: 'Outside input' })
    expect(fireEvent.keyDown(external, { key: '1' })).toBe(true)
    for (const tag of ['input', 'textarea', 'select']) {
      const control = document.createElement(tag)
      card.appendChild(control)
      expect(fireEvent.keyDown(control, { key: '1' })).toBe(true)
      control.remove()
    }
    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'true')
    const child = document.createElement('span')
    editable.appendChild(child)
    card.appendChild(editable)
    expect(fireEvent.keyDown(child, { key: '2' })).toBe(true)
    editable.remove()
    const custom = document.createElement('div')
    custom.setAttribute('role', 'textbox')
    card.appendChild(custom)
    expect(fireEvent.keyDown(custom, { key: '3' })).toBe(true)
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
  })
  it.each([
    { ctrlKey: true },
    { metaKey: true },
    { altKey: true },
    { shiftKey: true },
    { repeat: true },
    { isComposing: true },
  ])('leaves modified, repeated or composing keys alone: %j', (modifiers) => {
    mount()
    const button = screen.getByRole('button', { name: 'Answer 4' })
    expect(fireEvent.keyDown(button, { key: '1', ...modifiers })).toBe(true)
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })
  it('ignores unmapped keys and cannot select after reveal', async () => {
    mount()
    const button = screen.getByRole('button', { name: 'Answer 4' })
    expect(fireEvent.keyDown(button, { key: '5' })).toBe(true)
    fireEvent.keyDown(button, { key: '2' })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Flip Card' }))
    const answer = screen.getByRole('heading', { name: 'Correct answer: 5' })
    expect(answer).toHaveFocus()
    expect(fireEvent.keyDown(answer, { key: '1' })).toBe(true)
    expect(screen.getByText('Your answer:').parentElement).toHaveTextContent('5')
  })
  it('mounts an initial live announcement, then uses focused question/progress descriptions', () => {
    const { container, rerender } = render(
      <QuestionCard question={question} questionNumber={1} totalQuestions={5} />,
    )
    const announcement = container.querySelector('[aria-live="polite"]')!
    expect(announcement).toHaveTextContent('Question 1 of 5. 2 + 3 = ?')
    expect(announcement).toHaveAttribute('aria-atomic', 'true')
    rerender(
      <QuestionCard
        question={{ ...question, id: 'q2' }}
        questionNumber={2}
        totalQuestions={5}
        focusOnMount
      />,
    )
    const heading = screen.getByRole('heading', { name: '2 + 3 = ?' })
    expect(heading).toHaveFocus()
    expect(heading).toHaveAccessibleDescription('Question 2 of 5')
    expect(container.querySelector('[aria-live="polite"]')).toBe(announcement)
    expect(announcement).toHaveTextContent('')
  })
})
