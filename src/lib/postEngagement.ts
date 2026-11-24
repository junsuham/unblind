export type PostEngagement = {
  post_id: string
  comment_count: number
  pray_count: number
  empathize_count: number
}

export function indexPostEngagement(rows: PostEngagement[] | null) {
  return new Map((rows ?? []).map((row) => [row.post_id, row]))
}
