import { analyzeTextForSafety } from '@/lib/moderation'
import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import { parseBoard, parseContentMentions } from '@/lib/contentInput'
import { guardMutation } from '@/lib/mutationGuard'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '게시글을 작성할 권한이 없습니다.' }, { status: 403 })

  const blocked = await guardMutation(request, {
    bucket: 'post-create',
    identity: user.id,
    limit: 5,
    windowSeconds: 60 * 60,
  })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  const board = parseBoard(body?.board)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const content = typeof body?.content === 'string' ? body.content.trim() : ''
  const mentions = parseContentMentions(body?.mentions, user.id)

  if (!board) return Response.json({ error: '게시판을 선택해주세요.' }, { status: 400 })
  if (title.length < 2 || title.length > 80) return Response.json({ error: '제목은 2자 이상 80자 이하로 작성해주세요.' }, { status: 400 })
  if (content.length < 10 || content.length > 2000) return Response.json({ error: '내용은 10자 이상 2000자 이하로 작성해주세요.' }, { status: 400 })
  if (!mentions) return Response.json({ error: '첨부 정보를 확인하지 못했습니다.' }, { status: 400 })
  if (analyzeTextForSafety(`${title}\n${content}`).blockingIssues.length > 0) {
    return Response.json({ error: '개인 정보나 외부 연락 수단으로 보이는 표현을 제거해주세요.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('posts')
    .insert({
      board,
      title,
      content,
      status: 'visible',
      author_user_id: user.id,
      tags: [],
      mentions,
    })
    .select('id')
    .single<{ id: string }>()

  if (error) {
    console.error('Post creation failed:', error.message)
    const policyMessage = error.code === 'P0001' ? error.message : '게시글을 등록하지 못했습니다.'
    return Response.json({ error: policyMessage }, { status: error.code === 'P0001' ? 429 : 500 })
  }

  const { error: authorLinkError } = await supabaseAdmin.from('post_author_links').insert({
    post_id: data.id,
    user_id: user.id,
    user_email: user.email?.toLowerCase() ?? null,
  })
  if (authorLinkError) {
    console.error('Post author audit link failed:', authorLinkError.message)
    await supabaseAdmin.from('posts').delete().eq('id', data.id)
    return Response.json({ error: '게시글 기록을 안전하게 저장하지 못했습니다.' }, { status: 500 })
  }

  return Response.json({ ok: true, id: data.id })
}
