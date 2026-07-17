import 'server-only'

import { getRequestIdentity, hashRateLimitKey } from '@/lib/rateLimitKey'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type RateLimitOptions = {
  bucket: string
  limit: number
  windowSeconds: number
  identity?: string
}

type RateLimitRow = {
  allowed: boolean
  remaining: number
  retry_after: number
}

function getKeyHash(request: Request, identity?: string) {
  const salt = process.env.ADMIN_SESSION_TOKEN ?? process.env.CRON_SECRET
  if (!salt) return null
  return hashRateLimitKey(identity ?? getRequestIdentity(request), salt)
}

export async function consumeRequestRateLimit(request: Request, options: RateLimitOptions) {
  const keyHash = getKeyHash(request, options.identity)
  if (!keyHash) return { allowed: false, remaining: 0, retryAfter: 60, keyHash: null, unavailable: true }

  const { data, error } = await supabaseAdmin.rpc('consume_rate_limit', {
    p_bucket: options.bucket,
    p_key_hash: keyHash,
    p_window_seconds: options.windowSeconds,
    p_limit: options.limit,
  })

  const result = (data as unknown as RateLimitRow[] | null)?.[0]
  if (error || !result) {
    console.error('rate_limit_unavailable', error?.message ?? 'missing result')
    return { allowed: false, remaining: 0, retryAfter: 60, keyHash, unavailable: true }
  }

  return {
    allowed: result.allowed,
    remaining: result.remaining,
    retryAfter: result.retry_after,
    keyHash,
    unavailable: false,
  }
}

export async function clearRequestRateLimit(bucket: string, keyHash: string | null) {
  if (!keyHash) return
  const { error } = await supabaseAdmin.rpc('clear_rate_limit', {
    p_bucket: bucket,
    p_key_hash: keyHash,
  })
  if (error) console.error('rate_limit_clear_failed', error.message)
}
