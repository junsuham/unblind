import Link from 'next/link'
import { SystemIcon, type SystemIconName } from '@/app/components/ui/SystemIcon'
import styles from './HomeAppDrawer.module.css'

export type HomeAppTone = 'sage' | 'rose' | 'apricot' | 'blue' | 'violet' | 'coral' | 'amber'

type HomeAppTileContentProps = {
  icon: SystemIconName
  label: string
  tone: HomeAppTone
  filled?: boolean
  badge?: 'waiting' | 'matched'
  status?: string
  error?: boolean
}

export const homeAppTileClassName = styles.tile

export function HomeAppTileContent({ icon, label, tone, filled, badge, status, error }: HomeAppTileContentProps) {
  return (
    <>
      <span className={styles.icon} data-tone={tone} aria-hidden="true">
        <SystemIcon name={icon} size={25} filled={filled} />
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
}: Pick<HomeAppTileContentProps, 'icon' | 'label' | 'tone' | 'filled'> & {
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
