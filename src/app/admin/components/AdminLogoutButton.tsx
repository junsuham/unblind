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
      className="min-h-11 rounded-full bg-[var(--ub-surface-card)] px-4 text-[15px] font-semibold text-[var(--ub-color-brand)] shadow-sm backdrop-blur-xl active:bg-[var(--ub-surface-pressed)]"
    >
      로그아웃
    </button>
  )
}
