import { readFile, writeFile } from 'node:fs/promises'

const sourceUrl = new URL('../../.env.local', import.meta.url)
const targetUrl = new URL('../.env.local', import.meta.url)
const source = await readFile(sourceUrl, 'utf8')
const values = new Map(
  source
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const separator = line.indexOf('=')
      return [line.slice(0, separator), line.slice(separator + 1)]
    })
)

const supabaseUrl = values.get('NEXT_PUBLIC_SUPABASE_URL')
const publishableKey = values.get('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')

if (!supabaseUrl || !publishableKey) {
  throw new Error('Root .env.local is missing Supabase public values.')
}

await writeFile(
  targetUrl,
  [
    `EXPO_PUBLIC_SUPABASE_URL=${supabaseUrl}`,
    `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${publishableKey}`,
    'EXPO_PUBLIC_WEB_API_URL=https://unblind-omega.vercel.app',
    '',
  ].join('\n'),
  { mode: 0o600 }
)

console.log('Created mobile/.env.local with public app configuration.')
