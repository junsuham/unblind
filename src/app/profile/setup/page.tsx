import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabaseServer'
import { generateBiblicalNickname } from '@/lib/profile'
import { getVerifiedSocialAge } from '@/lib/socialAge'
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

  const verifiedAge = getVerifiedSocialAge(user)

  return (
    <AppShell>
      <PageHeader
        eyebrow="가입 정보"
        title="나를 소개해주세요"
        description="소셜 계정으로 연령을 확인하고 출석 교회와 현재 상태를 입력하면 운영자에게 승인 요청이 전달됩니다."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Pill>정보 비공개</Pill>
        <Pill>익명 아이디</Pill>
        <Pill>관리자 승인</Pill>
      </div>

      {verifiedAge ? (
        <ProfileSetupForm
          nickname={generateBiblicalNickname(user.id)}
          referenceAge={verifiedAge.referenceAge}
        />
      ) : (
        <div className="rounded-[var(--ub-radius-xl)] border border-[var(--ub-warning-border)] bg-[var(--ub-warning-soft)] p-5 text-[var(--ub-warning-text)]">
          <p className="ios-title text-[var(--ub-text-primary)]">소셜 계정 연령 확인이 필요합니다</p>
          <p className="mt-2 ios-secondary">Google 계정에서 생년월일 제공에 동의하고 다시 로그인해주세요. 직접 입력한 생년월일은 인정하지 않습니다.</p>
          <a href="/login" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[var(--ub-color-brand)] px-5 ios-title text-white">다시 로그인</a>
        </div>
      )}
    </AppShell>
  )
}
