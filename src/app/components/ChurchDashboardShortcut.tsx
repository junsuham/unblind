import Image from 'next/image'
import Link from 'next/link'
import type { ChurchDashboardScope } from '@/lib/churchDashboardScope'

export function ChurchDashboardIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/icons/church-dashboard-v1.webp"
      alt=""
      width={192}
      height={192}
      className={className}
      unoptimized
    />
  )
}

export function ChurchDashboardShortcut({ access, needsChurchConsent = false }: {
  access: ChurchDashboardScope | null
  needsChurchConsent?: boolean
}) {
  const rowClass = 'ub-liquid-card flex min-h-[76px] items-center gap-3 px-4 py-2.5'
  const actionClass = `${rowClass} outline-offset-2 active:brightness-95 focus-visible:outline-2 focus-visible:outline-[var(--ub-color-brand)]`
  const content = (
    <>
      <ChurchDashboardIcon className="h-12 w-12 shrink-0 rounded-[13px] ring-1 ring-black/10" />
      <span className="min-w-0 flex-1">
        <strong className="block text-[15px] text-[var(--ub-text-primary)]">대시보드</strong>
        <span className="mt-0.5 block break-keep text-[11px] leading-4 text-[var(--ub-text-secondary)]">
          {access
            ? `${access.churchName}${access.department ? ` · ${access.department}` : ''} · 읽기 전용`
            : needsChurchConsent
              ? '교회 정보 이용 동의를 먼저 완료해 주세요.'
              : '관리자가 권한을 부여하면 이용할 수 있어요.'}
        </span>
      </span>
    </>
  )

  if (!access && needsChurchConsent) {
    return (
      <Link href="/settings/church-consent" aria-label="대시보드 이용을 위한 교회 정보 동의" prefetch={false} className={actionClass}>
        {content}
        <span className="shrink-0 rounded-full bg-[var(--ub-surface-brand-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--ub-color-brand)]">동의하기</span>
      </Link>
    )
  }
  if (!access) {
    return (
      <section aria-label="대시보드 권한 안내" className={rowClass}>
        {content}
        <span className="shrink-0 rounded-full bg-[var(--ub-surface-muted)] px-2 py-1 text-[10px] font-semibold text-[var(--ub-text-secondary)]">잠김</span>
      </section>
    )
  }

  return (
    <Link
      href="/church-dashboard"
      prefetch={false}
      className={actionClass}
    >
      {content}
      <span className="shrink-0 text-[22px] text-[var(--ub-text-tertiary)]" aria-hidden="true">›</span>
    </Link>
  )
}
