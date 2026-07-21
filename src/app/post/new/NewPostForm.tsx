'use client'

import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { analyzeTextForSafety } from '@/lib/moderation'
import SafetyIssueList from '@/app/components/SafetyIssueList'
import PraiseMentionInput, { type PraiseMentionInputHandle } from '@/app/components/PraiseMentionInput'
import { Emoji3D } from '@/app/components/ui/Emoji3D'
import type { ContentMention, ImageContentMention } from '@/lib/praiseMention'
import {
  NoticeCard,
} from '@/app/components/ui/AppShell'

type BoardId = 'prayer' | 'faith' | 'daily'

const boardOptions: { id: BoardId; name: string }[] = [
  { id: 'prayer', name: '기도요청' },
  { id: 'faith', name: '신앙고민' },
  { id: 'daily', name: '일상고민' },
]

const DRAFT_STORAGE_KEY = 'unblind-post-draft-v1'

type StoredDraft = {
  board: BoardId | ''
  title: string
  content: string
  urgentPrayer: boolean
  savedAt: number
}

function isBoardId(value: unknown): value is BoardId {
  return value === 'prayer' || value === 'faith' || value === 'daily'
}

type NewPostFormProps = {
  initialBoard: BoardId | null
}

type UploadedImage = {
  attachment: ImageContentMention
  previewUrl: string
}

async function prepareImage(file: File) {
  if (file.size <= 1_500_000 && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return file
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('선택한 이미지를 읽지 못했습니다.'))
      element.src = objectUrl
    })
    const maxDimension = 1600
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('이미지를 변환하지 못했습니다.')

    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => result ? resolve(result) : reject(new Error('이미지를 변환하지 못했습니다.')),
        'image/jpeg',
        0.84
      )
    })
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'unblind-image'
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function CheckRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  return (
    <label className="flex min-h-[50px] cursor-pointer items-start gap-3 border-b border-white/8 py-3.5 last:border-b-0">
      <span
        className={
          checked
            ? 'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e45330] text-white'
            : 'mt-0.5 h-5 w-5 shrink-0 rounded-full border border-white/28 bg-white/5'
        }
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden>
            <path
              d="M3 7.1 5.6 9.7 11 4.3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <span className="text-[13px] leading-[19px] text-white/66">
        {children}
      </span>
    </label>
  )
}

export default function NewPostForm({ initialBoard }: NewPostFormProps) {
  const router = useRouter()
  const [board, setBoard] = useState<BoardId | ''>(initialBoard ?? '')
  const [boardPickerOpen, setBoardPickerOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [urgentPrayer, setUrgentPrayer] = useState(false)
  const [mentions, setMentions] = useState<ContentMention[]>([])
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [checkedPrivacy, setCheckedPrivacy] = useState(false)
  const [checkedPurpose, setCheckedPurpose] = useState(false)
  const [checkedRiskReview, setCheckedRiskReview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [draftRestored, setDraftRestored] = useState(false)
  const draftReadyRef = useRef(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const mentionInputRef = useRef<PraiseMentionInputHandle>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(DRAFT_STORAGE_KEY)
        if (stored) {
          const draft = JSON.parse(stored) as Partial<StoredDraft>
          const isRecent = typeof draft.savedAt === 'number' && Date.now() - draft.savedAt < 7 * 24 * 60 * 60 * 1000
          const hasContent = Boolean(draft.title?.trim() || draft.content?.trim())
          if (isRecent && hasContent) {
            if (!initialBoard && isBoardId(draft.board)) setBoard(draft.board)
            if (typeof draft.title === 'string') setTitle(draft.title.slice(0, 80))
            if (typeof draft.content === 'string') setContent(draft.content.slice(0, 2000))
            if ((initialBoard ?? draft.board) === 'prayer' && draft.urgentPrayer === true) setUrgentPrayer(true)
            setDraftRestored(true)
          }
        }
      } catch {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY)
      } finally {
        draftReadyRef.current = true
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [initialBoard])

  useEffect(() => {
    if (!draftReadyRef.current) return

    const timer = window.setTimeout(() => {
      try {
        if (!title.trim() && !content.trim()) {
          window.localStorage.removeItem(DRAFT_STORAGE_KEY)
          return
        }

        const draft: StoredDraft = { board, title, content, urgentPrayer: board === 'prayer' && urgentPrayer, savedAt: Date.now() }
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
      } catch {
        // Private browsing can reject persistent storage; writing still works.
      }
    }, 450)

    return () => window.clearTimeout(timer)
  }, [board, content, title, urgentPrayer])

  function clearDraft() {
    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY)
    } catch {
      // The visible form can still be reset when storage is unavailable.
    }
    setBoard(initialBoard ?? '')
    setTitle('')
    setContent('')
    setMentions([])
    setUrgentPrayer(false)
    setDraftRestored(false)
  }

  const safetyAnalysis = useMemo(() => {
    return analyzeTextForSafety(`${title}\n${content}`)
  }, [title, content])

  const needsRiskReview =
    safetyAnalysis.warningIssues.length > 0 ||
    safetyAnalysis.dangerIssues.length > 0

  const canSubmit = Boolean(
    board &&
    title.trim().length >= 2 &&
    content.trim().length >= 10 &&
    checkedPrivacy &&
    checkedPurpose &&
    (!needsRiskReview || checkedRiskReview) &&
    !isUploading &&
    !isSubmitting
  )

  async function handleImageSelect(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? [])
    event.target.value = ''
    event.currentTarget.blur()

    if (!selectedFiles.length) return
    const availableSlots = 3 - uploadedImages.length
    if (availableSlots <= 0) {
      setErrorMessage('이미지는 최대 3장까지 올릴 수 있습니다.')
      return
    }

    setErrorMessage('')
    setIsUploading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('로그인 정보를 확인하지 못했습니다.')

      for (const originalFile of selectedFiles.slice(0, availableSlots)) {
        const file = await prepareImage(originalFile)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('이미지는 5MB 이하만 올릴 수 있습니다.')
        }

        const formData = new FormData()
        formData.set('file', file)
        const response = await fetch('/api/uploads/post-image', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.attachment) {
          throw new Error(result?.error ?? '이미지를 올리지 못했습니다.')
        }

        const attachment = result.attachment as ImageContentMention
        const previewUrl = URL.createObjectURL(file)
        setUploadedImages((current) => [...current, { attachment, previewUrl }])
        setMentions((current) => [...current, attachment])
      }

      if (selectedFiles.length > availableSlots) {
        setErrorMessage(`이미지는 최대 3장까지 등록되어 ${availableSlots}장만 추가했습니다.`)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '이미지를 올리지 못했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  async function removeImage(image: UploadedImage) {
    setUploadedImages((current) => current.filter((item) => item.attachment.storagePath !== image.attachment.storagePath))
    setMentions((current) => current.filter((mention) => mention.type !== 'image' || mention.storagePath !== image.attachment.storagePath))
    URL.revokeObjectURL(image.previewUrl)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return
    void fetch('/api/uploads/post-image', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ storagePath: image.attachment.storagePath }),
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    if (!board) {
      setErrorMessage('게시판을 선택해주세요.')
      return
    }

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    const tags: string[] = []

    if (trimmedTitle.length < 2) {
      setErrorMessage('제목을 2자 이상 입력해주세요.')
      return
    }
    if (trimmedContent.length < 10) {
      setErrorMessage('내용을 10자 이상 입력해주세요.')
      return
    }
    const finalSafetyAnalysis = analyzeTextForSafety(
      `${trimmedTitle}\n${trimmedContent}`
    )

    if (finalSafetyAnalysis.blockingIssues.length > 0) {
      setErrorMessage(
        '전화번호, 이메일, 링크, 카카오톡, SNS 아이디처럼 개인을 특정하거나 외부 접촉으로 이어질 수 있는 표현을 제거해주세요.'
      )
      return
    }

    const hasWarnings =
      finalSafetyAnalysis.warningIssues.length > 0 ||
      finalSafetyAnalysis.dangerIssues.length > 0

    if (hasWarnings && !checkedRiskReview) {
      setErrorMessage('경고 내용을 확인하고 등록 전 확인 항목에 체크해주세요.')
      return
    }
    if (!checkedPrivacy || !checkedPurpose) {
      setErrorMessage('등록 전 확인 항목을 모두 체크해주세요.')
      return
    }

    setIsSubmitting(true)
    let data: { id?: string; error?: string } | null = null
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board, title: trimmedTitle, content: trimmedContent, tags, mentions, urgentPrayer: board === 'prayer' && urgentPrayer }),
      })
      data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? '게시글을 등록하지 못했습니다.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '게시글을 등록하지 못했습니다. 연결을 확인한 뒤 다시 시도해주세요.')
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    if (data?.id) {
      try {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY)
      } catch {
        // The saved draft expires automatically even if Safari blocks removal.
      }
      router.push(`/post/${data.id}`)
      router.refresh()
      return
    }

    router.push(`/board/${board}`)
    router.refresh()
  }

  return (
    <main className="ub-writer-no-tab min-h-[100dvh] overflow-x-hidden bg-[#101011] pb-[calc(72px+env(safe-area-inset-bottom))] text-white">
      <form
        onSubmit={handleSubmit}
        className="ub-writer mx-auto min-h-[100dvh] max-w-[430px]"
      >
        <header className="sticky top-0 z-30 border-b border-white/8 bg-[#101011]/98 pt-[env(safe-area-inset-top)] shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="flex min-h-[56px] items-center justify-between px-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="min-h-11 px-1 text-[16px] text-white/72 active:text-white"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="min-h-11 px-1 text-[16px] font-semibold text-[#e45330] disabled:text-white/24"
            >
              {isSubmitting ? '등록 중' : '등록'}
            </button>
          </div>

          <div className="px-4 pb-3">
            <button
              type="button"
              onClick={() => setBoardPickerOpen((open) => !open)}
              aria-expanded={boardPickerOpen}
              aria-controls="writer-board-options"
              className="flex min-h-[54px] w-full items-center justify-between gap-3 rounded-[14px] border border-[#e45330]/45 bg-[#e45330]/10 px-4 text-left active:bg-[#e45330]/16"
            >
              <span className="min-w-0">
                <span className="block text-[15px] font-bold tracking-[-0.2px] text-white">
                  게시판을 선택해주세요
                </span>
                {board && (
                  <span className="mt-0.5 block truncate text-[11px] font-semibold text-[#ff7559]">
                    {boardOptions.find((option) => option.id === board)?.name}
                  </span>
                )}
              </span>
              <span className={`text-[21px] text-[#ff7559] transition-transform ${boardPickerOpen ? 'rotate-180' : ''}`} aria-hidden>⌄</span>
            </button>

            {boardPickerOpen && (
              <div id="writer-board-options" className="mt-2 overflow-hidden rounded-[14px] border border-white/10 bg-[#242426] shadow-xl">
                {boardOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setBoard(option.id)
                      if (option.id !== 'prayer') setUrgentPrayer(false)
                      setBoardPickerOpen(false)
                    }}
                    aria-pressed={board === option.id}
                    className={`flex min-h-[48px] w-full items-center justify-between border-b border-white/8 px-4 text-left text-[15px] font-semibold last:border-b-0 ${board === option.id ? 'bg-[#e45330]/14 text-[#ff7559]' : 'text-white/82 active:bg-white/6'}`}
                  >
                    <span>{option.name}</span>
                    {board === option.id && <Emoji3D name="check" size={19} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {draftRestored && (
          <div className="mx-4 mt-3 flex min-h-10 items-center justify-between gap-3 rounded-[12px] bg-[#e45330]/12 px-3 text-[11px] font-semibold text-[#ff8269]" role="status">
            <span>작성 중이던 글을 복원했습니다.</span>
            <button type="button" onClick={clearDraft} className="min-h-9 shrink-0 px-1 font-bold text-[#ff9a86]">초기화</button>
          </div>
        )}

        {board === 'prayer' && (
          <section className="border-b border-white/8 px-4 py-4">
            <button
              type="button"
              aria-pressed={urgentPrayer}
              onClick={() => setUrgentPrayer((current) => !current)}
              className={`flex min-h-[66px] w-full items-center gap-3 rounded-[16px] border px-3.5 text-left transition-colors ${urgentPrayer ? 'border-[#ff5a4f]/65 bg-[#ff3b30]/14' : 'border-white/10 bg-white/5 active:bg-white/8'}`}
            >
              <Emoji3D name="siren" size={38} />
              <span className="min-w-0 flex-1">
                <strong className="block text-[14px] text-white">긴급 중보기도 요청</strong>
                <span className="mt-0.5 block text-[11px] leading-[16px] text-white/50">빠른 기도가 꼭 필요한 제목에만 표시해주세요.</span>
              </span>
              <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${urgentPrayer ? 'bg-[#ff3b30]' : 'bg-white/16'}`} aria-hidden>
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${urgentPrayer ? 'translate-x-6' : 'translate-x-1'}`} />
              </span>
            </button>
            <p className="mt-2 px-1 text-[10px] leading-[15px] text-white/34">생명 위험이나 즉시 구조가 필요한 상황에서는 앱보다 112·119와 가까운 보호자에게 먼저 연락해주세요.</p>
          </section>
        )}

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={80}
          placeholder="제목을 입력해주세요."
          aria-label="제목"
          className="min-h-[82px] w-full border-b border-white/8 bg-transparent px-4 text-[23px] font-semibold tracking-[-0.4px] text-white outline-none placeholder:text-white/18"
        />

        <section className="relative border-b border-white/8">
          <PraiseMentionInput
            ref={mentionInputRef}
            value={content}
            onChange={setContent}
            mentions={mentions}
            onMentionsChange={setMentions}
            rows={13}
            maxLength={2000}
            placeholder="내용을 입력해주세요."
            aria-label="내용"
            className="min-h-[390px] w-full resize-none bg-transparent px-4 py-5 text-[17px] leading-[25px] text-white outline-none placeholder:text-white/16"
          />
          <span className="absolute bottom-3 right-4 text-[10px] tabular-nums text-white/24">
            {content.length}/2000
          </span>
        </section>

        {uploadedImages.length > 0 && (
          <section className="border-b border-white/8 px-4 py-4">
            <div className="grid grid-cols-3 gap-2">
              {uploadedImages.map((image) => (
                <div key={image.attachment.storagePath} className="relative aspect-square overflow-hidden rounded-[14px] bg-white/6">
                  {/* 업로드 직후의 로컬 미리보기이므로 Next 이미지 최적화 대상이 아닙니다. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.previewUrl} alt="첨부 이미지 미리보기" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => void removeImage(image)}
                    aria-label="첨부 이미지 삭제"
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-[16px] text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="px-4">
          <SafetyIssueList issues={safetyAnalysis.issues} />
        </div>

        <section id="writer-checks" className="scroll-mt-20 border-b border-white/8 px-4 py-5">
          <h2 className="text-[13px] font-semibold text-white/48">등록 전 확인</h2>
          <div className="mt-2">
            <CheckRow checked={checkedPrivacy} onChange={setCheckedPrivacy}>
              이름, 직책, 사역팀 등 개인을 특정할 수 있는 정보를 적지 않았습니다.
            </CheckRow>
            <CheckRow checked={checkedPurpose} onChange={setCheckedPurpose}>
              공격이나 폭로가 아닌 기도와 고민 나눔을 위한 글입니다.
            </CheckRow>
            {needsRiskReview && (
              <CheckRow checked={checkedRiskReview} onChange={setCheckedRiskReview}>
                표시된 안전 경고를 확인하고 필요한 내용을 수정했습니다.
              </CheckRow>
            )}
          </div>
        </section>

        <p className="px-4 py-4 text-[11px] leading-[17px] text-white/34">
          사용자에게는 랜덤 익명 ID만 표시되며 신고 처리에 필요한 기록은 운영 정책에 따라 보호됩니다.
        </p>

        {errorMessage && (
          <div className="px-4 pb-5">
            <NoticeCard title="등록할 수 없습니다" tone="danger">
              <p>{errorMessage}</p>
            </NoticeCard>
          </div>
        )}

        <div className="ub-writer-toolbar fixed inset-x-0 z-30 border-t border-white/8 bg-[#1c1c1e]/98 backdrop-blur-xl">
          <div className="mx-auto flex min-h-[54px] max-w-[430px] items-center gap-1 px-3 text-white/52">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple
              onChange={handleImageSelect}
              className="sr-only"
              aria-label="이미지 선택"
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploading || uploadedImages.length >= 3}
              aria-label="이미지 업로드"
              className="flex h-11 w-11 items-center justify-center rounded-[10px] active:bg-white/8 disabled:opacity-35"
            >
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="8" cy="9" r="1.5" />
                <path d="m4 18 5-5 4 4 2-2 5 5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => mentionInputRef.current?.startMention('location')}
              aria-label="위치 추가"
              className="flex h-11 w-11 items-center justify-center rounded-[10px] active:bg-white/8"
            >
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => mentionInputRef.current?.startMention('praise')}
              aria-label="찬양 추가"
              className="flex h-11 w-11 items-center justify-center rounded-[10px] active:bg-white/8"
            >
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M9 18V5l10-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="16" cy="16" r="3" />
              </svg>
            </button>
            <span className="ml-auto pr-1 text-[10px] text-white/34">
              {isUploading ? '이미지 올리는 중…' : `${uploadedImages.length}/3 · 위치 · 찬양`}
            </span>
          </div>
        </div>
      </form>

    </main>
  )
}
