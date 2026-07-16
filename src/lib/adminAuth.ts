import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { isAdminEmail } from '@/lib/adminIdentity'
import { getRequestUser } from '@/lib/requestUser'
import { createServerSupabase } from '@/lib/supabaseServer'

function hasAdminCookie(currentToken: string | undefined) {
  const expectedToken = process.env.ADMIN_SESSION_TOKEN
  return Boolean(expectedToken && currentToken === expectedToken)
}

export async function requireAdmin() {
  const cookieStore = await cookies()
  const currentToken = cookieStore.get('admin_session')?.value

  if (hasAdminCookie(currentToken)) return

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isAdminEmail(user?.email)) return

  redirect('/admin/login')
}

export async function isAdminRequest(request: NextRequest) {
  if (hasAdminCookie(request.cookies.get('admin_session')?.value)) return true

  const user = await getRequestUser(request)
  return isAdminEmail(user?.email)
}
