/** Null means no stored role exists and rollout bootstrap may be considered. */
export function storedAdminRoleDecision(
  role: { is_active: boolean } | null,
  lookupFailed: boolean,
): boolean | null {
  if (lookupFailed) return false
  return role ? role.is_active : null
}

export function bootstrapAdminRoleDecision(
  isBootstrapEmail: boolean,
  writeFailed: boolean,
) {
  return isBootstrapEmail && !writeFailed
}
