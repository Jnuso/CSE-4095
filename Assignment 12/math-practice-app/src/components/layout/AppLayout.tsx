import { Suspense, useEffect, useRef } from 'react'
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
    const changed = previousPath.current !== pathname
    previousPath.current = pathname
    function updateHeading() {
      const heading = mainRef.current?.querySelector('h1')
      if (!heading) return false
      document.title = pathname === '/' ? 'Math Practice' : `${heading.textContent} | Math Practice`
      if (changed) heading.focus()
      return true
    }
    if (updateHeading()) return
    document.title = 'Loading | Math Practice'
    const observer = new MutationObserver(() => {
      if (updateHeading()) observer.disconnect()
    })
    if (mainRef.current) observer.observe(mainRef.current, { childList: true, subtree: true })
    return () => observer.disconnect()
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
            <Suspense fallback={<p role="status">Loading page...</p>}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </PageContainer>
      </main>
      <footer className="site-footer">
        <PageContainer>A little practice goes a long way.</PageContainer>
      </footer>
    </div>
  )
}
