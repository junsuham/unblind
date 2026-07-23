import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import { isPrayerStage, prayerStageOrder } from '@/lib/prayerJourney'
import { guardMutation } from '@/lib/mutationGuard'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const blocked = await guardMutation(request, {
    bucket: 'prayer-journey',
    identity: user.id,
    limit: 12,
    windowSeconds: 60,
  })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  const postId = typeof body?.postId === 'string' ? body.postId.trim() : ''
  const stage = body?.stage
  if (!/^[0-9a-f-]{36}$/i.test(postId) || !isPrayerStage(stage)) {
    return Response.json({ error: '기도여정 정보를 확인하지 못했습니다.' }, { status: 400 })
  }

  const { data: post, error: postError } = await supabaseAdmin
    .from('posts')
    .select('id, board, author_user_id, prayer_stage, title')
    .eq('id', postId)
    .eq('status', 'visible')
    .maybeSingle<{
      id: string
      board: string
      author_user_id: string | null
      prayer_stage: string | null
      title: string
    }>()

  if (postError || !post || post.board !== 'prayer') {
    return Response.json({ error: '기도 게시글을 찾지 못했습니다.' }, { status: 404 })
  }
  if (post.author_user_id !== user.id) {
    return Response.json({ error: '작성자만 기도여정을 변경할 수 있습니다.' }, { status: 403 })
  }

  const current = isPrayerStage(post.prayer_stage) ? post.prayer_stage : 'requested'
  const currentIndex = prayerStageOrder.indexOf(current)
  const nextIndex = prayerStageOrder.indexOf(stage)
  if (nextIndex < currentIndex || nextIndex > currentIndex + 1) {
    return Response.json({ error: '기도여정은 한 단계씩 진행해주세요.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('posts')
    .update({ prayer_stage: stage })
    .eq('id', post.id)

  if (error) {
    console.error('Prayer journey update failed:', error.message)
    return Response.json({ error: '기도여정을 변경하지 못했습니다.' }, { status: 500 })
  }

  if (stage === 'answered' || stage === 'grateful') {
    const { data: reactions, error: reactionError } = await supabaseAdmin
      .from('reactions')
      .select('actor_key')
      .eq('post_id', post.id)
      .eq('type', 'pray')

    if (reactionError) {
      console.error('Prayer journey participant read failed:', reactionError.message)
    } else {
      const userIds = Array.from(
        new Set(
          (reactions ?? [])
            .map((reaction) =>
              String(reaction.actor_key).replace(/^user:/, '')
            )
            .filter(
              (value) =>
                /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) &&
                value !== user.id
            )
        )
      )

      if (userIds.length) {
        const { error: notificationError } = await supabaseAdmin
          .from('notifications')
          .insert(
            userIds.map((participantId) => ({
              user_id: participantId,
              type: 'system',
              post_id: post.id,
              href: `/post/${post.id}`,
              title:
                stage === 'answered'
                  ? '함께 기도한 제목에 응답 소식이 있어요'
                  : '함께 기도한 제목에 감사가 이어졌어요',
              body: post.title,
            }))
          )

        if (notificationError) {
          console.error('Prayer journey notification failed:', notificationError.message)
        }
      }
    }
  }

  return Response.json({ stage })
}
