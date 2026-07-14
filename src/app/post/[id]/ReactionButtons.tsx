'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type ReactionType = 'pray' | 'empathize'

type ReactionButtonsProps = {
  postId: string
  initialPrayCount: number
  initialEmpathizeCount: number
  commentCount: number
}

const actorStorageKey = 'youth_anonymous_actor_key'

function createActorKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getActorKey() {
  let key = localStorage.getItem(actorStorageKey)

  if (!key) {
    key = createActorKey()
    localStorage.setItem(actorStorageKey, key)
  }

  return key
}

export default function ReactionButtons({
  postId,
  initialPrayCount,
  initialEmpathizeCount,
  commentCount,
}: ReactionButtonsProps) {
  const [counts, setCounts] = useState({
    pray: initialPrayCount,
    empathize: initialEmpathizeCount,
  })

  const [clicked, setClicked] = useState<Record<ReactionType, boolean>>({
    pray: false,
    empathize: false,
  })

  const [isLoadingMyReactions, setIsLoadingMyReactions] = useState(true)
  const [submittingType, setSubmittingType] = useState<ReactionType | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const key = getActorKey()

    async function loadMyReactions() {
      const { data, error } = await supabase
        .from('reactions')
        .select('type')
        .eq('post_id', postId)
        .eq('actor_key', key)

      if (!error && data) {
        setClicked({
          pray: data.some((reaction) => reaction.type === 'pray'),
          empathize: data.some((reaction) => reaction.type === 'empathize'),
        })
      }

      setIsLoadingMyReactions(false)
    }

    loadMyReactions()
  }, [postId])

  async function handleReaction(type: ReactionType) {
    if (isLoadingMyReactions || clicked[type]) {
      return
    }

    const actorKey = getActorKey()
    setErrorMessage('')
    setSubmittingType(type)

    const { error } = await supabase.from('reactions').upsert(
      {
        post_id: postId,
        actor_key: actorKey,
        type,
      },
      {
        onConflict: 'post_id,actor_key,type',
        ignoreDuplicates: true,
      }
    )

    setSubmittingType(null)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setClicked((previous) => ({
      ...previous,
      [type]: true,
    }))

    setCounts((previous) => ({
      ...previous,
      [type]: previous[type] + 1,
    }))
  }

  return (
    <section>
      <div className="grid grid-cols-3 border-y border-[var(--ub-separator)]">
        <button
          type="button"
          onClick={() => handleReaction('empathize')}
          disabled={
            isLoadingMyReactions ||
            submittingType !== null ||
            clicked.empathize
          }
          className="flex min-h-[54px] items-center justify-center gap-1.5 border-r border-[var(--ub-separator)] px-2 text-[13px] font-medium text-[var(--ub-text-secondary)] active:bg-[var(--ub-surface-pressed)] disabled:opacity-60"
        >
          <span aria-hidden>{clicked.empathize ? '♥' : '♡'}</span>
          좋아요 {counts.empathize}
        </button>

        <button
          type="button"
          onClick={() => handleReaction('pray')}
          disabled={isLoadingMyReactions || submittingType !== null || clicked.pray}
          className="flex min-h-[54px] items-center justify-center gap-1.5 border-r border-[var(--ub-separator)] px-2 text-[13px] font-medium text-[var(--ub-text-secondary)] active:bg-[var(--ub-surface-pressed)] disabled:opacity-60"
        >
          <span aria-hidden>🙏</span>
          기도 {counts.pray}
        </button>

        <a
          href="#comments"
          className="flex min-h-[54px] items-center justify-center gap-1.5 px-2 text-[13px] font-medium text-[var(--ub-text-secondary)] active:bg-[var(--ub-surface-pressed)]"
        >
          <span aria-hidden>◯</span>
          댓글 {commentCount}
        </a>
      </div>

      {errorMessage && (
        <div className="mt-3 rounded-[18px] border border-[#FF3B30]/20 bg-[#FF3B30]/10 p-4 text-[15px] leading-[21px] text-[#7A1A16]">
          {errorMessage}
        </div>
      )}
    </section>
  )
}
