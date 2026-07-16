import { describe, expect, it } from 'vitest'
import { withTimeout } from '../mobile/src/lib/network'

describe('mobile startup timeout', () => {
  it('returns a successful request before the deadline', async () => {
    await expect(withTimeout(Promise.resolve('ready'), 50, 'timeout')).resolves.toBe('ready')
  })

  it('rejects a stalled request so the loading screen can recover', async () => {
    await expect(withTimeout(new Promise(() => undefined), 5, '로그인 확인 시간이 초과되었습니다.')).rejects.toThrow('로그인 확인 시간이 초과되었습니다.')
  })
})
