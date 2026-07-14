import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabaseServer'

type AllowedUser = {
  email: string
  status: 'active' | 'blocked'
  agreed_at: string | null
  agreed_version: string | null
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
        '소셜 계정에서 이메일을 받지 못했습니다. Kakao 이메일 동의 설정을 확인해주세요.',
    })

    redirect(`/login?${searchParams}`)
  }

  const { data: allowedUser } = await supabase
    .from('allowed_users')
    .select('email, status, agreed_at, agreed_version')
    .ilike('email', user.email)
    .maybeSingle<AllowedUser>()

  if (!allowedUser || allowedUser.status !== 'active') {
    redirect('/pending')
  }

  return {
    supabase,
    user,
    allowedUser,
  }
}

export async function requireBetaUser() {
  const result = await requireAllowedUser()

  if (!result.allowedUser.agreed_at) {
    redirect('/onboarding')
  }

  return result
}
