const allowedPrefixes = ['/post/', '/board/', '/activity', '/notifications', '/manitto', '/praise']

export function getSafeNotificationHref(href: unknown, postId?: string | null) {
  if (typeof href === 'string' && href.startsWith('/') && !href.startsWith('//')) {
    const path = href.split(/[?#]/, 1)[0]
    if (allowedPrefixes.some((prefix) => path === prefix || path.startsWith(prefix))) {
      return href
    }
  }

  return postId ? `/post/${encodeURIComponent(postId)}` : null
}
