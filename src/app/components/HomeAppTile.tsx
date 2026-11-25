import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from './HomeAppDrawer.module.css'

export type HomeAppTone = 'sage' | 'rose' | 'apricot' | 'blue' | 'violet' | 'coral' | 'amber'

const iconArt: Record<HomeAppTone, { name: string; glyph: ReactNode }> = {
  sage: {
    name: 'journey',
    glyph: (
      <>
        <circle cx="16" cy="16" r="12.5" />
        <path d="m21.5 10.5-3.2 7.8-7.8 3.2 3.2-7.8Z" fill="currentColor" strokeLinejoin="round" />
      </>
    ),
  },
  rose: {
    name: 'manitto',
    glyph: (
      <>
        <rect x="3" y="12" width="26" height="6" rx="1.5" />
        <path d="M5 18v8a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-8M16 12v16m0-16h-4.5A4 4 0 1 1 15 6.1l1 5.9Zm0 0h4.5A4 4 0 1 0 17 6.1L16 12Z" />
      </>
    ),
  },
  apricot: {
    name: 'gratitude',
    glyph: (
      <>
        <rect x="6" y="3.5" width="21" height="25" rx="3.5" />
        <path d="M10 4v24m10-16.8a2.8 2.8 0 0 1 4 4l-4 4.1-4-4.1a2.8 2.8 0 0 1 4-4Z" />
      </>
    ),
  },
  blue: {
    name: 'recreation',
    glyph: (
      <>
        <rect x="4" y="4" width="24" height="24" rx="6" />
        <path d="M10.5 10.5h.01m11 0h.01M16 16h.01m-5.51 5.5h.01m11 0h.01" strokeWidth="3.5" />
      </>
    ),
  },
  violet: {
    name: 'mbti',
    glyph: (
      <>
        <path d="M16 27c-3.3-2.4-7-3.1-12-2.5V8.2c5-.6 8.7.1 12 2.5 3.3-2.4 7-3.1 12-2.5v16.3c-5-.6-8.7.1-12 2.5Zm0-16.3V27M22 12.5v7m-2.8-4.5h5.6" />
      </>
    ),
  },
  coral: {
    name: 'shorts',
    glyph: (
      <>
        <rect x="3.5" y="7" width="25" height="18" rx="5" />
        <path d="m14 12.4 6 3.6-6 3.6Z" fill="currentColor" />
      </>
    ),
  },
  amber: {
    name: 'praise',
    glyph: (
      <>
        <path d="M4 19v-4a12 12 0 0 1 24 0v4" />
        <rect x="3.5" y="16" width="7" height="11.5" rx="3" />
        <rect x="21.5" y="16" width="7" height="11.5" rx="3" />
      </>
    ),
  },
}

type HomeAppTileContentProps = {
  label: string
  tone: HomeAppTone
  badge?: 'waiting' | 'matched'
  status?: string
  error?: boolean
}

export const homeAppTileClassName = styles.tile

export function HomeAppTileContent({ label, tone, badge, status, error }: HomeAppTileContentProps) {
  const art = iconArt[tone]
  return (
    <>
      <span className={styles.icon} data-tone={tone} data-app-icon={art.name} aria-hidden="true">
        <span className={styles.iconFace}>
          <svg className={styles.glyph} width="36" height="36" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" focusable="false">
            {art.glyph}
          </svg>
        </span>
        {badge && <span className={styles.badge} data-state={badge} />}
      </span>
      <span className={styles.label}>{label}</span>
      {status && <span className={styles.status} data-error={error || undefined}>{status}</span>}
    </>
  )
}

export function HomeAppLink({
  id,
  href,
  description,
  ...content
}: Pick<HomeAppTileContentProps, 'label' | 'tone'> & {
  id: string
  href: string
  description: string
}) {
  return (
    <Link href={href} className={styles.tile} aria-label={content.label} aria-describedby={id}>
      <HomeAppTileContent {...content} />
      <span id={id} className="sr-only">{description}</span>
    </Link>
  )
}
