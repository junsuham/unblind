'use client'

import {
  ChangeEvent,
  TextareaHTMLAttributes,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { supabase } from '@/lib/supabase'
import {
  getActivePraiseMention,
  getPraiseMentionLabel,
  type PraiseMentionTrack,
} from '@/lib/praiseMention'

type PraiseMentionInputProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange'
> & {
  value: string
  onChange: (value: string) => void
}

export default function PraiseMentionInput({
  value,
  onChange,
  maxLength = 2000,
  ...props
}: PraiseMentionInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [tracks, setTracks] = useState<PraiseMentionTrack[]>([])
  const [cursor, setCursor] = useState(value.length)
  const activeMention = getActivePraiseMention(value, cursor)

  useEffect(() => {
    supabase
      .from('top100_tracks')
      .select('youtube_id, title, artist')
      .eq('is_active', true)
      .order('rank')
      .limit(100)
      .then(({ data }) => setTracks(data ?? []))
  }, [])

  const suggestions = useMemo(() => {
    if (!activeMention) return []

    return tracks
      .filter((track) => {
        if (!activeMention.query) return true
        const searchable = `${track.title} ${track.artist}`.toLocaleLowerCase('ko-KR')
        return searchable.includes(activeMention.query)
      })
      .slice(0, 6)
  }, [activeMention, tracks])

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value)
    setCursor(event.target.selectionStart)
  }

  function selectTrack(track: PraiseMentionTrack) {
    if (!activeMention) return

    const label = getPraiseMentionLabel(track.title)
    const nextValue =
      value.slice(0, activeMention.start) +
      label +
      value.slice(activeMention.end)

    if (nextValue.length > Number(maxLength)) return

    const nextCursor = activeMention.start + label.length
    onChange(nextValue)
    setCursor(nextCursor)

    window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(nextCursor, nextCursor)
    })
  }

  return (
    <div className="relative">
      <textarea
        {...props}
        ref={inputRef}
        value={value}
        maxLength={maxLength}
        onChange={handleChange}
        onClick={(event) => setCursor(event.currentTarget.selectionStart)}
        onKeyUp={(event) => setCursor(event.currentTarget.selectionStart)}
        onSelect={(event) => setCursor(event.currentTarget.selectionStart)}
      />

      {activeMention && suggestions.length > 0 && (
        <div className="absolute left-3 right-3 top-full z-40 mt-2 max-h-[280px] overflow-y-auto rounded-[18px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-card-strong)] p-1.5 shadow-[var(--ub-shadow-card)]">
          <p className="px-3 py-2 text-[11px] font-semibold text-[var(--ub-text-tertiary)]">
            찬양 선택 · 제목 또는 아티스트 검색
          </p>
          {suggestions.map((track) => (
            <button
              key={track.youtube_id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectTrack(track)}
              className="flex min-h-[52px] w-full items-center gap-3 rounded-[14px] px-3 py-2 text-left hover:bg-[var(--ub-surface-muted)] active:bg-[var(--ub-surface-pressed)]"
            >
              <span className="text-[18px]">💿</span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-semibold text-[var(--ub-text-primary)]">
                  {track.title}
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-[var(--ub-text-secondary)]">
                  {track.artist}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
