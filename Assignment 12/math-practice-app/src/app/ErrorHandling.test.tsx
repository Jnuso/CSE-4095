import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { expect, it, vi } from 'vitest'
import AppRoutes from './AppRoutes'
import ErrorBoundary from '../components/common/ErrorBoundary'

const crash = vi.hoisted(() => ({ enabled: false }))
vi.mock('../pages/StatisticsPage', () => ({
  default: function StatisticsPage() {
    if (crash.enabled) throw new Error('private technical details')
    return <h1 tabIndex={-1}>Statistics recovered</h1>
  },
}))

it('explains a missing session and offers setup and a safe home link', async () => {
  render(
    <MemoryRouter initialEntries={['/practice/session']}>
      <AppRoutes />
    </MemoryRouter>,
  )
  expect(await screen.findByRole('heading', { name: 'Choose your practice' })).toBeVisible()
  expect(screen.getByRole('alert')).toHaveTextContent('There is no practice session to open')
  await userEvent.click(screen.getByRole('link', { name: 'Back home' }))
  expect(screen.getByRole('heading', { name: 'Big ideas start with small steps.' })).toBeVisible()
})

it('catches a render failure without exposing exception details and allows retry', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  let broken = true
  function Page() {
    if (broken) throw new Error('private technical stack details')
    return <p>Recovered page</p>
  }
  render(
    <MemoryRouter>
      <ErrorBoundary>
        <Page />
      </ErrorBoundary>
    </MemoryRouter>,
  )
  expect(screen.getByRole('alert')).toHaveTextContent('Your saved practice has not been erased')
  expect(screen.queryByText(/private technical stack details/)).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back home' })).toHaveAttribute('href', '/')
  broken = false
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(screen.getByText('Recovered page')).toBeVisible()
})

it('keeps navigation mounted and restores heading focus through a route crash, retry and Home', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <AppRoutes />
    </MemoryRouter>,
  )
  crash.enabled = true
  await user.click(screen.getByRole('link', { name: 'Statistics' }))
  expect(screen.getByRole('banner')).toBeVisible()
  expect(screen.getByRole('link', { name: 'Skip to content' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Let’s try a fresh start' })).toHaveFocus()
  crash.enabled = false
  await user.click(screen.getByRole('button', { name: 'Try again' }))
  expect(screen.getByRole('heading', { name: 'Statistics recovered' })).toHaveFocus()
  expect(document.title).toBe('Statistics recovered | Math Practice')
  await user.click(screen.getByRole('link', { name: 'Home' }))
  crash.enabled = true
  await user.click(screen.getByRole('link', { name: 'Statistics' }))
  await user.click(screen.getByRole('link', { name: 'Back home' }))
  expect(screen.getByRole('heading', { name: 'Big ideas start with small steps.' })).toHaveFocus()
  crash.enabled = false
})
