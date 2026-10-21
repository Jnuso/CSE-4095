import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from '../test/MemoryRouter'
import { describe, expect, it } from 'vitest'
import AppRoutes from './AppRoutes'

function renderRoute(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('Phase 2 pages and navigation', () => {
  it.each([
    ['/', 'Big ideas start with small steps.'],
    ['/practice/setup', 'Choose your practice'],
    ['/practice/session', 'Choose your practice'],
    ['/practice/summary', 'Your practice recap'],
    ['/statistics', 'Your statistics'],
    ['/settings', 'Make it your own'],
    ['/not-a-real-page', "Let's find your way back."],
  ])('renders %s within the shared page layout', async (path, heading) => {
    renderRoute(path)
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
    expect(document.title).toBe(path === '/' ? 'Math Practice' : `${heading} | Math Practice`)
  })

  it.each([
    ['Start Practice', 'Choose your practice'],
    ['View Statistics', 'Your statistics'],
    ['Settings', 'Make it your own'],
  ])('opens the correct page from the home action %s', async (action, heading) => {
    const user = userEvent.setup()
    renderRoute()
    await user.click(within(screen.getByRole('main')).getByRole('link', { name: action }))
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()
  })

  it('supports keyboard navigation, highlights the destination, and preserves the shared header', async () => {
    const user = userEvent.setup()
    renderRoute()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Math Practice home' })).toHaveFocus()
    await user.tab()
    expect(within(screen.getByRole('navigation')).getByRole('link', { name: 'Home' })).toHaveFocus()
    await user.tab()
    expect(
      within(screen.getByRole('navigation')).getByRole('link', { name: 'Practice' }),
    ).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { level: 1, name: 'Choose your practice' })).toHaveFocus()
    expect(
      within(screen.getByRole('navigation')).getByRole('link', { name: 'Practice' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('recovers from an unknown route using the return-home link', async () => {
    const user = userEvent.setup()
    renderRoute('/not-a-real-page')
    await user.click(screen.getByRole('link', { name: 'Back home' }))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Big ideas start with small steps.' }),
    ).toBeInTheDocument()
  })
})
