'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AdminIcon, type AdminIconName } from './AdminIcon'

const items: Array<{
  href: string
  label: string
  icon: AdminIconName
  exact?: boolean
}> = [
  { href: '/admin', label: '홈', icon: 'home', exact: true },
  { href: '/admin/users', label: '사용자', icon: 'users' },
  { href: '/admin/reports', label: '신고', icon: 'alert' },
  { href: '/admin/search', label: '검색', icon: 'search' },
  { href: '/admin/analytics', label: '통계', icon: 'chart' },
]

export default function AdminNavigation() {
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return null
  }

  return (
    <nav
      aria-label="관리자 주요 메뉴"
      className="admin-ios-tabbar fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px] px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-2"
    >
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-[14px] transition-colors ${
                isActive
                  ? 'text-[var(--admin-accent)]'
                  : 'text-[var(--admin-text-tertiary)] active:bg-[var(--admin-pressed)]'
              }`}
            >
              <AdminIcon name={item.icon} className="h-[22px] w-[22px]" />
              <span className="text-[11px] font-semibold leading-[13px]">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
