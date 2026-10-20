import type { ReactNode } from 'react'
import { Link } from 'react-router'

export default function ErrorMessage({
  title,
  children,
  onRetry,
  role = 'alert',
  label = 'Practice message',
  className = '',
}: {
  title?: string
  children: ReactNode
  onRetry?: () => void
  role?: 'alert' | 'status'
  label?: string
  className?: string
}) {
  return (
    <div className={`error-message ${className}`} role={role} aria-label={label}>
      {title && <h2>{title}</h2>}
      {children}
      <div className="summary-actions">
        {onRetry && (
          <button type="button" className="button button-primary" onClick={onRetry}>
            Try again
          </button>
        )}
        <Link className="button button-secondary" to="/">
          Back home
        </Link>
      </div>
    </div>
  )
}
