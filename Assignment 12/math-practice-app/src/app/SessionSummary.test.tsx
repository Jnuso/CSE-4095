import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { completedFixture } from '../test/summaryFixture'
import AppRoutes from './AppRoutes'

function setup(state: unknown = { completedSession: completedFixture() }) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/practice/summary', state }]}>
      <AppRoutes />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

describe('session summary page', () => {
  it('displays results, actual operations, difficulty and review count with honest actions', () => {
    setup()
    for (const [label, value] of [
      ['Questions attempted', '3'],
      ['Marked right', '2'],
      ['Marked wrong', '1'],
      ['Accuracy', '67%'],
      ['Operations practiced', 'Addition, Subtraction, Multiplication'],
      ['Difficulty', 'Easy'],
      ['Mistake-review questions completed', '1'],
    ]) {
      expect(screen.getByText(label).parentElement).toHaveTextContent(value)
    }
    expect(screen.getByRole('button', { name: 'Practice Mistakes' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Practice Mistakes' })).toHaveAccessibleDescription(
      'Practice Mistakes will be available when mistake review is added.',
    )
    expect(screen.getByText(/Accuracy is based on how you marked/)).toBeInTheDocument()
  })
  it('starts a new session with the same selected configuration and zero totals', async () => {
    const user = setup()
    await user.click(screen.getByRole('link', { name: 'Practice Again' }))
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
    expect(screen.getByText('Addition, Subtraction, Multiplication, Division')).toBeInTheDocument()
    expect(screen.getByText('Easy')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Session totals' })).toHaveTextContent(
      'Completed: 0 · Right: 0 · Wrong: 0',
    )
  })
  it('restores configuration when changing settings', async () => {
    const user = setup()
    await user.click(screen.getByRole('link', { name: 'Change Settings' }))
    expect(screen.getByRole('heading', { name: 'Choose your practice' })).toHaveFocus()
    for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).toBeChecked()
    expect(screen.getByRole('radio', { name: /^Easy/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: '5 questions' })).toBeChecked()
  })
  it.each([
    ['View Statistics', 'Your statistics'],
    ['Return Home', 'Big ideas start with small steps.'],
  ])('navigates through %s', async (action, heading) => {
    const user = setup()
    await user.click(screen.getByRole('link', { name: action }))
    expect(screen.getByRole('heading', { name: heading })).toHaveFocus()
  })
  it('shows zero-attempt results without NaN or invented practiced operations', () => {
    const completed = completedFixture()
    completed.attempts = []
    Object.assign(completed.session, { attempted: 0, correct: 0, incorrect: 0 })
    setup({ completedSession: completed })
    expect(screen.getByText('Accuracy').parentElement).toHaveTextContent('0%')
    expect(screen.getByText('Operations practiced').parentElement).toHaveTextContent('None yet')
    expect(screen.getByText(/No questions attempted this time/)).toBeInTheDocument()
  })
  it.each([null, {}, { completedSession: { session: {}, attempts: [] } }])(
    'offers setup when summary data is missing or invalid %j',
    (state) => {
      setup(state)
      expect(screen.getByRole('link', { name: 'Go to practice setup' })).toHaveAttribute(
        'href',
        '/practice/setup',
      )
      expect(screen.queryByRole('link', { name: 'Practice Again' })).not.toBeInTheDocument()
    },
  )
})
