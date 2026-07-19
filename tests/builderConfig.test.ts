import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BUILDER_HOME_MODEL,
  BUILDER_HOME_PREVIEW_PATH,
  getBuilderPublicApiKey,
  isBuilderConfigured,
} from '../src/lib/builder'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('Builder.io home configuration', () => {
  it('uses a stable section model and preview path', () => {
    expect(BUILDER_HOME_MODEL).toBe('unblind-home-section')
    expect(BUILDER_HOME_PREVIEW_PATH).toBe('/builder-preview/home')
  })

  it('stays disabled when no public key is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_BUILDER_API_KEY', '')

    expect(getBuilderPublicApiKey()).toBe('')
    expect(isBuilderConfigured()).toBe(false)
  })

  it('normalizes the public key before enabling Builder', () => {
    vi.stubEnv('NEXT_PUBLIC_BUILDER_API_KEY', '  public-key  ')

    expect(getBuilderPublicApiKey()).toBe('public-key')
    expect(isBuilderConfigured()).toBe(true)
  })
})
