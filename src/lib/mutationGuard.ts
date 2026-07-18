import 'server-only'

import { consumeRequestRateLimit } from '@/lib/rateLimit'
import { isSafeMutationRequest } from '@/lib/security'

type MutationGuardOptions = {
  bucket: string
  identity: string
  limit?: number
  windowSeconds?: number
}

export async function guardMutation(
  request: Request,
  {
    bucket,
    identity,
    limit = 30,
    windowSeconds = 60,
  }: MutationGuardOptions,
) {
  if (!isSafeMutationRequest(request)) {
    return Response.json(
      { error: '요청 출처를 확인하지 못했습니다. 앱을 새로 열고 다시 시도해주세요.' },
      { status: 403 },
    )
  }

  const rateLimit = await consumeRequestRateLimit(request, {
    bucket,
    identity,
    limit,
    windowSeconds,
  })

  if (rateLimit.unavailable) {
    return Response.json(
      { error: '요청 보호 기능을 확인하는 중입니다. 잠시 후 다시 시도해주세요.' },
      { status: 503, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
    )
  }

  if (!rateLimit.allowed) {
    return Response.json(
      { error: '요청이 너무 빠르게 반복되었습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
    )
  }

  return null
}
