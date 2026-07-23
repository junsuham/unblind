import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabaseServer'
import { generateBiblicalNickname } from '@/lib/profile'
import { getVerifiedSocialAge } from '@/lib/socialAge'
import ProfileSetupForm from './ProfileSetupForm'
import {
  AppShell,
  PageHeader,
} from '@/app/components/ui/AppShell'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: '가입 정보 | 언블라인드',
  description: '안전한 커뮤니티 운영을 위해 필요한 가입 정보를 입력합니다.',
}

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

  const verifiedAge = getVerifiedSocialAge(user)
  if (!verifiedAge) {
    redirect('/login?error=Google%20계정의%20연령%20확인이%20필요합니다.%20다시%20로그인해주세요.')
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="첫 시작"
        title="안내를 확인하고 가입 정보를 입력해주세요"
        description="입력한 정보는 가입 확인과 안전한 운영에만 사용되며 다른 사용자에게 공개되지 않습니다."
      />

      <ProfileSetupForm
        nickname={generateBiblicalNickname(user.id)}
        referenceAge={verifiedAge.referenceAge}
      />
    </AppShell>
  )
}
