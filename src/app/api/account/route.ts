import { isAdminEmail } from '@/lib/adminIdentity'
import { getRequestUser } from '@/lib/requestUser'
import { getVerifiedSocialAge } from '@/lib/socialAge'

export async function GET(request: Request) {
  const user = await getRequestUser(request)

  if (!user) {
    return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const verifiedAge = getVerifiedSocialAge(user)

  return Response.json({
    isAdmin: isAdminEmail(user.email),
    ageVerified: Boolean(verifiedAge),
    referenceAge: verifiedAge?.referenceAge ?? null,
  })
}
