'use client'

import { FormEvent, ReactNode, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { analyzeTextForSafety } from '@/lib/moderation'
import SafetyIssueList from '@/app/components/SafetyIssueList'
import PraiseMentionInput from '@/app/components/PraiseMentionInput'
import {
  AppShell,
  GlassCard,
  NoticeCard,
  PageHeader,
  Pill,
} from '@/app/components/ui/AppShell'

type BoardId = 'prayer' | 'faith' | 'daily'

const boardOptions: { id: BoardId; name: string; icon: string; description: string }[] = [
  {
    id: 'prayer',
    name: '기도요청',
    icon: '🙏',
    description: '함께 기도받고 싶은 제목을 나눠요.',
  },
  {
    id: 'faith',
    name: '신앙',
    icon: '🕊️',
    description: '신앙 속 고민을 나눠요.',
  },
  {
    id: 'daily',
    name: '일상',
    icon: '☀️',
    description: '일상 속 고민을 나눠요.',
  },
]

type NewPostFormProps = {
  initialBoard: BoardId
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
    <label className="flex min-h-[56px] cursor-pointer items-start gap-3 border-b border-[var(--ub-separator)] px-4 py-4 last:border-b-0">
      <span
        className={
          checked
            ? 'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ff4b00] text-white'
            : 'mt-0.5 h-6 w-6 shrink-0 rounded-full border border-[var(--ub-control-border)] bg-[var(--ub-surface-card-strong)]'
        }
      >
        {checked && (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
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

      <span className="text-[15px] leading-[21px] text-[var(--ub-text-secondary)]">
        {children}
      </span>
    </label>
  )
}

export default function NewPostForm({ initialBoard }: NewPostFormProps) {
  const router = useRouter()

  const board = initialBoard

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [checkedPrivacy, setCheckedPrivacy] = useState(false)
  const [checkedPurpose, setCheckedPurpose] = useState(false)
  const [checkedRiskReview, setCheckedRiskReview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const selectedBoard = boardOptions.find((option) => option.id === board)

  const safetyAnalysis = useMemo(() => {
    return analyzeTextForSafety(`${title}\n${content}\n${tagsInput}`)
  }, [title, content, tagsInput])

  const needsRiskReview =
    safetyAnalysis.warningIssues.length > 0 ||
    safetyAnalysis.dangerIssues.length > 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    const tags = Array.from(
      new Set(
        tagsInput
          .split(/[\s,]+/)
          .map((tag) => tag.replace(/^#+/, '').trim())
          .filter(Boolean)
      )
    )

    if (trimmedTitle.length < 2) {
      setErrorMessage('제목을 2자 이상 입력해주세요.')
      return
    }

    if (trimmedContent.length < 10) {
      setErrorMessage('내용을 10자 이상 입력해주세요.')
      return
    }

    if (tags.length > 5) {
      setErrorMessage('태그는 최대 5개까지 입력할 수 있습니다.')
      return
    }

    if (tags.some((tag) => tag.length > 12)) {
      setErrorMessage('각 태그는 12자 이하로 입력해주세요.')
      return
    }

    const finalSafetyAnalysis = analyzeTextForSafety(
      `${trimmedTitle}\n${trimmedContent}\n${tags.join(' ')}`
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
      setErrorMessage(
        '경고 내용을 확인한 뒤, 개인이 특정되지 않도록 수정했거나 위험성을 이해했다는 항목에 체크해주세요.'
      )
      return
    }

    if (!checkedPrivacy) {
      setErrorMessage('개인을 특정할 수 있는 정보를 적지 않았다는 항목에 체크해주세요.')
      return
    }

    if (!checkedPurpose) {
      setErrorMessage('공격이나 폭로가 아닌 고민 나눔이라는 항목에 체크해주세요.')
      return
    }

    setIsSubmitting(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsSubmitting(false)
      setErrorMessage('로그인 정보를 확인하지 못했습니다. 다시 로그인해주세요.')
      return
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        board,
        title: trimmedTitle,
        content: trimmedContent,
        status: 'visible',
        author_user_id: user.id,
        tags,
      })
      .select('id')
      .single()

    setIsSubmitting(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    if (data?.id) {
      router.push(`/post/${data.id}`)
      router.refresh()
      return
    }

    router.push(`/board/${board}`)
    router.refresh()
  }

  return (
    <AppShell>
      <PageHeader
        backHref={`/board/${board}`}
        backLabel="게시판"
        eyebrow="언블라인드"
        title="글쓰기"
        description="선택한 게시판에 익명으로 고민과 기도제목을 남깁니다."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Pill>익명 작성</Pill>
        <Pill>사용자 간 비공개</Pill>
        <Pill>운영자 신고 대응</Pill>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section>
          <p className="mb-2 px-4 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--ub-text-on-brand-tertiary)]">
            선택된 게시판
          </p>

          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--ub-surface-muted)] text-[24px]">
                {selectedBoard?.icon}
              </div>

              <div>
                <p className="text-[17px] font-semibold text-[var(--ub-text-primary)]">
                  {selectedBoard?.name}
                </p>

                <p className="mt-0.5 text-[15px] leading-[20px] text-[var(--ub-text-secondary)]">
                  {selectedBoard?.description}
                </p>
              </div>
            </div>
          </GlassCard>

          <p className="mt-2 px-4 text-[13px] leading-[18px] text-[var(--ub-text-on-brand-tertiary)]">
            게시판을 바꾸려면 이전 화면에서 다른 게시판을 선택해주세요.
          </p>
        </section>

        <section>
          <p className="mb-2 px-4 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--ub-text-on-brand-tertiary)]">
            제목
          </p>

          <GlassCard className="p-0">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={80}
              placeholder="예: 요즘 기도가 잘 안 됩니다"
              className="min-h-[60px] w-full rounded-[28px] bg-transparent px-5 text-[17px] text-[var(--ub-text-primary)] outline-none placeholder:text-[var(--ub-text-tertiary)]"
            />
          </GlassCard>

          <p className="mt-2 px-4 text-[13px] leading-[18px] text-[var(--ub-text-on-brand-tertiary)]">
            제목은 짧고 구체적으로 적되, 누군가를 특정할 수 있는 표현은 피해주세요.
          </p>
        </section>

        <section>
          <p className="mb-2 px-4 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--ub-text-on-brand-tertiary)]">
            내용
          </p>

          <GlassCard className="p-0">
            <PraiseMentionInput
              value={content}
              onChange={setContent}
              rows={12}
              maxLength={2000}
              placeholder="내용을 입력해주세요. @를 입력하면 찬양을 추천할 수 있어요."
              className="min-h-[260px] w-full resize-none rounded-[28px] bg-transparent px-5 py-5 text-[17px] leading-[25px] text-[var(--ub-text-primary)] outline-none placeholder:text-[var(--ub-text-tertiary)]"
            />
          </GlassCard>

          <div className="mt-2 flex justify-between px-4 text-[13px] text-[var(--ub-text-on-brand-tertiary)]">
            <span>@ + 찬양 이름으로 오·찬·추를 남겨보세요.</span>
            <span>{content.length}/2000</span>
          </div>

          <SafetyIssueList issues={safetyAnalysis.issues} />
        </section>

        <section>
          <p className="mb-2 px-4 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--ub-text-on-brand-tertiary)]">
            태그 <span className="font-normal normal-case">(선택)</span>
          </p>

          <GlassCard className="p-0">
            <input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              maxLength={80}
              placeholder="예: 취업, 기도, 인간관계"
              className="min-h-[56px] w-full rounded-[28px] bg-transparent px-5 text-[16px] text-[var(--ub-text-primary)] outline-none placeholder:text-[var(--ub-text-tertiary)]"
            />
          </GlassCard>

          <p className="mt-2 px-4 text-[13px] leading-[18px] text-[var(--ub-text-on-brand-tertiary)]">
            쉼표나 띄어쓰기로 구분해 최대 5개까지 입력할 수 있습니다. 비워두면 태그가 표시되지 않습니다.
          </p>
        </section>

        <section>
          <p className="mb-2 px-4 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--ub-text-on-brand-tertiary)]">
            작성 전 확인
          </p>

          <div className="overflow-hidden rounded-[22px] bg-[var(--ub-surface-card-strong)] shadow-[var(--ub-shadow-soft)]">
            <CheckRow
              checked={checkedPrivacy}
              onChange={setCheckedPrivacy}
            >
              개인을 특정할 수 있는 이름, 사역팀, 직책, 구체적인 사건을 적지 않았습니다.
            </CheckRow>

            <CheckRow
              checked={checkedPurpose}
              onChange={setCheckedPurpose}
            >
              이 글은 공격이나 폭로가 아니라 고민 나눔을 위한 글입니다.
            </CheckRow>

            {needsRiskReview && (
              <CheckRow
                checked={checkedRiskReview}
                onChange={setCheckedRiskReview}
              >
                위 경고를 확인했고, 개인이 특정되지 않도록 수정했거나 위험성을 이해했습니다.
              </CheckRow>
            )}
          </div>

          <p className="mt-2 px-4 text-[13px] leading-[18px] text-[var(--ub-text-on-brand-tertiary)]">
            사용자에게는 익명이지만, 신고 처리와 안전 운영을 위해 운영자는 필요한 범위에서 기록을 확인할 수 있습니다.
          </p>
        </section>

        {errorMessage && (
          <NoticeCard title="등록할 수 없습니다" tone="danger">
            <p>{errorMessage}</p>
          </NoticeCard>
        )}

        <div className="sticky bottom-[calc(18px+env(safe-area-inset-bottom))] z-30 rounded-[24px] border border-[var(--ub-glass-border)] bg-[var(--ub-surface-glass)] p-3 shadow-[var(--ub-shadow-glass)] backdrop-blur-2xl">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex min-h-[52px] w-full items-center justify-center rounded-[16px] bg-[#ff4b00] px-5 text-[17px] font-semibold text-white shadow-sm active:scale-[0.99] disabled:bg-[#8E8E93]"
          >
            {isSubmitting ? '등록 중...' : '익명으로 등록하기'}
          </button>
        </div>
      </form>
    </AppShell>
  )
}
