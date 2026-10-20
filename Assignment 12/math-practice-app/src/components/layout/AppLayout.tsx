import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import Header from './Header'
import PageContainer from './PageContainer'
import StorageNotice from '../storage/StorageNotice'
import ErrorBoundary from '../common/ErrorBoundary'

export default function AppLayout() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const previousPath = useRef(pathname)

  useEffect(() => {
    const heading = mainRef.current?.querySelector('h1')
    document.title =
      pathname === '/' ? 'Math Practice' : `${heading?.textContent ?? 'Page'} | Math Practice`
    if (previousPath.current !== pathname) heading?.focus()
    previousPath.current = pathname
  }, [pathname])

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          mainRef.current?.focus()
          mainRef.current?.scrollIntoView()
        }}
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="page-content" tabIndex={-1} ref={mainRef}>
        <PageContainer>
          <StorageNotice />
          <ErrorBoundary
            resetKey={pathname}
            onRecover={() => {
              const heading = mainRef.current?.querySelector('h1')
              document.title =
                pathname === '/'
                  ? 'Math Practice'
                  : `${heading?.textContent ?? 'Page'} | Math Practice`
              heading?.focus()
            }}
          >
            <Outlet />
          </ErrorBoundary>
        </PageContainer>
      </main>
      <footer className="site-footer">
        <PageContainer>A little practice goes a long way.</PageContainer>
      </footer>
    </div>
  )
}
