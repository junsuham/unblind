import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabaseServer'
import { generateBiblicalNickname } from '@/lib/profile'
import ProfileSetupForm from './ProfileSetupForm'
import {
  AppShell,
  PageHeader,
} from '@/app/components/ui/AppShell'

export const dynamic = 'force-dynamic'

export default async function ProfileSetupPage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('completed_at')
    .eq('user_id', user.id)
    .maybeSingle<{ completed_at: string | null }>()

  if (profile?.completed_at) {
    redirect('/')
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="첫 시작"
        title="안내를 확인하고 가입 정보를 입력해주세요"
        description="입력한 정보는 가입 확인과 안전한 운영에만 사용되며 다른 사용자에게 공개되지 않습니다."
      />

      <ProfileSetupForm nickname={generateBiblicalNickname(user.id)} />
    </AppShell>
  )
}
