import { getRequestUser } from '@/lib/requestUser'
import { SocialAgeError, verifyAndStoreSocialAge } from '@/lib/socialAge'
import { guardMutation } from '@/lib/mutationGuard'

export async function POST(request: Request) {
  const user = await getRequestUser(request)

  if (!user) {
    return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const blocked = await guardMutation(request, {
    bucket: 'profile-verify-age',
    identity: user.id,
    limit: 6,
    windowSeconds: 5 * 60,
  })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  const providerToken =
    typeof body?.providerToken === 'string' ? body.providerToken : ''

  if (!providerToken) {
    return Response.json(
      {
        code: 'AGE_INFORMATION_REQUIRED',
        error: '소셜 계정의 연령 확인 정보가 없습니다. 다시 로그인해주세요.',
      },
      { status: 400 }
    )
  }

  try {
    const verified = await verifyAndStoreSocialAge(user, providerToken)
    return Response.json({
      ok: true,
      ageVerified: true,
      referenceAge: verified.referenceAge,
    })
  } catch (error) {
    if (error instanceof SocialAgeError) {
      return Response.json(
        { code: error.code, error: error.message },
        { status: error.code === 'AGE_RESTRICTED' ? 403 : 400 }
      )
    }

    console.error('Social age verification failed:', error)
    return Response.json(
      { error: '소셜 계정의 연령을 확인하지 못했습니다.' },
      { status: 500 }
    )
  }
}
