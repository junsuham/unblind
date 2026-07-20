'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { SystemIcon, type SystemIconName } from './SystemIcon'

type AppShellProps = {
  children: ReactNode
  bottomBar?: ReactNode
  showTopLogo?: boolean
  topTitle?: string
}

function TopLogoBar({ title }: { title?: string }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!searchOpen) return

    const focusFrame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus()
    })

    return () => window.cancelAnimationFrame(focusFrame)
  }, [searchOpen])

  return (
    <div className="ub-logo-surface -mx-4 -mt-[calc(18px+env(safe-area-inset-top))] mb-4 border-b border-white/18 px-4 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex min-h-[56px] max-w-[430px] items-center gap-1">
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <Link
            href="/"
            aria-label="언블라인드 홈으로 이동"
            className={`flex h-11 shrink-0 items-center justify-start active:scale-[0.96] ${title ? 'w-11' : 'w-[116px]'}`}
          >
            <Image
              src={title ? '/brand/unblind-mark-3d-v3.png' : '/brand/unblind-wordmark-3d-v3.png'}
              alt="UNBLIND"
              width={title ? 42 : 116}
              height={title ? 42 : 39}
              priority
              className={title ? 'ub-brand-logo block h-[42px] w-[42px] object-contain' : 'ub-brand-logo block h-[39px] w-[116px] object-contain'}
            />
          </Link>
          {title && (
            <span
              className={`overflow-hidden whitespace-nowrap text-[22px] font-extrabold tracking-[-0.6px] text-white transition-[max-width,opacity] duration-200 ease-out ${
                searchOpen ? 'max-w-0 opacity-0' : 'max-w-[180px] opacity-100'
              }`}
            >
              {title}
            </span>
          )}
        </div>

        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end">
          {searchOpen ? (
            <form
              action="/search"
              method="get"
              role="search"
              className="ub-top-search min-w-0 flex-1"
            >
              <div className="ub-search-control flex h-10 min-w-0 items-center gap-2 rounded-full border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] pl-3 pr-1 text-[var(--ub-text-primary)] shadow-sm">
                <SystemIcon
                  name="search"
                  size={18}
                  className="shrink-0 text-[var(--ub-text-tertiary)]"
                />
                <input
                  ref={searchInputRef}
                  name="q"
                  type="search"
                  aria-label="게시글 검색"
                  placeholder="게시글 검색"
                  className="ub-search-input min-w-0 flex-1 bg-transparent text-[15px] text-[var(--ub-text-primary)] outline-none placeholder:text-[var(--ub-text-tertiary)]"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  aria-label="검색창 닫기"
                  className="ub-search-trigger flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--ub-text-tertiary)] active:bg-[var(--ub-surface-pressed)]"
                >
                  <SystemIcon name="close" size={16} />
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="게시글 검색"
              className="ub-search-trigger flex h-11 w-11 items-center justify-center rounded-full text-white active:bg-white/10"
            >
              <SystemIcon name="search" size={23} />
            </button>
          )}
          <Link
            href="/activity"
            aria-label="내 정보"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white active:bg-white/10"
          >
            <SystemIcon name="person" size={25} />
          </Link>
        </div>
      </div>
    </div>
  )
}

export function AppShell({
  children,
  bottomBar,
  showTopLogo = true,
  topTitle,
}: AppShellProps) {
  return (
    <div className="ub-app-frame">
      <main
        className={`ub-app-scroll ub-app-surface overflow-x-hidden px-4 pt-[calc(18px+env(safe-area-inset-top))] text-[var(--ub-text-on-brand-primary)] ${bottomBar ? 'pb-6' : 'pb-[calc(24px+env(safe-area-inset-bottom))]'}`}
      >
        {showTopLogo && <TopLogoBar title={topTitle} />}

        <section className="mx-auto max-w-[430px]">
          {children}
        </section>
      </main>
      {bottomBar}
    </div>
  )
}

type PageHeaderProps = {
  eyebrow?: string
  title: ReactNode
  titleSize?: 'large' | 'compact'
  description?: string
  backHref?: string
  backLabel?: string
  action?: ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  titleSize = 'large',
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

          <h1
            className={
              titleSize === 'compact'
                ? 'text-[27px] font-bold leading-[34px] tracking-[-0.5px] text-[var(--ub-text-on-brand-primary)]'
                : 'ios-large-title text-[var(--ub-text-on-brand-primary)]'
            }
          >
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

type BottomTabKey =
  | 'home'
  | 'prayer'
  | 'faith'
  | 'daily'
  | 'notifications'
  | 'write'

type BottomTabBarProps = {
  active?: string
}

type BoardActivity = Record<'prayer' | 'faith' | 'daily', string | null>

type NavigationBadgesResult = {
  activity?: BoardActivity
  unreadNotifications?: number
}

const bottomTabs: {
  key: BottomTabKey
  label: string
  href: string
  icon?: SystemIconName
}[] = [
  {
    key: 'home',
    label: '홈',
    href: '/',
    icon: 'home',
  },
  {
    key: 'prayer',
    label: '기도',
    href: '/board/prayer',
    icon: 'prayer',
  },
  {
    key: 'faith',
    label: '신앙',
    href: '/board/faith',
    icon: 'heart',
  },
  {
    key: 'daily',
    label: '일상',
    href: '/board/daily',
    icon: 'sun',
  },
  {
    key: 'notifications',
    label: '알림',
    href: '/notifications',
    icon: 'bell',
  },
  {
    key: 'write',
    label: '글쓰기',
    href: '/post/new',
    icon: 'compose',
  },
]

export function BottomTabBar({ active }: BottomTabBarProps) {
  const router = useRouter()
  const [isKeyboardActive, setIsKeyboardActive] = useState(false)
  const [newBoards, setNewBoards] = useState<Set<string>>(new Set())
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false)

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

  useEffect(() => {
    const storageKey = 'unblind-board-seen-v1'

    function refreshBadges() {
      fetch('/api/navigation/badges')
        .then((response) => response.ok ? response.json() : null)
        .then((result: NavigationBadgesResult | null) => {
        if (!result?.activity) return

        setHasUnreadNotifications(active === 'notifications' ? false : (result.unreadNotifications ?? 0) > 0)

        let stored: string | null = null
        let seen: Partial<BoardActivity> = {}
        try {
          stored = window.localStorage.getItem(storageKey)
          seen = stored ? JSON.parse(stored) as Partial<BoardActivity> : {}
        } catch {
          stored = null
          seen = {}
        }

        if (!stored) {
          try {
            window.localStorage.setItem(storageKey, JSON.stringify(result.activity))
          } catch {
            // Badges remain optional when Safari blocks local storage.
          }
          return
        }

        const next = new Set<string>()
        for (const board of ['prayer', 'faith', 'daily'] as const) {
          const newest = result.activity[board]
          if (newest && newest > (seen[board] ?? '')) next.add(board)
        }

        if (active === 'prayer' || active === 'faith' || active === 'daily') {
          seen[active] = result.activity[active]
          next.delete(active)
          try {
            window.localStorage.setItem(storageKey, JSON.stringify(seen))
          } catch {
            // Keep the in-memory badge state without failing the tab bar.
          }
        }
        setNewBoards(next)
        })
        .catch(() => undefined)
    }

    refreshBadges()
    const interval = window.setInterval(refreshBadges, 30_000)
    return () => window.clearInterval(interval)
  }, [active])

  useEffect(() => {
    const routes = ['/', '/board/prayer', '/board/faith', '/board/daily', '/notifications', '/post/new']
    const prefetchTimer = window.setTimeout(() => {
      routes.forEach((route) => router.prefetch(route))
    }, 700)
    return () => window.clearTimeout(prefetchTimer)
  }, [router])

  if (isKeyboardActive) {
    return null
  }

  return (
    <nav className="ub-app-tabbar relative z-40 flex w-full shrink-0 justify-center border-t border-[var(--ub-separator)] backdrop-blur-2xl">
      <div className="ub-app-tabbar-content grid w-full max-w-[430px] grid-cols-6 items-center overflow-visible px-1">
        {bottomTabs.map((tab) => {
          const isActive = active === tab.key
          const isBoard = tab.key === 'prayer' || tab.key === 'faith' || tab.key === 'daily'
          const isWrite = tab.key === 'write'
          const hasNewActivity = (isBoard && newBoards.has(tab.key)) || (tab.key === 'notifications' && hasUnreadNotifications)

          return (
            <Link
              key={tab.key}
              href={tab.href}
              prefetch
              className="ub-app-tabbar-link relative flex min-w-0 flex-col items-center justify-center rounded-[14px] active:bg-black/5"
            >
              {isWrite && (
                <span className="pointer-events-none absolute -top-[38px] right-0 w-[184px] rounded-[13px] bg-white px-2.5 py-2 text-center text-[10px] font-bold leading-[13px] text-[#fc5230] shadow-lg after:absolute after:right-5 after:top-full after:border-x-[6px] after:border-t-[7px] after:border-x-transparent after:border-t-white">
                  익명으로 기도・고민 나눠주세요
                </span>
              )}
              {hasNewActivity && (
                <span className="absolute left-[calc(50%+8px)] top-2 h-2 w-2 rounded-full bg-[#ff3b30] ring-2 ring-[var(--ub-surface-glass)]" aria-label="새 글 또는 댓글 있음" />
              )}
              <span
                className={isWrite ? 'text-[var(--ub-color-brand)]' : 'text-white'}
              >
                {tab.icon && (
                  <SystemIcon
                    name={tab.icon}
                    size={isWrite ? 24 : 22}
                    filled={isActive && !isWrite}
                  />
                )}
              </span>

              <span
                className={
                  isWrite
                    ? 'ub-app-tabbar-label max-w-full truncate text-[10px] font-semibold leading-3 text-[var(--ub-color-brand)]'
                    : isActive
                      ? 'ub-app-tabbar-label max-w-full truncate text-[10px] font-bold leading-3 text-white'
                      : 'ub-app-tabbar-label max-w-full truncate text-[10px] leading-3 text-white/70'
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
