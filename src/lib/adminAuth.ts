import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  const expectedToken = process.env.ADMIN_SESSION_TOKEN

  if (!expectedToken) {
    throw new Error('Missing ADMIN_SESSION_TOKEN')
  }

  const cookieStore = await cookies()
  const currentToken = cookieStore.get('admin_session')?.value

  if (!currentToken || currentToken !== expectedToken) {
    redirect('/admin/login')
  }
}
