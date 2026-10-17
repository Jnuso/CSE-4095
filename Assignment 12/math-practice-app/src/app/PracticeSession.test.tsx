import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import AppRoutes from './AppRoutes'

function setup(length: 5 | 'continuous' = 5) {
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: '/practice/session',
          state: {
            practiceConfig: { operations: ['addition'], difficulty: 1, sessionLength: length },
          },
        },
      ]}
    >
      <AppRoutes />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

async function answer(user: ReturnType<typeof userEvent.setup>, right: boolean) {
  await user.click(
    within(screen.getByRole('group', { name: 'Answer choices' })).getAllByRole('button')[0],
  )
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  await user.click(
    screen.getByRole('button', { name: right ? 'I Got It Right' : 'I Got It Wrong' }),
  )
}

describe('practice session page', () => {
  it('starts a real session, counts only reports, and resets/focuses the next card', async () => {
    const user = setup()
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Session progress' })).toHaveAttribute(
      'value',
      '0',
    )
    const choices = screen.getByRole('group', { name: 'Answer choices' })
    await user.click(within(choices).getAllByRole('button')[0])
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    expect(screen.getByRole('status', { name: 'Session totals' })).toHaveTextContent('Completed: 0')
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }))
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Session totals' })).toHaveTextContent(
      'Completed: 1 · Right: 0 · Wrong: 1',
    )
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '1')
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
    expect(screen.getByRole('heading', { name: /= \?/ })).toHaveFocus()
    for (const choice of within(screen.getByRole('group', { name: 'Answer choices' })).getAllByRole(
      'button',
    ))
      expect(choice).toHaveAttribute('aria-pressed', 'false')
  })
  it('completes five questions with the correct totals and removes the active card', async () => {
    const user = setup()
    for (let index = 0; index < 5; index += 1) await answer(user, index < 3)
    expect(screen.getByRole('heading', { name: 'Session complete' })).toHaveFocus()
    expect(screen.getByRole('status', { name: 'Session totals' })).toHaveTextContent(
      'Completed: 5 · Right: 3 · Wrong: 2',
    )
    expect(screen.queryByRole('button', { name: 'Flip Card' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'End Session' })).not.toBeInTheDocument()
    expect(screen.getByText('Questions attempted')).toBeInTheDocument()
  })
  it('supports canceling and confirming an early end without counting the current card', async () => {
    const user = setup('continuous')
    const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(false)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByText('Question 1')).toBeInTheDocument()
    await answer(user, true)
    await user.click(screen.getByRole('button', { name: 'End Session' }))
    expect(screen.getByText('Question 2')).toBeInTheDocument()
    confirmation.mockReturnValue(true)
    await user.click(screen.getByRole('button', { name: 'End Session' }))
    expect(screen.getByRole('heading', { name: 'Session complete' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Session totals' })).toHaveTextContent(
      'Completed: 1 · Right: 1 · Wrong: 0',
    )
    expect(confirmation).toHaveBeenCalledTimes(2)
  })
})
