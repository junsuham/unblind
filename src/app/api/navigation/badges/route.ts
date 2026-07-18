import { getRequestUser } from '@/lib/requestUser'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const boards = ['prayer', 'faith', 'daily'] as const

export async function GET(request: Request) {
  const user = await getRequestUser(request)
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data: posts } = await supabaseAdmin
    .from('posts')
    .select('id, board, created_at')
    .in('board', [...boards])
    .eq('status', 'visible')
    .order('created_at', { ascending: false })
    .limit(150)

  const postIds = (posts ?? []).map((post) => post.id)
  const { data: comments } = postIds.length
    ? await supabaseAdmin
        .from('comments')
        .select('post_id, created_at')
        .in('post_id', postIds)
        .eq('status', 'visible')
        .order('created_at', { ascending: false })
        .limit(150)
    : { data: [] as Array<{ post_id: string; created_at: string }> }

  const postBoard = new Map((posts ?? []).map((post) => [post.id, post.board]))
  const activity: Record<(typeof boards)[number], string | null> = {
    prayer: null,
    faith: null,
    daily: null,
  }

  for (const post of posts ?? []) {
    const board = post.board as (typeof boards)[number]
    if (boards.includes(board) && (!activity[board] || post.created_at > activity[board]!)) {
      activity[board] = post.created_at
    }
  }

  for (const comment of comments ?? []) {
    const board = postBoard.get(comment.post_id) as (typeof boards)[number] | undefined
    if (board && (!activity[board] || comment.created_at > activity[board]!)) {
      activity[board] = comment.created_at
    }
  }

  const { count: unreadNotifications } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null)

  return Response.json(
    { activity, unreadNotifications: unreadNotifications ?? 0 },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
