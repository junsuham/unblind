import { createHash } from 'node:crypto'

export function getRequestIdentity(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')
    ?.split(',')[0]
    ?.trim()
    .slice(0, 80)
  const address = forwarded || request.headers.get('x-real-ip')?.trim().slice(0, 80) || 'unknown'
  const userAgent = request.headers.get('user-agent')?.trim().slice(0, 160) || 'unknown'
  return `${address}|${userAgent}`
}

export function hashRateLimitKey(identity: string, salt: string) {
  return createHash('sha256').update(`${salt}:${identity}`).digest('hex')
}
