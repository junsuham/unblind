import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import AdminNavigation from './components/AdminNavigation'
import { AdminIcon } from './components/AdminIcon'

export const metadata: Metadata = {
  title: '관리자 센터 | 언블라인드',
  description: '언블라인드 운영 및 안전 관리 센터',
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="admin-ios-root min-h-screen">
      <header className="admin-ios-topbar sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex min-h-[54px] max-w-[520px] items-center justify-between gap-3 px-4">
          <Link
            href="/admin"
            aria-label="관리자 센터 홈으로 이동"
            className="flex min-h-11 items-center gap-2 active:opacity-70"
          >
            <Image
              src="/brand/unblind-mark-glass.png"
              alt="UNBLIND"
              width={32}
              height={32}
              className="block h-8 w-8 rounded-[9px]"
            />

            <span className="text-[17px] font-semibold tracking-[-0.2px] text-[var(--admin-text)]">
              관리자 센터
            </span>
          </Link>

          <a
            href="/admin/exit"
            aria-label="앱 홈 화면으로 이동"
            title="앱 홈 화면"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--admin-accent-soft)] text-[var(--admin-accent)] active:opacity-70"
          >
            <AdminIcon name="home" className="h-5 w-5" />
          </a>
        </div>
      </header>

      {children}

      <AdminNavigation />
    </div>
  )
}
