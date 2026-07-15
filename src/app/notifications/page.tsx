import Link from 'next/link'
import { requireBetaUser } from '@/lib/betaAuth'
import { AppShell, BottomTabBar, PageHeader } from '@/app/components/ui/AppShell'
import NotificationActions from './NotificationActions'

export const dynamic = 'force-dynamic'

type Notification = {
  id: string
  type: string
  post_id: string | null
  title: string
  body: string | null
  read_at: string | null
  created_at: string
}

export default async function NotificationsPage() {
  const { supabase } = await requireBetaUser()
  const { data } = await supabase
    .from('notifications')
    .select('id, type, post_id, title, body, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(50)
    .returns<Notification[]>()
  const notifications = data ?? []
  const hasUnread = notifications.some((item) => !item.read_at)

  return (
    <AppShell bottomBar={<BottomTabBar />}>
      <PageHeader
        eyebrow="새로운 소식"
        title="🔔 알림"
        titleSize="compact"
        action={<NotificationActions hasUnread={hasUnread} />}
      />
      <div className="overflow-hidden rounded-[20px] bg-[var(--ub-surface-card-strong)] shadow-[var(--ub-shadow-soft)]">
        {notifications.map((item) => {
          const content = (
            <div className={`border-b border-[var(--ub-separator)] px-4 py-4 last:border-b-0 ${item.read_at ? '' : 'bg-[var(--ub-surface-brand-soft)]'}`}>
              <p className="text-[15px] font-semibold text-[var(--ub-text-primary)]">{item.title}</p>
              {item.body && <p className="mt-1 line-clamp-2 text-[13px] text-[var(--ub-text-secondary)]">{item.body}</p>}
              <time className="mt-2 block text-[11px] text-[var(--ub-text-tertiary)]">{new Date(item.created_at).toLocaleString('ko-KR')}</time>
            </div>
          )
          return item.post_id ? <Link key={item.id} href={`/post/${item.post_id}`}>{content}</Link> : <div key={item.id}>{content}</div>
        })}
        {notifications.length === 0 && <p className="px-5 py-12 text-center text-[14px] text-[var(--ub-text-secondary)]">아직 새로운 알림이 없습니다.</p>}
      </div>
    </AppShell>
  )
}
