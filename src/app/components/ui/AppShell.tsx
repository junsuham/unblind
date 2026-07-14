'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { SystemIcon, type SystemIconName } from './SystemIcon'

type AppShellProps = {
  children: ReactNode
  bottomBar?: ReactNode
  showTopLogo?: boolean
}

function TopLogoBar() {
  return (
    <div className="ub-logo-surface -mx-4 -mt-[calc(18px+env(safe-area-inset-top))] mb-6 px-4 pt-[calc(18px+env(safe-area-inset-top))] pb-4">
      <div className="mx-auto flex max-w-[430px] justify-center">
        <Link
          href="/"
          aria-label="언블라인드 홈으로 이동"
          className="flex min-h-11 items-center justify-center active:scale-[0.99]"
        >
          <img
            src="/unblind-logo.png"
            alt="UNBLIND"
            className="block h-auto w-[220px]"
          />
        </Link>
      </div>
    </div>
  )
}

export function AppShell({
  children,
  bottomBar,
  showTopLogo = true,
}: AppShellProps) {
  return (
    <main className="ub-app-surface min-h-screen px-4 pb-[calc(108px+env(safe-area-inset-bottom))] pt-[calc(18px+env(safe-area-inset-top))] text-[var(--ub-text-on-brand-primary)]">
      {showTopLogo && <TopLogoBar />}

      <section className="mx-auto max-w-[430px]">
        {children}
      </section>

      {bottomBar && (
        <div className="ub-bottom-fade pointer-events-none fixed inset-x-0 bottom-0 z-30 h-32" />
      )}

      {bottomBar}
    </main>
  )
}

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  action?: ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  description,
  backHref,
  backLabel = '뒤로',
  action,
}: PageHeaderProps) {
  return (
    <header className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="mb-4 inline-flex min-h-11 items-center rounded-[var(--ub-radius-pill)] bg-[var(--ub-surface-card)] px-4 ios-title text-[var(--ub-color-brand)] shadow-sm backdrop-blur-xl active:bg-[var(--ub-surface-pressed)]"
        >
          ‹ {backLabel}
        </Link>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1 ios-caption font-semibold text-[var(--ub-text-on-brand-tertiary)]">
              {eyebrow}
            </p>
          )}

          <h1 className="ios-large-title text-[var(--ub-text-on-brand-primary)]">
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

type GlassCardProps = {
  children: ReactNode
  className?: string
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`rounded-[var(--ub-radius-xl)] border border-[var(--ub-glass-border)] bg-[var(--ub-surface-card)] p-5 text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-card)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  )
}

type IosListGroupProps = {
  children: ReactNode
  title?: string
  footer?: ReactNode
}

export function IosListGroup({ children, title, footer }: IosListGroupProps) {
  return (
    <div className="mb-6">
      {title && (
        <p className="mb-2 px-4 ios-caption font-semibold uppercase tracking-[0.04em] text-[var(--ub-text-on-brand-tertiary)]">
          {title}
        </p>
      )}

      <div className="overflow-hidden rounded-[18px] bg-[var(--ub-surface-card-strong)] text-[var(--ub-text-primary)] shadow-sm">
        {children}
      </div>

      {footer && (
        <div className="mt-2 px-4 ios-caption text-[var(--ub-text-on-brand-primary)]/80">
          {footer}
        </div>
      )}
    </div>
  )
}

type IosListRowProps = {
  href?: string
  title: string
  subtitle?: string
  leading?: ReactNode
  trailing?: ReactNode
}

export function IosListRow({
  href,
  title,
  subtitle,
  leading,
  trailing,
}: IosListRowProps) {
  const content = (
    <div className="flex min-h-[64px] items-center gap-3 border-b border-[var(--ub-separator)] px-4 py-3 last:border-b-0">
      {leading && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--ub-surface-brand-soft)] text-[22px]">
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

      <div className="flex shrink-0 items-center gap-2 text-[15px] text-[var(--ub-text-tertiary)]">
        {trailing}

        {href && (
          <span className="text-[24px] leading-none text-[var(--ub-text-tertiary)]">
            ›
          </span>
        )}
      </div>
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

type NoticeCardProps = {
  title: string
  children: ReactNode
  tone?: 'default' | 'warning' | 'danger'
}

export function NoticeCard({
  title,
  children,
  tone = 'default',
}: NoticeCardProps) {
  const className =
    tone === 'danger'
      ? 'border-[var(--ub-danger-border)] bg-[var(--ub-danger-soft)] text-[var(--ub-danger-text)]'
      : tone === 'warning'
        ? 'border-[var(--ub-warning-border)] bg-[var(--ub-warning-soft)] text-[var(--ub-warning-text)]'
        : 'border-[var(--ub-glass-border)] bg-[var(--ub-surface-card)] text-[var(--ub-text-secondary)]'

  return (
    <div
      className={`rounded-[var(--ub-radius-lg)] border p-4 ios-secondary shadow-sm backdrop-blur-2xl ${className}`}
    >
      <p className="ios-title text-[var(--ub-text-primary)]">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  )
}

type PrimaryButtonLikeProps = {
  href: string
  children: ReactNode
}

export function PrimaryLink({ href, children }: PrimaryButtonLikeProps) {
  return (
    <Link
      href={href}
      className="flex min-h-[52px] items-center justify-center rounded-[16px] bg-[var(--ub-surface-card-strong)] px-5 ios-title text-[var(--ub-color-brand)] shadow-sm active:scale-[0.99]"
    >
      {children}
    </Link>
  )
}

export function SecondaryLink({ href, children }: PrimaryButtonLikeProps) {
  return (
    <Link
      href={href}
      className="flex min-h-[52px] items-center justify-center rounded-[16px] bg-[var(--ub-surface-card-strong)]/78 px-5 ios-title text-[var(--ub-color-brand)] active:scale-[0.99]"
    >
      {children}
    </Link>
  )
}

type PillProps = {
  children: ReactNode
}

export function Pill({ children }: PillProps) {
  return (
    <span className="inline-flex min-h-7 items-center rounded-[var(--ub-radius-pill)] bg-[var(--ub-surface-card)] px-3 ios-caption font-medium text-[var(--ub-text-primary)]/62 shadow-sm backdrop-blur-xl">
      {children}
    </span>
  )
}

type BottomTabKey =
  | 'prayer'
  | 'faith'
  | 'church'
  | 'work'
  | 'relationship'

type BottomTabBarProps = {
  active?: string
}

const bottomTabs: {
  key: BottomTabKey
  label: string
  href: string
  icon: SystemIconName
}[] = [
  {
    key: 'prayer',
    label: '기도',
    href: '/board/prayer',
    icon: 'sparkles',
  },
  {
    key: 'faith',
    label: '신앙',
    href: '/board/faith',
    icon: 'heart',
  },
  {
    key: 'church',
    label: '교회',
    href: '/board/church',
    icon: 'people',
  },
  {
    key: 'work',
    label: '진로',
    href: '/board/work',
    icon: 'leaf',
  },
  {
    key: 'relationship',
    label: '관계',
    href: '/board/relationship',
    icon: 'message',
  },
]

export function BottomTabBar({ active }: BottomTabBarProps) {
  const [isKeyboardActive, setIsKeyboardActive] = useState(false)

  useEffect(() => {
    function isTextInputTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) {
        return false
      }

      const tagName = target.tagName

      return (
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        target.isContentEditable
      )
    }

    function handleFocusIn(event: FocusEvent) {
      if (isTextInputTarget(event.target)) {
        setIsKeyboardActive(true)
      }
    }

    function handleFocusOut() {
      window.setTimeout(() => {
        const activeElement = document.activeElement
        setIsKeyboardActive(isTextInputTarget(activeElement))
      }, 120)
    }

    window.addEventListener('focusin', handleFocusIn)
    window.addEventListener('focusout', handleFocusOut)

    return () => {
      window.removeEventListener('focusin', handleFocusIn)
      window.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  if (isKeyboardActive) {
    return null
  }

  return (
    <nav className="fixed inset-x-0 bottom-[calc(18px+env(safe-area-inset-bottom))] z-40 flex justify-center px-5">
      <div className="grid min-h-[66px] w-full max-w-[390px] grid-cols-5 items-center rounded-[var(--ub-radius-pill)] border border-[var(--ub-glass-border)] bg-[var(--ub-surface-glass)] px-2 shadow-[0_18px_48px_rgba(0,0,0,0.16)] backdrop-blur-2xl">
        {bottomTabs.map((tab) => {
          const isActive = active === tab.key

          return (
            <Link
              key={tab.key}
              href={tab.href}
              className="flex min-h-[56px] flex-col items-center justify-center rounded-[var(--ub-radius-pill)] active:bg-black/5"
            >
              <span
                className={
                  isActive
                    ? 'text-[var(--ub-color-brand)]'
                    : 'text-[var(--ub-text-tertiary)]'
                }
              >
                <SystemIcon name={tab.icon} size={22} />
              </span>

              <span
                className={
                  isActive
                    ? 'mt-1 ios-tab-label font-semibold text-[var(--ub-color-brand)]'
                    : 'mt-1 ios-tab-label text-[var(--ub-text-tertiary)]'
                }
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
