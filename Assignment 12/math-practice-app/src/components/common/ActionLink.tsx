import type { ReactNode } from 'react'
import { Link } from 'react-router'

interface ActionLinkProps {
  to: string
  children: ReactNode
  variant?: 'primary' | 'secondary'
}

export default function ActionLink({ to, children, variant = 'primary' }: ActionLinkProps) {
  return (
    <Link className={`button button-${variant}`} to={to}>
      {children}
    </Link>
  )
}
