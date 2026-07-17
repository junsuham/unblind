import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { isAdminUser } from '@/lib/adminRole'
import { getRequestUser } from '@/lib/requestUser'
import { isSafeMutationRequest, secretsEqual } from '@/lib/security'
import { createServerSupabase } from '@/lib/supabaseServer'

function hasAdminCookie(currentToken: string | undefined) {
  return secretsEqual(currentToken, process.env.ADMIN_SESSION_TOKEN)
}

export async function requireAdmin() {
  const cookieStore = await cookies()
  const currentToken = cookieStore.get('admin_session')?.value

  if (hasAdminCookie(currentToken)) return

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (await isAdminUser(user)) return

  redirect('/admin/login')
}

export async function isAdminRequest(request: NextRequest) {
  if (!isSafeMutationRequest(request)) return false
  if (hasAdminCookie(request.cookies.get('admin_session')?.value)) return true

  const user = await getRequestUser(request)
  return isAdminUser(user)
}
