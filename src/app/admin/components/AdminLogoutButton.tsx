'use client'

import { useRouter } from 'next/navigation'

export default function AdminLogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/logout', {
      method: 'POST',
    })

    router.push('/admin/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      aria-label="로그아웃"
      title="로그아웃"
      className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--admin-accent-soft)] text-[23px] font-semibold text-[var(--admin-accent)] active:opacity-70"
    >
      ⏻
    </button>
  )
}
