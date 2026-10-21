import { useState, type ReactNode } from 'react'
import { createMemoryRouter, RouterProvider, type InitialEntry } from 'react-router'

/** Exercise the same data-router navigation/blocker behavior as the production router. */
export function MemoryRouter({
  children,
  initialEntries,
  initialIndex,
}: {
  children: ReactNode
  initialEntries?: InitialEntry[]
  initialIndex?: number
}) {
  const [router] = useState(() =>
    createMemoryRouter([{ path: '*', element: children }], { initialEntries, initialIndex }),
  )
  return <RouterProvider router={router} />
}
