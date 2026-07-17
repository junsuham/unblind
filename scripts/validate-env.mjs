import nextEnv from '@next/env'

const runningInManagedDeployment = process.env.CI === 'true' || process.env.VERCEL === '1'
const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const alwaysRequired = [
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
  'ADMIN_EMAILS',
]
const deploymentRequired = [
  'ADMIN_PASSWORD',
  'ADMIN_SESSION_TOKEN',
  'CRON_SECRET',
]
const strictDeployment = runningInManagedDeployment
const required = strictDeployment ? [...alwaysRequired, ...deploymentRequired] : alwaysRequired

const missing = required.filter((name) => !process.env[name]?.trim())
const invalid = []

for (const name of ['NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_SUPABASE_URL']) {
  const value = process.env[name]
  if (!value) continue
  try {
    const url = new URL(value)
    if (strictDeployment && url.protocol !== 'https:') invalid.push(`${name} must use https`)
  } catch {
    invalid.push(`${name} must be a valid URL`)
  }
}

for (const name of ['ADMIN_PASSWORD', 'ADMIN_SESSION_TOKEN', 'CRON_SECRET']) {
  const value = process.env[name]
  if (value && value.length < 24) invalid.push(`${name} must contain at least 24 characters`)
}

if (missing.length || invalid.length) {
  if (missing.length) console.error(`Missing environment variables: ${missing.join(', ')}`)
  for (const message of invalid) console.error(message)
  process.exit(1)
}

if (!strictDeployment) {
  const optionalMissing = deploymentRequired.filter((name) => !process.env[name]?.trim())
  if (optionalMissing.length) {
    console.warn(`Local-only warning: ${optionalMissing.join(', ')} are not configured.`)
  }
}

console.log('Environment configuration is valid.')
