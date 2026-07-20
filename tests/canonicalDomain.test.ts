import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const canonicalDomain = 'https://unbd.vercel.app'
const legacyDomain = 'https://unblind-omega.vercel.app'
const files = [
  '../mobile/src/lib/api.ts',
  '../mobile/src/providers/AuthProvider.tsx',
  '../mobile/.env.example',
  '../mobile/scripts/sync-env.mjs',
  '../mobile/APP_STORE_RELEASE.md',
  '../src/lib/churchSearch.ts',
  '../src/lib/locationSearch.ts',
]

describe('canonical production domain', () => {
  it('uses unbd.vercel.app across mobile and server configuration', () => {
    for (const file of files) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8')
      expect(source, file).toContain(canonicalDomain)
      expect(source, file).not.toContain(legacyDomain)
    }
  })
})
