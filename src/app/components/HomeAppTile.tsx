import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from './HomeAppDrawer.module.css'

const pictograms = {
  journey: <><circle cx="12" cy="12" r="9.4" /><path d="m15.6 8.4-2 5.2-5.2 2 2-5.2Z" fill="currentColor" stroke="none" /></>,
  manitto: <path d="M4 10h16v10H4V10Zm-1 0V7.5h18V10M12 7.5V20m0-12.5c-2.9 0-5.2-.6-5.2-2.6a1.9 1.9 0 0 1 2.8-1.6c1 .6 1.7 2 2.4 4.2Zm0 0c2.9 0 5.2-.6 5.2-2.6a1.9 1.9 0 0 0-2.8-1.6c-1 .6-1.7 2-2.4 4.2Z" />,
  gratitude: <><rect x="5" y="3" width="14" height="18" rx="3" /><path d="M9 3v18m5-4.8-2.7-2.4a1.8 1.8 0 0 1 2.7-2.4 1.8 1.8 0 0 1 2.7 2.4L14 16.2Z" /></>,
  recreation: (
    <>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="4.6" />
      <path d="M7.6 7.6h.01m8.78 0h.01M12 12h.01m-4.41 4.4h.01m8.78 0h.01" strokeWidth="2.5" />
    </>
  ),
  mbti: <path d="M12 6C8.6 3.8 5.8 3.8 2.8 4.5v14c3-.7 5.8-.7 9.2 1.5 3.4-2.2 6.2-2.2 9.2-1.5v-14c-3-.7-5.8-.7-9.2 1.5Zm0 0v14m4.6-12v6.5m-2.1-4.3h4.2" />,
  shorts: <><rect x="5.5" y="2.8" width="13" height="18.4" rx="4" /><path d="M10 8.5v7l5.5-3.5Z" fill="currentColor" stroke="none" /></>,
  praise: <path d="M3.2 15v-2.7a8.8 8.8 0 0 1 17.6 0V15M3.2 16.5v-1.7a2.3 2.3 0 0 1 2.3-2.3h2.6v7.3H5.5a2.3 2.3 0 0 1-2.3-2.3Zm17.6 0v-1.7a2.3 2.3 0 0 0-2.3-2.3h-2.6v7.3h2.6a2.3 2.3 0 0 0 2.3-2.3Z" />,
} satisfies Record<string, ReactNode>

export type HomeAppKind = keyof typeof pictograms

type HomeAppTileContentProps = {
  label: string
  kind: HomeAppKind
  badge?: 'waiting' | 'matched'
  status?: string
  error?: boolean
}

export const homeAppTileClassName = styles.tile

export function HomeAppTileContent({ label, kind, badge, status, error }: HomeAppTileContentProps) {
  return (
    <>
      <span className={styles.icon} data-app-icon={kind} aria-hidden="true">
        <span className={styles.iconFace}>
          <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false">
            {pictograms[kind]}
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
}: Pick<HomeAppTileContentProps, 'label' | 'kind'> & {
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
