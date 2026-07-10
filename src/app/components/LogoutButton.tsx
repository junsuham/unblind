'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type LogoutButtonProps = {
  compact?: boolean
}

export default function LogoutButton({ compact = false }: LogoutButtonProps) {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={
        compact
          ? 'min-h-11 rounded-full bg-white/75 px-4 text-[15px] font-semibold text-[#ff4b00] shadow-sm backdrop-blur-xl active:bg-[#E5E5EA]'
          : 'flex min-h-[52px] flex-1 items-center justify-center rounded-[16px] bg-[#ff4b00] px-4 text-[17px] font-semibold text-white active:scale-[0.99]'
      }
    >
      로그아웃
    </button>
  )
}
