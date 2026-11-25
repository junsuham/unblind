import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from './HomeAppDrawer.module.css'

export type HomeAppTone = 'sage' | 'rose' | 'apricot' | 'blue' | 'violet' | 'coral' | 'amber'

// Full shapes on a common grid; the palette changes without changing the artwork.
const iconArt: Record<HomeAppTone, { name: string; glyph: ReactNode }> = {
  sage: {
    name: 'journey',
    glyph: (
      <>
        <circle cx="24" cy="24.5" r="18" className={styles.glyphDepth} />
        <circle cx="24" cy="23.5" r="14.5" />
        <path d="M32.5 15.2a.9.9 0 0 0-1.1-.2l-10.8 5.1a1.2 1.2 0 0 0-.6.6l-5 10.7a.9.9 0 0 0 1.2 1.2l10.7-5a1.2 1.2 0 0 0 .6-.6l5.1-10.8a.9.9 0 0 0-.1-1Z" className={styles.glyphDetail} />
      </>
    ),
  },
  rose: {
    name: 'manitto',
    glyph: (
      <>
        <path fillRule="evenodd" d="M24 11.5c-1.7-4.7-5.6-7-9.1-5.6-3.4 1.3-4.8 5.1-3.4 8.1.6 1.4 1.8 2.5 3.2 3.1h18.6c1.4-.6 2.6-1.7 3.2-3.1 1.4-3-.1-6.8-3.4-8.1-3.5-1.4-7.4.9-9.1 5.6Zm-3 2.5c-.9-3.4-2.8-5.8-4.9-5-1.7.7-2.2 2.5-1.6 3.8.5 1.1 1.8 1.2 3.7 1.2H21Zm6 0c.9-3.4 2.8-5.8 4.9-5 1.7.7 2.2 2.5 1.6 3.8-.5 1.1-1.8 1.2-3.7 1.2H27Z" className={styles.glyphDepth} />
        <rect x="8.5" y="19" width="31" height="21" rx="5.5" className={styles.glyphDepth} />
        <rect x="6" y="15.5" width="36" height="9" rx="3.5" />
        <path d="M21.5 24.5h5V40h-5z" />
      </>
    ),
  },
  apricot: {
    name: 'gratitude',
    glyph: (
      <>
        <rect x="8" y="7.5" width="29" height="34" rx="6" className={styles.glyphDepth} />
        <rect x="12" y="5.5" width="28" height="32" rx="6" />
        <path d="M26 17.2c-2.8-3.7-8.8-1.7-8.8 2.8 0 3.8 4.5 7.2 8.1 10.4a1 1 0 0 0 1.4 0c3.6-3.2 8.1-6.6 8.1-10.4 0-4.5-6-6.5-8.8-2.8Z" className={styles.glyphDetail} />
      </>
    ),
  },
  blue: {
    name: 'recreation',
    glyph: (
      <>
        <rect x="7" y="9" width="34" height="33" rx="9.5" className={styles.glyphDepth} />
        <rect x="7" y="6" width="34" height="33" rx="9.5" />
        <g className={styles.glyphDetail}>
          <circle cx="16" cy="14.5" r="2.8" /><circle cx="32" cy="14.5" r="2.8" />
          <circle cx="24" cy="22.5" r="2.8" />
          <circle cx="16" cy="30.5" r="2.8" /><circle cx="32" cy="30.5" r="2.8" />
        </g>
      </>
    ),
  },
  violet: {
    name: 'mbti',
    glyph: (
      <>
        <path d="M23.5 12.5C19 9.5 13.7 8.5 7.6 9.3A3 3 0 0 0 5 12.2v22.1a2.8 2.8 0 0 0 3.1 2.8c5.9-.7 10.7.1 15.4 3.4V12.5Z" className={styles.glyphDepth} />
        <path d="M24.5 12.5c4.5-3 9.8-4 15.9-3.2a3 3 0 0 1 2.6 2.9v22.1a2.8 2.8 0 0 1-3.1 2.8c-5.9-.7-10.7.1-15.4 3.4V12.5Z" />
        <path d="M33.7 15.8a1.6 1.6 0 0 1 1.6 1.6v3h2.8a1.6 1.6 0 0 1 0 3.2h-2.8v6.6a1.6 1.6 0 0 1-3.2 0v-6.6h-2.8a1.6 1.6 0 0 1 0-3.2h2.8v-3a1.6 1.6 0 0 1 1.6-1.6Z" className={styles.glyphDetail} />
      </>
    ),
  },
  coral: {
    name: 'shorts',
    glyph: (
      <>
        <rect x="16" y="7" width="23.5" height="32" rx="7" transform="rotate(9 27.75 23)" className={styles.glyphDepth} />
        <rect x="9" y="6" width="24.5" height="36" rx="7" />
        <path d="M18 17.3a1.4 1.4 0 0 1 2.1-1.2l10 6.3a1.9 1.9 0 0 1 0 3.2l-10 6.3A1.4 1.4 0 0 1 18 30.7V17.3Z" className={styles.glyphDetail} />
      </>
    ),
  },
  amber: {
    name: 'praise',
    glyph: (
      <>
        <path d="M6.5 27v-4a17.5 17.5 0 0 1 35 0v4h-5v-4a12.5 12.5 0 0 0-25 0v4h-5Z" className={styles.glyphDepth} />
        <rect x="5.5" y="22.5" width="12.5" height="17" rx="5.5" />
        <rect x="30" y="22.5" width="12.5" height="17" rx="5.5" />
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
          <svg className={styles.glyph} width="42" height="42" viewBox="0 0 48 48" fill="currentColor" focusable="false">
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
