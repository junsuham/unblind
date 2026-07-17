import { timingSafeEqual } from 'node:crypto'

export function secretsEqual(actual: unknown, expected: string | undefined) {
  if (typeof actual !== 'string' || !expected) return false
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

export function isSafeMutationRequest(request: Request) {
  if (request.method === 'GET' || request.method === 'HEAD') return true
  if (request.headers.get('authorization')?.startsWith('Bearer ')) return true

  const origin = request.headers.get('origin')
  return Boolean(origin && origin === new URL(request.url).origin)
}

