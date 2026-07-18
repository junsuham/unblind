import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabaseServer'

type AllowedUser = {
  email: string
  status: 'active' | 'blocked'
  agreed_at: string | null
  agreed_version: string | null
}

type UserProfileGate = {
  completed_at: string
  reference_age: number
}

export async function requireAllowedUser() {
  const supabase = await createServerSupabase()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  if (!user.email) {
    const searchParams = new URLSearchParams({
      error:
        'Google 계정에서 이메일을 받지 못했습니다. Google 계정의 이메일 제공 동의를 확인해주세요.',
    })

    redirect(`/login?${searchParams}`)
  }

  if (user.app_metadata?.provider !== 'google') {
    const searchParams = new URLSearchParams({
      error: '현재는 Google 계정으로만 이용할 수 있습니다. Google로 다시 로그인해주세요.',
    })

    redirect(`/login?${searchParams}`)
  }

  const [{ data: profile }, { data: allowedUser }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('completed_at, reference_age')
      .eq('user_id', user.id)
      .maybeSingle<UserProfileGate>(),
    supabase
      .from('allowed_users')
      .select('email, status, agreed_at, agreed_version')
      .ilike('email', user.email)
      .maybeSingle<AllowedUser>(),
  ])

  if (
    !profile?.completed_at ||
    profile.reference_age < 20 ||
    profile.reference_age > 59
  ) {
    redirect('/profile/setup')
  }

  if (!allowedUser || allowedUser.status !== 'active') {
    redirect('/pending')
  }

  return {
    supabase,
    user,
    allowedUser,
    profile,
  }
}

export async function requireBetaUser() {
  const result = await requireAllowedUser()

  if (!result.allowedUser.agreed_at) {
    redirect('/onboarding')
  }

  return result
}
