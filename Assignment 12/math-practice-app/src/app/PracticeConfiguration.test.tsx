import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import AppRoutes from './AppRoutes'

function setup(state?: unknown, path = '/practice/setup') {
  render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <AppRoutes />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

describe('Practice configuration', () => {
  it('provides all options with addition, Beginner, and 10 questions selected by default', () => {
    setup()
    expect(screen.getAllByRole('checkbox')).toHaveLength(4)
    expect(screen.getAllByRole('radio')).toHaveLength(10)
    expect(screen.getByRole('radio', { name: 'Regular practice' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Mistake review' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked()
    expect(screen.getByRole('radio', { name: /^Beginner/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: '10 questions' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeEnabled()
  })

  it('supports mixing operations and selecting all without duplicate selections', async () => {
    const user = setup()
    await user.click(screen.getByRole('checkbox', { name: 'Multiplication' }))
    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Multiplication' })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Select all operations' }))
    await user.click(screen.getByRole('button', { name: 'Select all operations' }))
    for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    expect(screen.getByText('Addition, Subtraction, Multiplication, Division')).toBeInTheDocument()
  })

  it('disables starting with no operations and recovers when one is selected', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Choose at least one operation to start.')
    await user.click(screen.getByRole('checkbox', { name: 'Division' }))
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeEnabled()
  })

  it('allows exactly one difficulty and session length at a time', async () => {
    const user = setup()
    await user.click(screen.getByRole('radio', { name: /^Intermediate/ }))
    expect(screen.getByRole('radio', { name: /^Beginner/ })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: /^Intermediate/ })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: 'Continuous practice' }))
    expect(screen.getByRole('radio', { name: '10 questions' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Continuous practice' })).toBeChecked()
  })

  it('passes the chosen operations, difficulty, and length to the session and back for editing', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    await user.click(screen.getByRole('checkbox', { name: 'Multiplication' }))
    await user.click(screen.getByRole('checkbox', { name: 'Division' }))
    await user.click(screen.getByRole('radio', { name: /^Advanced/ }))
    await user.click(screen.getByRole('radio', { name: '20 questions' }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    expect(screen.getByRole('heading', { name: 'Your practice space' })).toBeInTheDocument()
    expect(screen.getByText('Multiplication, Division')).toBeInTheDocument()
    expect(screen.getByText('Advanced')).toBeInTheDocument()
    expect(screen.getByText('20 questions')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Edit choices' }))
    expect(screen.getByRole('checkbox', { name: 'Addition' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Multiplication' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Division' })).toBeChecked()
    expect(screen.getByRole('radio', { name: /^Advanced/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: '20 questions' })).toBeChecked()
  })

  it('passes continuous practice as a distinct session-length option', async () => {
    const user = setup()
    await user.click(screen.getByRole('radio', { name: 'Continuous practice' }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    expect(screen.getByText('Continuous practice')).toBeInTheDocument()
  })

  it('rejects invalid incoming session configuration and redirects to setup', () => {
    setup(
      {
        practiceConfig: { operations: ['addition', 'addition'], difficulty: 99, sessionLength: 0 },
      },
      '/practice/session',
    )
    expect(screen.getByRole('heading', { name: 'Choose your practice' })).toBeInTheDocument()
    expect(screen.queryByText('Edit choices')).not.toBeInTheDocument()
  })
})
