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
      className="min-h-11 rounded-full bg-white/85 px-4 text-[15px] font-semibold text-[#ff4b00] shadow-sm backdrop-blur-xl active:bg-[#ffe2d2]"
    >
      로그아웃
    </button>
  )
}
