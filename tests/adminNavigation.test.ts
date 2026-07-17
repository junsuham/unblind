import { describe, expect, it } from 'vitest'
import { shouldExitAdminWebView } from '../mobile/src/lib/adminNavigation'

describe('admin WebView exit navigation', () => {
  const origin = 'https://unblind.example.com'

  it('returns to the native app through the dedicated exit route', () => {
    expect(shouldExitAdminWebView(`${origin}/admin/exit`, origin)).toBe(true)
  })

  it('keeps compatibility with the old root exit link', () => {
    expect(shouldExitAdminWebView(`${origin}/`, origin)).toBe(true)
  })

  it('never treats another origin as a native exit', () => {
    expect(shouldExitAdminWebView('https://accounts.google.com/', origin)).toBe(false)
  })
})
