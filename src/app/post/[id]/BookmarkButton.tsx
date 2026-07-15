'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SystemIcon } from '@/app/components/ui/SystemIcon'

export default function BookmarkButton({
  postId,
  userId,
  initialSaved,
}: {
  postId: string
  userId: string
  initialSaved: boolean
}) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (loading) return
    setLoading(true)

    const { error } = saved
      ? await supabase.from('saved_posts').delete().eq('user_id', userId).eq('post_id', postId)
      : await supabase.from('saved_posts').insert({ user_id: userId, post_id: postId })

    if (!error) setSaved(!saved)
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? '저장 취소' : '게시글 저장'}
      className="inline-flex min-h-9 items-center gap-1 rounded-full bg-[var(--ub-surface-muted)] px-3 text-[13px] text-[var(--ub-text-secondary)] disabled:opacity-50"
    >
      <SystemIcon name="bookmark" size={16} className={saved ? 'fill-current text-[var(--ub-color-brand)]' : ''} />
      {saved ? '저장됨' : '저장'}
    </button>
  )
}
