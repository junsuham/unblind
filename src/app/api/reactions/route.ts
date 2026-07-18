import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import { guardMutation } from '@/lib/mutationGuard'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: Request) {
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const postId = new URL(request.url).searchParams.get('postId')?.trim() ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(postId)) return Response.json({ error: '게시글을 확인하지 못했습니다.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('reactions')
    .select('type')
    .eq('post_id', postId)
    .eq('actor_key', `user:${user.id}`)

  if (error) return Response.json({ error: '공감 상태를 확인하지 못했습니다.' }, { status: 500 })
  return Response.json({ types: (data ?? []).map((item) => item.type) })
}

export async function POST(request: Request) {
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '공감을 남길 권한이 없습니다.' }, { status: 403 })

  const blocked = await guardMutation(request, {
    bucket: 'reaction-create',
    identity: user.id,
    limit: 30,
    windowSeconds: 60,
  })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  const postId = typeof body?.postId === 'string' ? body.postId.trim() : ''
  const type = body?.type === 'pray' || body?.type === 'empathize' ? body.type : null
  if (!/^[0-9a-f-]{36}$/i.test(postId) || !type) return Response.json({ error: '공감 정보를 확인하지 못했습니다.' }, { status: 400 })

  const { data: post } = await supabaseAdmin.from('posts').select('id').eq('id', postId).eq('status', 'visible').maybeSingle()
  if (!post) return Response.json({ error: '공감을 남길 수 없는 게시글입니다.' }, { status: 404 })

  const { error } = await supabaseAdmin.from('reactions').upsert(
    { post_id: postId, actor_key: `user:${user.id}`, type },
    { onConflict: 'post_id,actor_key,type', ignoreDuplicates: true },
  )
  if (error) {
    console.error('Reaction creation failed:', error.message)
    return Response.json({ error: '공감을 남기지 못했습니다.' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
