import type { ReactNode } from 'react'

export default function AppTemplate({ children }: { children: ReactNode }) {
  return <div className="ub-page-transition">{children}</div>
}
