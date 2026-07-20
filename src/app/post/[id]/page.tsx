import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { requireBetaUser } from '@/lib/betaAuth'
import {
  formatRelativeTime,
  getAnonymousId,
  getBoardPresentation,
} from '@/lib/communityPresentation'
import CommentForm from './CommentForm'
import PostViewTracker from './PostViewTracker'
import ReactionButtons from './ReactionButtons'
import ReportButton from './ReportButton'
import BookmarkButton from './BookmarkButton'
import BlockUserButton from './BlockUserButton'
import PraiseMentionText from '@/app/components/PraiseMentionText'
import { PRAISE_MENTION_PREFIX, type ContentMention, type ImageContentMention, type PraiseMentionTrack } from '@/lib/praiseMention'
import { AppShell, BottomTabBar, NoticeCard } from '@/app/components/ui/AppShell'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import { Emoji3D } from '@/app/components/ui/Emoji3D'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { UrgentPrayerBadge } from '@/app/components/UrgentPrayerBadge'
import { getVisiblePostTags, isUrgentPrayerPost } from '@/lib/urgentPrayer'

export const dynamic = 'force-dynamic'

type PostDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

type ReactionRow = {
  type: 'pray' | 'empathize'
}

type CommentRow = {
  id: string
  content: string
  mentions: ContentMention[] | null
  created_at: string
  author_user_id: string | null
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const [{ supabase, user }, { id }] = await Promise.all([
    requireBetaUser(),
    params,
  ])

  const [{ data: post, error: postError }, { data: blockedRows }] = await Promise.all([
    supabase
      .from('posts')
      .select('id, board, title, content, mentions, created_at, author_user_id, view_count, tags')
      .eq('id', id)
      .eq('status', 'visible')
      .single(),
    supabase
      .from('user_blocks')
      .select('blocked_user_id')
      .eq('blocker_user_id', user.id),
  ])

  if (postError || !post) notFound()

  const blockedIds = new Set(
    (blockedRows ?? []).map((item) => item.blocked_user_id)
  )
  if (post.author_user_id && blockedIds.has(post.author_user_id)) notFound()

  const [
    { data: rawComments, error: commentsError },
    { data: reactions, error: reactionsError },
    { data: savedPost },
  ] = await Promise.all([
    supabase
      .from('comments')
      .select('id, content, mentions, created_at, author_user_id')
      .eq('post_id', post.id)
      .eq('status', 'visible')
      .order('created_at', { ascending: true })
      .limit(200)
      .returns<CommentRow[]>(),
    supabase
      .from('reactions')
      .select('type')
      .eq('post_id', post.id)
      .returns<ReactionRow[]>(),
    supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', user.id)
      .eq('post_id', post.id)
      .maybeSingle(),
  ])
  const comments = (rawComments ?? []).filter(
    (comment) =>
      !comment.author_user_id || !blockedIds.has(comment.author_user_id)
  )

  const hasPraiseMention =
    post.content.includes(PRAISE_MENTION_PREFIX) ||
    comments.some((comment) => comment.content.includes(PRAISE_MENTION_PREFIX))
  const imageAttachments = ((post.mentions ?? []) as ContentMention[])
    .filter((mention): mention is ImageContentMention => mention.type === 'image')
    .slice(0, 3)
  const isUrgent = isUrgentPrayerPost(post.board, post.tags)
  const visibleTags = getVisiblePostTags(post.tags)
  const [{ data: praiseTracks }, { data: signedImageRows }] = await Promise.all([
    hasPraiseMention
      ? supabase
          .from('top100_tracks')
          .select('youtube_id, title, artist')
          .eq('is_active', true)
          .order('rank')
          .limit(100)
          .returns<PraiseMentionTrack[]>()
      : Promise.resolve({ data: [] as PraiseMentionTrack[] }),
    imageAttachments.length
      ? supabaseAdmin.storage
          .from('post-images')
          .createSignedUrls(imageAttachments.map((attachment) => attachment.storagePath), 60 * 60)
      : Promise.resolve({ data: [] }),
  ])
  const signedImages = (signedImageRows ?? [])
    .map((row, index) => ({
      url: row.signedUrl,
      alt: imageAttachments[index]?.fileName || '게시글 첨부 이미지',
    }))
    .filter((image): image is { url: string; alt: string } => Boolean(image.url))

  const prayCount =
    reactions?.filter((reaction) => reaction.type === 'pray').length ?? 0
  const empathizeCount =
    reactions?.filter((reaction) => reaction.type === 'empathize').length ?? 0

  const board = getBoardPresentation(post.board)
  const postAnonymousId = getAnonymousId(post.id, post.author_user_id)
  const activeTab = ['prayer', 'faith', 'daily'].includes(post.board)
    ? post.board
    : undefined

  return (
    <AppShell
      topTitle={board.name}
      bottomBar={<BottomTabBar active={activeTab} />}
    >
      <PostViewTracker postId={post.id} />

      <header className="mb-4 flex min-h-11 items-center justify-between gap-3 border-b border-white/20 pb-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-[16px] font-black tracking-[-0.02em] text-white"
        >
          {'< UNBLIND'}
        </Link>
        <div className="flex items-center gap-1 rounded-full bg-white/12 px-1.5 py-1 text-white backdrop-blur-xl">
          <BookmarkButton
            postId={post.id}
            userId={user.id}
            initialSaved={Boolean(savedPost)}
          />
          <ReportButton
            targetType="post"
            targetId={post.id}
            label="신고"
          />
        </div>
      </header>

      <article className="overflow-hidden rounded-[22px] bg-[var(--ub-surface-card-strong)] shadow-[var(--ub-shadow-soft)]">
        <header className="px-5 pb-5 pt-5">
          <div className="flex items-center gap-1.5 text-[13px] text-[var(--ub-text-tertiary)]">
            <Emoji3D name={board.icon} size={21} />
            <span className="font-bold text-[var(--ub-text-primary)]">{board.name}</span>
            <span>·</span>
            <time dateTime={post.created_at}>{formatRelativeTime(post.created_at)}</time>
          </div>
          <p className="mt-1.5 text-[13px] font-semibold text-[var(--ub-text-secondary)]">
            {postAnonymousId}
          </p>

          {isUrgent && <div className="mt-4"><UrgentPrayerBadge /></div>}

          <h1 className="mt-6 break-words text-[26px] font-extrabold leading-[35px] tracking-[-0.035em] text-[var(--ub-text-primary)]">
            {post.title}
          </h1>
        </header>

        <div className="border-t border-[var(--ub-separator)] px-5 py-7">
          <p className="whitespace-pre-wrap text-[17px] leading-[28px] text-[var(--ub-text-primary)]">
            <PraiseMentionText
              content={post.content}
              mentions={post.mentions as ContentMention[] | null}
              tracks={praiseTracks ?? []}
            />
          </p>

          {signedImages.length > 0 && (
            <div className="mt-6 grid gap-3">
              {signedImages.map((image) => (
                <div key={image.url} className="overflow-hidden rounded-[18px] bg-black/8">
                  <Image
                    src={image.url}
                    alt={image.alt}
                    width={1200}
                    height={1200}
                    unoptimized
                    className="max-h-[520px] h-auto w-full object-contain"
                  />
                </div>
              ))}
            </div>
          )}

          {visibleTags.length > 0 && (
            <div className="mt-7 flex flex-wrap gap-2">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--ub-surface-muted)] px-3 py-1.5 text-[12px] font-medium text-[var(--ub-text-secondary)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-7">
            <ReactionButtons
              postId={post.id}
              initialPrayCount={prayCount}
              initialEmpathizeCount={empathizeCount}
              commentCount={comments.length}
            />
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--ub-separator)] pt-4 text-[12px] text-[var(--ub-text-tertiary)]">
            <span className="inline-flex items-center gap-1.5">
              <SystemIcon name="eye" size={16} />
              조회 {(post.view_count ?? 0).toLocaleString('ko-KR')}
            </span>
            {post.author_user_id && post.author_user_id !== user.id && (
              <BlockUserButton blockedUserId={post.author_user_id} leavePage />
            )}
          </div>
        </div>
      </article>

      {reactionsError && (
        <div className="mt-5">
          <NoticeCard title="반응을 불러오지 못했습니다" tone="danger">
            {reactionsError.message}
          </NoticeCard>
        </div>
      )}

      <section className="mt-6 overflow-hidden rounded-[22px] bg-[var(--ub-surface-card-strong)] shadow-[var(--ub-shadow-soft)]">
        <header className="flex min-h-14 items-center justify-between border-b border-[var(--ub-separator)] px-4">
          <h2 className="text-[16px] font-bold text-[var(--ub-text-primary)]">
            댓글 {comments.length}
          </h2>
          <span className="text-[13px] text-[var(--ub-text-tertiary)]">시간순</span>
        </header>

        {commentsError && (
          <div className="p-4">
            <NoticeCard title="댓글을 불러오지 못했습니다" tone="danger">
              {commentsError.message}
            </NoticeCard>
          </div>
        )}

        {comments.map((comment) => (
          <article
            key={comment.id}
            className="border-b border-[var(--ub-separator)] px-4 py-5 last:border-b-0"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-[var(--ub-text-secondary)]">
                  {getAnonymousId(
                    post.id,
                    comment.author_user_id ?? comment.id
                  )}
                </p>
                <p className="mt-0.5 text-[12px] text-[var(--ub-text-tertiary)]">
                  {formatRelativeTime(comment.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <ReportButton
                  targetType="comment"
                  targetId={comment.id}
                  label="신고"
                />
                {comment.author_user_id && comment.author_user_id !== user.id && (
                  <BlockUserButton blockedUserId={comment.author_user_id} />
                )}
              </div>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-[16px] leading-[25px] text-[var(--ub-text-primary)]">
              <PraiseMentionText
                content={comment.content}
                mentions={comment.mentions}
                tracks={praiseTracks ?? []}
              />
            </p>
          </article>
        ))}

        {comments.length === 0 && !commentsError && (
          <div className="px-5 py-12 text-center">
            <p className="text-[16px] font-bold text-[var(--ub-text-primary)]">
              아직 댓글이 없습니다
            </p>
            <p className="mt-2 text-[14px] text-[var(--ub-text-secondary)]">
              첫 번째 중보의 마음을 남겨보세요.
            </p>
          </div>
        )}
      </section>

      <div id="comments" className="mt-5 scroll-mt-4">
        <CommentForm postId={post.id} />
      </div>
    </AppShell>
  )
}
