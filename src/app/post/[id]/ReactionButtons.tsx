'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type ReactionType = 'pray' | 'empathize'

type ReactionButtonsProps = {
  postId: string
  initialPrayCount: number
  initialEmpathizeCount: number
}

const actorStorageKey = 'youth_anonymous_actor_key'

function createActorKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function ReactionButtons({
  postId,
  initialPrayCount,
  initialEmpathizeCount,
}: ReactionButtonsProps) {
  const [actorKey, setActorKey] = useState<string | null>(null)

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
    let key = localStorage.getItem(actorStorageKey)

    if (!key) {
      key = createActorKey()
      localStorage.setItem(actorStorageKey, key)
    }

    setActorKey(key)

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
    if (!actorKey || isLoadingMyReactions || clicked[type]) {
      return
    }

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
      <p className="mb-2 px-4 text-[13px] font-semibold uppercase tracking-[0.04em] text-white/78">
        마음 표현
      </p>

      <div className="overflow-hidden rounded-[22px] bg-white shadow-sm">
        <button
          type="button"
          onClick={() => handleReaction('pray')}
          disabled={isLoadingMyReactions || submittingType !== null || clicked.pray}
          className="flex min-h-[64px] w-full items-center justify-between border-b border-[#D1D1D6]/70 px-4 py-3 text-left active:bg-[#E5E5EA] disabled:opacity-60"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#F2F2F7] text-[22px]">
              🙏
            </div>

            <div>
              <p className="text-[17px] text-black">기도할게요</p>
              <p className="mt-0.5 text-[15px] text-[#3C3C43]/60">
                {clicked.pray ? '이미 함께 기도 중입니다' : '이 글을 위해 기도합니다'}
              </p>
            </div>
          </div>

          <span className="text-[15px] font-medium text-[#ff4b00]">
            {counts.pray}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleReaction('empathize')}
          disabled={
            isLoadingMyReactions ||
            submittingType !== null ||
            clicked.empathize
          }
          className="flex min-h-[64px] w-full items-center justify-between px-4 py-3 text-left active:bg-[#E5E5EA] disabled:opacity-60"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#F2F2F7] text-[22px]">
              🤍
            </div>

            <div>
              <p className="text-[17px] text-black">공감해요</p>
              <p className="mt-0.5 text-[15px] text-[#3C3C43]/60">
                {clicked.empathize ? '공감으로 함께했습니다' : '혼자가 아니라고 전합니다'}
              </p>
            </div>
          </div>

          <span className="text-[15px] font-medium text-[#ff4b00]">
            {counts.empathize}
          </span>
        </button>
      </div>

      {errorMessage && (
        <div className="mt-3 rounded-[18px] border border-[#FF3B30]/20 bg-[#FF3B30]/10 p-4 text-[15px] leading-[21px] text-[#7A1A16]">
          {errorMessage}
        </div>
      )}
    </section>
  )
}
