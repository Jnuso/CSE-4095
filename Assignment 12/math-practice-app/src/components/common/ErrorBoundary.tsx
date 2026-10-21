import { Component, createRef, type ReactNode } from 'react'
import { PageLoadError } from '../../services/PageLoadError'
import ErrorMessage from './ErrorMessage'
import { reportDevelopmentError } from '../../services/reportDevelopmentError'

type Props = { children: ReactNode; resetKey?: string; onRecover?: () => void }

export default class ErrorBoundary extends Component<
  Props,
  { failed: boolean; reloadRequired: boolean }
> {
  state = { failed: false, reloadRequired: false }
  heading = createRef<HTMLHeadingElement>()
  static getDerivedStateFromError(error: unknown) {
    return { failed: true, reloadRequired: error instanceof PageLoadError }
  }
  componentDidCatch() {
    reportDevelopmentError('page-render-failed', 1)
    this.heading.current?.focus()
  }
  componentDidUpdate(previous: Props, previousState: { failed: boolean; reloadRequired: boolean }) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey)
      this.setState({ failed: false })
    else if (previousState.failed && !this.state.failed) this.props.onRecover?.()
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <section className="feature-page" aria-labelledby="error-title">
        <div className="feature-card">
          <h1 id="error-title" tabIndex={-1} ref={this.heading}>
            Let’s try a fresh start
          </h1>
          <ErrorMessage
            onRetry={() => {
              if (this.state.reloadRequired) window.location.reload()
              else this.setState({ failed: false })
            }}
          >
            <p>
              This page could not open. Your saved practice has not been erased. Try again or go
              Home to choose another activity.
            </p>
          </ErrorMessage>
        </div>
      </section>
    )
  }
}
