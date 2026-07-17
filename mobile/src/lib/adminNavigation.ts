export function shouldExitAdminWebView(rawUrl: string, allowedOrigin: string) {
  try {
    const url = new URL(rawUrl)
    if (url.origin !== allowedOrigin) return false

    return (
      url.pathname === '/admin/exit' ||
      (url.pathname === '/' && url.search === '')
    )
  } catch {
    return false
  }
}
