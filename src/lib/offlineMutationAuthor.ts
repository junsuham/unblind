export const OFFLINE_MUTATION_AUTHOR_HEADER = 'x-unblind-author-id'

export function hasOfflineMutationAuthorMismatch(request: Request, authenticatedUserId: string): boolean {
  const queuedAuthorId = request.headers.get(OFFLINE_MUTATION_AUTHOR_HEADER)
  return queuedAuthorId !== authenticatedUserId
}
