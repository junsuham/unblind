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
      className="min-h-11 rounded-full bg-[var(--admin-accent-soft)] px-4 text-[15px] font-semibold text-[var(--admin-accent)] active:opacity-70"
    >
      로그아웃
    </button>
  )
}
