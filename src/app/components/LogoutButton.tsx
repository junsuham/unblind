'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SystemIcon } from '@/app/components/ui/SystemIcon'

type LogoutButtonProps = {
  compact?: boolean
  iconOnly?: boolean
}

export default function LogoutButton({ compact = false, iconOnly = false }: LogoutButtonProps) {
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
      aria-label={iconOnly ? '로그아웃' : undefined}
      title={iconOnly ? '로그아웃' : undefined}
      className={
        iconOnly
          ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/72 transition-colors active:bg-white/10 active:text-white'
          : compact
          ? 'min-h-11 rounded-full bg-[var(--ub-surface-glass)] px-4 text-[15px] font-semibold text-[var(--ub-color-brand)] shadow-sm backdrop-blur-xl active:bg-[var(--ub-surface-pressed)]'
          : 'flex min-h-[52px] w-full items-center justify-center rounded-[16px] bg-[#ff4b00] px-4 text-[17px] font-semibold text-white active:scale-[0.99]'
      }
    >
      {iconOnly ? <SystemIcon name="logout" size={21} /> : '로그아웃'}
    </button>
  )
}
