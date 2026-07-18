import { analyzeTextForSafety } from '@/lib/moderation'
import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import { parseContentMentions } from '@/lib/contentInput'
import { guardMutation } from '@/lib/mutationGuard'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '댓글을 작성할 권한이 없습니다.' }, { status: 403 })

  const blocked = await guardMutation(request, {
    bucket: 'comment-create',
    identity: user.id,
    limit: 20,
    windowSeconds: 10 * 60,
  })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  const postId = typeof body?.postId === 'string' ? body.postId.trim() : ''
  const content = typeof body?.content === 'string' ? body.content.trim() : ''
  const mentions = parseContentMentions(body?.mentions, user.id)

  if (!/^[0-9a-f-]{36}$/i.test(postId)) return Response.json({ error: '게시글을 확인하지 못했습니다.' }, { status: 400 })
  if (content.length < 2 || content.length > 1000) return Response.json({ error: '댓글은 2자 이상 1000자 이하로 작성해주세요.' }, { status: 400 })
  if (!mentions || mentions.some((mention) => mention.type === 'image')) return Response.json({ error: '댓글 첨부 정보를 확인하지 못했습니다.' }, { status: 400 })
  if (analyzeTextForSafety(content).blockingIssues.length > 0) {
    return Response.json({ error: '개인 정보나 외부 연락 수단으로 보이는 표현을 제거해주세요.' }, { status: 400 })
  }

  const { data: post } = await supabaseAdmin
    .from('posts')
    .select('id')
    .eq('id', postId)
    .eq('status', 'visible')
    .maybeSingle<{ id: string }>()
  if (!post) return Response.json({ error: '댓글을 작성할 수 없는 게시글입니다.' }, { status: 404 })

  const { data: comment, error } = await supabaseAdmin
    .from('comments')
    .insert({
      post_id: postId,
      content,
      status: 'visible',
      author_user_id: user.id,
      mentions,
    })
    .select('id')
    .single<{ id: string }>()

  if (error) {
    console.error('Comment creation failed:', error.message)
    const policyMessage = error.code === 'P0001' ? error.message : '댓글을 등록하지 못했습니다.'
    return Response.json({ error: policyMessage }, { status: error.code === 'P0001' ? 429 : 500 })
  }

  const { error: authorLinkError } = await supabaseAdmin.from('comment_author_links').insert({
    comment_id: comment.id,
    post_id: postId,
    user_id: user.id,
    user_email: user.email?.toLowerCase() ?? null,
  })
  if (authorLinkError) {
    console.error('Comment author audit link failed:', authorLinkError.message)
    await supabaseAdmin.from('comments').delete().eq('id', comment.id)
    return Response.json({ error: '댓글 기록을 안전하게 저장하지 못했습니다.' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
