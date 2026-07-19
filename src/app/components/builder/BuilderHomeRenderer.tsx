'use client'

import Link from 'next/link'
import {
  Content,
  type BuilderContent,
  type RegisteredComponent,
} from '@builder.io/sdk-react'
import { BUILDER_HOME_MODEL } from '@/lib/builder'

type BuilderNoticeCardProps = {
  eyebrow?: string
  title?: string
  body?: string
  linkLabel?: string
  linkHref?: string
}

function BuilderNoticeCard({
  eyebrow = '언블라인드',
  title = '함께 나누고 싶은 소식',
  body = '공동체에 전할 내용을 입력해주세요.',
  linkLabel,
  linkHref = '/',
}: BuilderNoticeCardProps) {
  return (
    <article className="rounded-[22px] bg-[var(--ub-surface-card-strong)] px-5 py-4 text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-soft)]">
      <p className="text-[9px] font-bold tracking-[0.08em] text-[var(--ub-text-tertiary)]">
        {eyebrow}
      </p>
      <h2 className="mt-1.5 text-[18px] font-extrabold leading-[24px] tracking-[-0.02em]">
        {title}
      </h2>
      <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-[20px] text-[var(--ub-text-secondary)]">
        {body}
      </p>
      {linkLabel && (
        <Link
          href={linkHref}
          className="mt-3 inline-flex min-h-9 items-center rounded-full bg-[var(--ub-color-brand)] px-4 text-[12px] font-bold text-white"
        >
          {linkLabel}
        </Link>
      )}
    </article>
  )
}

type BuilderSectionLabelProps = {
  label?: string
}

function BuilderSectionLabel({ label = '새로운 소식' }: BuilderSectionLabelProps) {
  return (
    <p className="px-1 text-[9px] font-bold tracking-[0.08em] text-white/58">
      {label}
    </p>
  )
}

const customComponents: RegisteredComponent[] = [
  {
    component: BuilderNoticeCard,
    name: 'UNBLIND 알림 카드',
    inputs: [
      { name: 'eyebrow', type: 'string', defaultValue: '언블라인드' },
      { name: 'title', type: 'string', defaultValue: '함께 나누고 싶은 소식' },
      {
        name: 'body',
        type: 'longText',
        defaultValue: '공동체에 전할 내용을 입력해주세요.',
      },
      { name: 'linkLabel', type: 'string', defaultValue: '' },
      { name: 'linkHref', type: 'url', defaultValue: '/' },
    ],
  },
  {
    component: BuilderSectionLabel,
    name: 'UNBLIND 작은 제목',
    inputs: [
      { name: 'label', type: 'string', defaultValue: '새로운 소식' },
    ],
  },
]

type BuilderHomeRendererProps = {
  apiKey: string
  content: BuilderContent | null
}

export function BuilderHomeRenderer({
  apiKey,
  content,
}: BuilderHomeRendererProps) {
  return (
    <div className="ub-builder-home">
      <Content
        apiKey={apiKey}
        model={BUILDER_HOME_MODEL}
        content={content}
        customComponents={customComponents}
        canTrack={false}
      />
    </div>
  )
}
