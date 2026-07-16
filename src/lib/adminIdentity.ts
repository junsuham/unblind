const defaultAdminEmails = ['gkawnst95@gmail.com', 'gkawnstn95@gmail.com']

function configuredAdminEmails() {
  const configured = process.env.ADMIN_EMAILS
    ?.split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  return Array.from(new Set([...defaultAdminEmails, ...(configured ?? [])]))
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false

  return configuredAdminEmails().includes(email.trim().toLowerCase())
}
