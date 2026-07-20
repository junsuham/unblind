import Link from 'next/link'
import type { ReactNode } from 'react'

type AdminPageShellProps = {
  children: ReactNode
}

export function AdminPageShell({ children }: AdminPageShellProps) {
  return (
    <main className="admin-ios-surface min-h-screen px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-6">
      <section className="mx-auto max-w-[520px]">
        {children}
      </section>
    </main>
  )
}

type AdminHeaderProps = {
  eyebrow?: string
  title: ReactNode
  description?: string
  action?: ReactNode
}

export function AdminHeader({
  eyebrow = '운영자 전용',
  title,
  description,
  action,
}: AdminHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 ios-caption font-semibold text-[var(--admin-text-tertiary)]">
            {eyebrow}
          </p>

          <h1 className="ios-large-title text-[var(--admin-text)]">
            {title}
          </h1>
        </div>

        {action}
      </div>

      {description && (
        <p className="mt-3 ios-body text-[var(--admin-text-secondary)]">
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
    <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(96px,1fr))]">
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
      ? 'border-[var(--admin-danger-soft)] bg-[var(--admin-danger-soft)]'
      : tone === 'warning'
        ? 'border-[var(--admin-warning-soft)] bg-[var(--admin-warning-soft)]'
        : tone === 'success'
          ? 'border-[var(--admin-success-soft)] bg-[var(--admin-success-soft)]'
          : 'border-[var(--admin-border)] bg-[var(--admin-card)]'

  return (
    <div
      className={`rounded-[20px] border p-4 text-center ${toneClass}`}
    >
      <p className="ios-caption text-[var(--admin-text-secondary)]">
        {label}
      </p>

      <p className="mt-1 text-[28px] font-bold leading-[32px] tracking-[-0.4px] text-[var(--admin-text)]">
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
        <p className="mb-2 px-4 ios-caption font-semibold uppercase tracking-[0.04em] text-[var(--admin-text-tertiary)]">
          {title}
        </p>
      )}

      <div className="admin-ios-card overflow-hidden rounded-[22px]">
        {children}
      </div>

      {footer && (
        <div className="mt-2 px-4 ios-caption text-[var(--admin-text-tertiary)]">
          {footer}
        </div>
      )}
    </section>
  )
}

type AdminListRowProps = {
  href?: string
  title: ReactNode
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
    <div className="border-b border-[var(--admin-separator)] px-4 py-4 last:border-b-0">
      <div className="flex min-h-[52px] items-center gap-3">
        {leading && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--admin-accent)] text-[24px] text-white">
            {leading}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="ios-title truncate text-[var(--admin-text)]">
            {title}
          </p>

          {subtitle && (
            <p className="mt-0.5 ios-secondary text-[var(--admin-text-secondary)]">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {trailing}

          {href && (
            <span className="text-[24px] leading-none text-[var(--admin-text-tertiary)]">
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
      <Link href={href} className="block active:bg-[var(--admin-pressed)]">
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
      ? 'border-[var(--admin-danger-soft)] bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]'
      : tone === 'warning'
        ? 'border-[var(--admin-warning-soft)] bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]'
        : 'border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-secondary)]'

  return (
    <div className={`rounded-[22px] border p-4 ${toneClass}`}>
      <p className="ios-title text-[var(--admin-text)]">
        {title}
      </p>

      <div className="mt-1 text-[15px] leading-[21px]">
        {children}
      </div>
    </div>
  )
}
