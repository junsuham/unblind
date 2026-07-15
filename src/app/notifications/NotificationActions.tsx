'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NotificationActions({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter()

  async function markAllRead() {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null)
    router.refresh()
  }

  if (!hasUnread) return null

  return (
    <button
      type="button"
      onClick={markAllRead}
      className="min-h-10 rounded-full bg-[var(--ub-surface-card)] px-4 text-[13px] font-semibold text-[var(--ub-color-brand)]"
    >
      모두 읽음
    </button>
  )
}
