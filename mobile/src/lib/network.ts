export type RetryOptions = {
  attempts?: number
  timeoutMs?: number
  retryDelayMs?: number
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: RetryOptions = {}
) {
  const attempts = Math.max(1, options.attempts ?? 2)
  const timeoutMs = options.timeoutMs ?? 10_000
  const retryDelayMs = options.retryDelayMs ?? 350
  let lastError: unknown

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(input, { ...init, signal: controller.signal })
      if (response.status < 500 || attempt === attempts - 1) return response
      lastError = new Error(`server_${response.status}`)
    } catch (error) {
      lastError = error
      if (attempt === attempts - 1) throw error
    } finally {
      clearTimeout(timeout)
    }

    await wait(retryDelayMs * (attempt + 1))
  }

  throw lastError instanceof Error ? lastError : new Error('네트워크 요청에 실패했습니다.')
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), timeoutMs)
      }),
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}
