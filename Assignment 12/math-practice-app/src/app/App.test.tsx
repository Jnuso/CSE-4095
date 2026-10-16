import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('Phase 1 application foundation', () => {
  it('shows the custom math welcome screen with an accessible greeting action', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { level: 1, name: /big ideas start with small steps/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Say hello' })).toBeEnabled()
    expect(screen.getByRole('status')).toHaveTextContent('Ready when you are.')
  })

  it('responds to the learner activating the greeting button', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Say hello' }))
    expect(screen.getByRole('status')).toHaveTextContent("Hi, mathematician! Let's learn together.")
  })
})
