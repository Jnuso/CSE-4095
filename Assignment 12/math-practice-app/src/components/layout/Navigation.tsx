import { Link, useLocation } from 'react-router'

const items = [
  { label: 'Home', to: '/', paths: ['/'] },
  {
    label: 'Practice',
    to: '/practice/setup',
    paths: ['/practice/setup', '/practice/session', '/practice/summary'],
  },
  { label: 'Statistics', to: '/statistics', paths: ['/statistics'] },
  { label: 'Settings', to: '/settings', paths: ['/settings'] },
]

export default function Navigation() {
  const { pathname } = useLocation()

  return (
    <nav className="navigation" aria-label="Main navigation">
      {items.map(({ label, to, paths }) => {
        const active = paths.includes(pathname)
        return (
          <Link
            key={to}
            to={to}
            className={`navigation-link${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
