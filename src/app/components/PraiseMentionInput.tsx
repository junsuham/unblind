'use client'

import {
  ChangeEvent,
  forwardRef,
  TextareaHTMLAttributes,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {
  LOCATION_MENTION_PREFIX,
  PRAISE_MENTION_PREFIX,
  getActiveMention,
  getLocationMentionLabel,
  getPraiseMentionLabel,
  keepPresentMentions,
  type ContentMention,
} from '@/lib/praiseMention'

type YouTubeResult = {
  youtubeId: string
  title: string
  channelTitle: string
}

type LocationResult = {
  id: string
  name: string
  address: string
}

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> & {
  value: string
  onChange: (value: string) => void
  mentions: ContentMention[]
  onMentionsChange: (mentions: ContentMention[]) => void
}

export type PraiseMentionInputHandle = {
  startMention: (kind: 'praise' | 'location') => void
}

const PraiseMentionInput = forwardRef<PraiseMentionInputHandle, Props>(function PraiseMentionInput({
  value,
  onChange,
  mentions,
  onMentionsChange,
  maxLength = 2000,
  ...props
}: Props, ref) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [cursor, setCursor] = useState(value.length)
  const [searchState, setSearchState] = useState<{ kind: 'praise' | 'location'; query: string; videos: YouTubeResult[]; locations: LocationResult[]; searching: boolean; message: string } | null>(null)
  const activeMention = getActiveMention(value, cursor)
  const activeKind = activeMention?.kind
  const activeQuery = activeMention?.query ?? ''

  useEffect(() => {
    if (activeKind !== 'praise' && activeKind !== 'location') return
    if (activeQuery.length < 2) return

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setSearchState({ kind: activeKind, query: activeQuery, videos: [], locations: [], searching: true, message: '' })

      try {
        const endpoint = activeKind === 'praise' ? '/api/youtube/search' : '/api/locations/search'
        const response = await fetch(`${endpoint}?q=${encodeURIComponent(activeQuery)}`, {
          signal: controller.signal,
        })
        const result = await response.json().catch(() => null)

        if (!response.ok) throw new Error(result?.error ?? '검색 결과를 불러오지 못했습니다.')

        if (activeKind === 'praise') {
          setSearchState({ kind: activeKind, query: activeQuery, videos: result?.videos ?? [], locations: [], searching: false, message: result?.videos?.length ? '' : '검색된 찬양이 없습니다.' })
        } else {
          setSearchState({ kind: activeKind, query: activeQuery, videos: [], locations: result?.locations ?? [], searching: false, message: result?.locations?.length ? '' : '검색된 지역이 없습니다.' })
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setSearchState({ kind: activeKind, query: activeQuery, videos: [], locations: [], searching: false, message: error instanceof Error ? error.message : '검색에 실패했습니다.' })
        }
      }
    }, 450)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [activeKind, activeQuery])

  const currentSearch =
    (activeKind === 'praise' || activeKind === 'location') &&
    searchState?.kind === activeKind &&
    searchState.query === activeQuery
      ? searchState
      : null

  function updateValue(nextValue: string, nextCursor: number) {
    if (nextValue.length > Number(maxLength)) return
    onChange(nextValue)
    onMentionsChange(keepPresentMentions(nextValue, mentions))
    setCursor(nextCursor)
    window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(nextCursor, nextCursor)
    })
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const nextValue = event.target.value
    onChange(nextValue)
    onMentionsChange(keepPresentMentions(nextValue, mentions))
    setCursor(event.target.selectionStart)
  }

  useImperativeHandle(ref, () => ({
    startMention(kind) {
      const currentCursor = inputRef.current?.selectionStart ?? value.length
      const prefix = kind === 'praise' ? PRAISE_MENTION_PREFIX : LOCATION_MENTION_PREFIX
      const leadingSpace = currentCursor > 0 && !/\s/.test(value[currentCursor - 1] ?? '') ? ' ' : ''
      const trailingSpace = currentCursor < value.length && !/\s/.test(value[currentCursor] ?? '') ? ' ' : ''
      const insertion = `${leadingSpace}${prefix}`
      const nextValue = value.slice(0, currentCursor) + insertion + trailingSpace + value.slice(currentCursor)
      if (nextValue.length > Number(maxLength)) return
      const nextCursor = currentCursor + insertion.length
      onChange(nextValue)
      onMentionsChange(keepPresentMentions(nextValue, mentions))
      setCursor(nextCursor)
      window.requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.setSelectionRange(nextCursor, nextCursor)
      })
    },
  }), [value, mentions, maxLength, onChange, onMentionsChange])

  function selectCategory(kind: 'praise' | 'location') {
    if (!activeMention) return
    const prefix = kind === 'praise' ? PRAISE_MENTION_PREFIX : LOCATION_MENTION_PREFIX
    const nextValue = value.slice(0, activeMention.start) + prefix + value.slice(activeMention.end)
    updateValue(nextValue, activeMention.start + prefix.length)
  }

  function insertMention(label: string, mention: ContentMention) {
    if (!activeMention) return
    const trailingSpace = value.slice(activeMention.end).startsWith(' ') ? '' : ' '
    const nextValue = value.slice(0, activeMention.start) + label + trailingSpace + value.slice(activeMention.end)
    if (nextValue.length > Number(maxLength)) return

    const nextMentions = keepPresentMentions(nextValue, [...mentions, mention])
    const nextCursor = activeMention.start + label.length + trailingSpace.length
    onChange(nextValue)
    onMentionsChange(nextMentions)
    setCursor(nextCursor)
    window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(nextCursor, nextCursor)
    })
  }

  function selectPraise(video: YouTubeResult) {
    const label = getPraiseMentionLabel(video.title)
    insertMention(label, {
      type: 'praise',
      label,
      youtubeId: video.youtubeId,
      title: video.title,
      subtitle: video.channelTitle,
    })
  }

  function selectLocation(location: LocationResult) {
    const label = getLocationMentionLabel(location.name)
    insertMention(label, {
      type: 'location',
      label,
      placeId: location.id,
      name: location.name,
      address: location.address,
    })
  }

  const showPanel = Boolean(activeMention)

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

      {showPanel && (
        <div className="absolute left-3 right-3 top-full z-40 mt-2 max-h-[300px] overflow-y-auto rounded-[18px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-card-strong)] p-1.5 shadow-[var(--ub-shadow-card)]">
          {activeMention?.kind === 'category' ? (
            <>
              <p className="px-3 py-2 text-[11px] font-semibold text-[var(--ub-text-tertiary)]">태그 종류를 선택하세요</p>
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectCategory('praise')} className="flex min-h-[52px] w-full items-center gap-3 rounded-[14px] px-3 text-left hover:bg-[var(--ub-surface-muted)]">
                <span className="text-[19px]">💿</span><span><strong className="block text-[14px] text-[var(--ub-text-primary)]">찬양</strong><span className="text-[12px] text-[var(--ub-text-secondary)]">YouTube 전체에서 찬양 검색</span></span>
              </button>
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectCategory('location')} className="flex min-h-[52px] w-full items-center gap-3 rounded-[14px] px-3 text-left hover:bg-[var(--ub-surface-muted)]">
                <span className="text-[19px]">🏞️</span><span><strong className="block text-[14px] text-[var(--ub-text-primary)]">위치</strong><span className="text-[12px] text-[var(--ub-text-secondary)]">지역·장소 이름 검색</span></span>
              </button>
            </>
          ) : (
            <>
              <p className="px-3 py-2 text-[11px] font-semibold text-[var(--ub-text-tertiary)]">
                {activeMention?.kind === 'praise' ? '찬양 이름을 2자 이상 입력하세요' : '지역·장소 이름을 2자 이상 입력하세요'}
              </p>
              {currentSearch?.searching && <p className="px-3 py-3 text-[13px] text-[var(--ub-text-secondary)]">검색 중...</p>}
              {!currentSearch?.searching && currentSearch?.message && <p className="px-3 py-3 text-[13px] text-[var(--ub-text-secondary)]">{currentSearch.message}</p>}
              {(currentSearch?.videos ?? []).map((video) => (
                <button key={video.youtubeId} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectPraise(video)} className="flex min-h-[54px] w-full items-center gap-3 rounded-[14px] px-3 py-2 text-left hover:bg-[var(--ub-surface-muted)]">
                  <span className="text-[18px]">💿</span><span className="min-w-0"><span className="block truncate text-[14px] font-semibold text-[var(--ub-text-primary)]">{video.title}</span><span className="block truncate text-[12px] text-[var(--ub-text-secondary)]">{video.channelTitle}</span></span>
                </button>
              ))}
              {(currentSearch?.locations ?? []).map((location) => (
                <button key={location.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectLocation(location)} className="flex min-h-[54px] w-full items-center gap-3 rounded-[14px] px-3 py-2 text-left hover:bg-[var(--ub-surface-muted)]">
                  <span className="text-[18px]">🏞️</span><span className="min-w-0"><span className="block truncate text-[14px] font-semibold text-[var(--ub-text-primary)]">{location.name}</span><span className="block truncate text-[12px] text-[var(--ub-text-secondary)]">{location.address}</span></span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
})

PraiseMentionInput.displayName = 'PraiseMentionInput'

export default PraiseMentionInput
