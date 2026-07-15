export const MOBILE_AUTH_REDIRECT_COOKIE = 'unblind_mobile_auth_redirect'

export function getSafeMobileAuthRedirect(value: string | null | undefined) {
  if (!value) return null

  try {
    const url = new URL(value)
    const isInstalledApp =
      url.protocol === 'unblind:' &&
      url.hostname === 'auth' &&
      url.pathname === '/callback'
    const isExpoTunnel =
      url.protocol === 'exp:' &&
      url.hostname.endsWith('.exp.direct') &&
      url.pathname === '/--/auth/callback'

    return isInstalledApp || isExpoTunnel ? url : null
  } catch {
    return null
  }
}
