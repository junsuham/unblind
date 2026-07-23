import { Emoji3D } from '@/app/components/ui/Emoji3D'

export function UrgentPrayerBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border border-[var(--ub-danger-border)] bg-[var(--ub-danger-soft)] font-bold text-[var(--ub-danger-text)] ${compact ? 'gap-1 px-2 py-0.5 text-[11px]' : 'gap-1.5 px-2.5 py-1 text-[12px]'}`}
      aria-label="긴급 중보기도 요청"
    >
      <Emoji3D name="siren" size={compact ? 16 : 20} />
      긴급 중보
    </span>
  )
}
