import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabaseServer'
import { generateBiblicalNickname } from '@/lib/profile'
import ProfileSetupForm from './ProfileSetupForm'
import {
  AppShell,
  PageHeader,
  Pill,
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
        eyebrow="가입 정보"
        title="나를 소개해주세요"
        description="연령을 확인하고 출석 교회와 현재 상태를 입력하면 운영자에게 승인 요청이 전달됩니다."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Pill>정보 비공개</Pill>
        <Pill>익명 아이디</Pill>
        <Pill>관리자 승인</Pill>
      </div>

      <ProfileSetupForm nickname={generateBiblicalNickname(user.id)} />
    </AppShell>
  )
}
