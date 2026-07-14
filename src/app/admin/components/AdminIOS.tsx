import Link from 'next/link'
import type { ReactNode } from 'react'

type AdminPageShellProps = {
  children: ReactNode
}

export function AdminPageShell({ children }: AdminPageShellProps) {
  return (
    <main className="ub-app-surface min-h-screen px-4 pb-10 pt-8 text-[var(--ub-text-on-brand-primary)]">
      <section className="mx-auto max-w-[430px]">
        {children}
      </section>
    </main>
  )
}

type AdminHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  action?: ReactNode
}

export function AdminHeader({
  eyebrow = '운영자 전용',
  title,
  description,
  backHref,
  backLabel = '관리자 홈',
  action,
}: AdminHeaderProps) {
  return (
    <header className="mb-8">
      {backHref && (
        <Link
          href={backHref}
          className="mb-4 inline-flex min-h-11 items-center rounded-full bg-[var(--ub-surface-card)] px-4 ios-title text-[var(--ub-color-brand)] shadow-sm backdrop-blur-xl active:bg-[var(--ub-surface-pressed)]"
        >
          ‹ {backLabel}
        </Link>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 ios-caption font-semibold text-[var(--ub-text-on-brand-tertiary)]">
            {eyebrow}
          </p>

          <h1 className="ios-large-title text-white">
            {title}
          </h1>
        </div>

        {action}
      </div>

      {description && (
        <p className="mt-3 ios-body text-[var(--ub-text-on-brand-secondary)]">
          {description}
        </p>
      )}
    </header>
  )
}

type AdminStatGridProps = {
  children: ReactNode
}

export function AdminStatGrid({ children }: AdminStatGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {children}
    </div>
  )
}

type AdminStatCardProps = {
  label: string
  value: number | string
  tone?: 'default' | 'danger' | 'warning' | 'success'
}

export function AdminStatCard({
  label,
  value,
  tone = 'default',
}: AdminStatCardProps) {
  const toneClass =
    tone === 'danger'
      ? 'border-[#FF3B30]/20 bg-[#FF3B30]/10'
      : tone === 'warning'
        ? 'border-[#ff4b00]/25 bg-[#ff4b00]/10'
        : tone === 'success'
          ? 'border-green-200 bg-green-50'
          : 'border-[var(--ub-glass-border)] bg-[var(--ub-surface-card)]'

  return (
    <div
      className={`rounded-[22px] border p-4 text-center shadow-sm backdrop-blur-2xl ${toneClass}`}
    >
      <p className="ios-caption text-[var(--ub-text-secondary)]">
        {label}
      </p>

      <p className="mt-1 text-[28px] font-bold leading-[32px] tracking-[-0.4px] text-[var(--ub-text-primary)]">
        {value}
      </p>
    </div>
  )
}

type AdminListGroupProps = {
  title?: string
  children: ReactNode
  footer?: ReactNode
}

export function AdminListGroup({
  title,
  children,
  footer,
}: AdminListGroupProps) {
  return (
    <section className="mb-6">
      {title && (
        <p className="mb-2 px-4 ios-caption font-semibold uppercase tracking-[0.04em] text-[var(--ub-text-on-brand-tertiary)]">
          {title}
        </p>
      )}

      <div className="overflow-hidden rounded-[22px] bg-[var(--ub-surface-card-strong)] shadow-[var(--ub-shadow-soft)]">
        {children}
      </div>

      {footer && (
        <div className="mt-2 px-4 ios-caption text-[var(--ub-text-on-brand-tertiary)]">
          {footer}
        </div>
      )}
    </section>
  )
}

type AdminListRowProps = {
  href?: string
  title: string
  subtitle?: string
  leading?: ReactNode
  trailing?: ReactNode
  children?: ReactNode
}

export function AdminListRow({
  href,
  title,
  subtitle,
  leading,
  trailing,
  children,
}: AdminListRowProps) {
  const content = (
    <div className="border-b border-[var(--ub-separator)] px-4 py-4 last:border-b-0">
      <div className="flex min-h-[52px] items-center gap-3">
        {leading && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#ff4b00] text-[24px]">
            {leading}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="ios-title truncate text-[var(--ub-text-primary)]">
            {title}
          </p>

          {subtitle && (
            <p className="mt-0.5 ios-secondary">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {trailing}

          {href && (
            <span className="text-[24px] leading-none text-[var(--ub-text-tertiary)]">
              ›
            </span>
          )}
        </div>
      </div>

      {children && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block active:bg-[var(--ub-surface-pressed)]">
        {content}
      </Link>
    )
  }

  return content
}

type AdminNoticeProps = {
  title: string
  children: ReactNode
  tone?: 'default' | 'warning' | 'danger'
}

export function AdminNotice({
  title,
  children,
  tone = 'default',
}: AdminNoticeProps) {
  const toneClass =
    tone === 'danger'
      ? 'border-[#FF3B30]/20 bg-[#FF3B30]/10 text-[#7A1A16]'
      : tone === 'warning'
        ? 'border-[#ff4b00]/25 bg-[#ff4b00]/10 text-[#5C2500]'
        : 'border-[var(--ub-glass-border)] bg-[var(--ub-surface-card)] text-[var(--ub-text-secondary)]'

  return (
    <div className={`rounded-[22px] border p-4 shadow-sm backdrop-blur-2xl ${toneClass}`}>
      <p className="ios-title text-[var(--ub-text-primary)]">
        {title}
      </p>

      <div className="mt-1 ios-secondary">
        {children}
      </div>
    </div>
  )
}
