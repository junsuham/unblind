'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

export default function NotificationLink({
  id,
  href,
  unread,
  children,
}: {
  id: string
  href: string
  unread: boolean
  children: ReactNode
}) {
  function markRead() {
    if (!unread) return
    void fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
      keepalive: true,
    }).catch(() => undefined)
  }

  return <Link href={href} onClick={markRead}>{children}</Link>
}
