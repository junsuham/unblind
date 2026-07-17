function configuredAdminEmails() {
  const configured = process.env.ADMIN_EMAILS
    ?.split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  return Array.from(new Set(configured ?? []))
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false

  return configuredAdminEmails().includes(email.trim().toLowerCase())
}
