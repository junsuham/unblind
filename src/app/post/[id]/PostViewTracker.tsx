'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type PostViewTrackerProps = {
  postId: string
}

export default function PostViewTracker({ postId }: PostViewTrackerProps) {
  useEffect(() => {
    const storageKey = `unblind:post-view:${postId}`

    if (sessionStorage.getItem(storageKey)) return

    sessionStorage.setItem(storageKey, 'pending')

    void supabase
      .rpc('increment_post_view', { p_post_id: postId })
      .then(({ error }) => {
        if (error) {
          sessionStorage.removeItem(storageKey)
          return
        }

        sessionStorage.setItem(storageKey, 'counted')
      })
  }, [postId])

  return null
}
