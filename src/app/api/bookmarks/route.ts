import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import { guardMutation } from '@/lib/mutationGuard'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '게시글을 저장할 권한이 없습니다.' }, { status: 403 })

  const blocked = await guardMutation(request, {
    bucket: 'bookmark-toggle',
    identity: user.id,
    limit: 30,
    windowSeconds: 60,
  })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  const postId = typeof body?.postId === 'string' ? body.postId.trim() : ''
  const saved = body?.saved === true
  if (!/^[0-9a-f-]{36}$/i.test(postId)) return Response.json({ error: '게시글을 확인하지 못했습니다.' }, { status: 400 })

  const { error } = saved
    ? await supabaseAdmin.from('saved_posts').upsert({ user_id: user.id, post_id: postId }, { onConflict: 'user_id,post_id', ignoreDuplicates: true })
    : await supabaseAdmin.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', postId)

  if (error) {
    console.error('Bookmark update failed:', error.message)
    return Response.json({ error: '저장 상태를 변경하지 못했습니다.' }, { status: 500 })
  }

  return Response.json({ ok: true, saved })
}
