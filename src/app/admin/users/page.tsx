import { requireAdmin } from '@/lib/adminAuth'
import { listAllAuthUsers } from '@/lib/adminUsers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import AddAllowedUserForm from './AddAllowedUserForm'
import AdminUserActionButtons from './AdminUserActionButtons'
import {
  AdminHeader,
  AdminListGroup,
  AdminListRow,
  AdminNotice,
  AdminPageShell,
  AdminStatCard,
  AdminStatGrid,
} from '../components/AdminIOS'

export const dynamic = 'force-dynamic'

type AccessStatus = 'pending' | 'active' | 'blocked'

type AllowedUserRow = {
  email: string
  status: 'active' | 'blocked'
  memo: string | null
  created_at: string
  agreed_at: string | null
  agreed_version: string | null
  last_seen_at: string | null
}

type ManagedUserRow = {
  email: string
  status: AccessStatus
  provider: string
  memo: string | null
  accessCreatedAt: string | null
  signedUpAt: string | null
  agreedAt: string | null
  lastSeenAt: string | null
}

function formatDate(value: string | null) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString('ko-KR')
}

function formatProvider(provider: unknown, providers: unknown) {
  const values = Array.isArray(providers)
    ? providers.filter((value): value is string => typeof value === 'string')
    : typeof provider === 'string'
      ? [provider]
      : []

  if (values.includes('google')) {
    return 'Google'
  }

  if (values.includes('kakao')) {
    return 'Kakao'
  }

  return values[0] ?? '소셜 계정'
}

function UserRows({
  users,
  emptyTitle,
  emptyDescription,
}: {
  users: ManagedUserRow[]
  emptyTitle: string
  emptyDescription: string
}) {
  return (
    <>
      {users.map((user) => {
        const statusText =
          user.status === 'pending'
            ? '승인 대기'
            : user.status === 'active'
              ? '승인됨'
              : '차단됨'

        const statusClass =
          user.status === 'pending'
            ? 'bg-[var(--ub-warning-soft)] text-[var(--ub-warning-text)]'
            : user.status === 'active'
              ? 'bg-green-50 text-green-700'
              : 'bg-[var(--ub-danger-soft)] text-[var(--ub-danger-text)]'

        return (
          <AdminListRow
            key={user.email}
            title={user.email}
            subtitle={`${user.provider} · ${statusText}`}
            leading={
              user.status === 'pending'
                ? '⏳'
                : user.status === 'active'
                  ? '👤'
                  : '🚫'
            }
            trailing={
              <span
                className={`rounded-full px-3 py-1 ios-caption font-semibold ${statusClass}`}
              >
                {statusText}
              </span>
            }
          >
            <div className="rounded-[18px] bg-[var(--ub-surface-muted)] p-4 ios-secondary text-[var(--ub-text-secondary)]">
              <p>
                <span className="font-semibold text-[var(--ub-text-primary)]">
                  소셜 가입:
                </span>{' '}
                {formatDate(user.signedUpAt)}
              </p>

              <p className="mt-1">
                <span className="font-semibold text-[var(--ub-text-primary)]">
                  승인 등록:
                </span>{' '}
                {formatDate(user.accessCreatedAt)}
              </p>

              <p className="mt-1">
                <span className="font-semibold text-[var(--ub-text-primary)]">
                  약속 동의:
                </span>{' '}
                {formatDate(user.agreedAt)}
              </p>

              <p className="mt-1">
                <span className="font-semibold text-[var(--ub-text-primary)]">
                  최근 활동:
                </span>{' '}
                {formatDate(user.lastSeenAt)}
              </p>

              <p className="mt-1">
                <span className="font-semibold text-[var(--ub-text-primary)]">
                  메모:
                </span>{' '}
                {user.memo || '-'}
              </p>
            </div>

            <AdminUserActionButtons
              email={user.email}
              status={user.status}
              memo={user.memo}
            />
          </AdminListRow>
        )
      })}

      {users.length === 0 && (
        <div className="px-5 py-10 text-center">
          <p className="ios-title text-[var(--ub-text-primary)]">
            {emptyTitle}
          </p>

          <p className="mt-2 ios-secondary">{emptyDescription}</p>
        </div>
      )}
    </>
  )
}

export default async function AdminUsersPage() {
  await requireAdmin()

  const [allowedResult, authResult] = await Promise.all([
    supabaseAdmin
      .from('allowed_users')
      .select(
        'email, status, memo, created_at, agreed_at, agreed_version, last_seen_at'
      )
      .order('created_at', { ascending: false })
      .returns<AllowedUserRow[]>(),
    listAllAuthUsers(),
  ])

  const allowedUsers = allowedResult.data ?? []
  const allowedByEmail = new Map(
    allowedUsers.map((user) => [user.email.toLowerCase(), user])
  )
  const authByEmail = new Map(
    authResult.users
      .filter((user) => !!user.email)
      .map((user) => [user.email!.toLowerCase(), user])
  )
  const emails = new Set([...allowedByEmail.keys(), ...authByEmail.keys()])

  const users: ManagedUserRow[] = Array.from(emails).map((email) => {
    const allowedUser = allowedByEmail.get(email)
    const authUser = authByEmail.get(email)

    return {
      email,
      status: allowedUser?.status ?? 'pending',
      provider: authUser
        ? formatProvider(
            authUser.app_metadata?.provider,
            authUser.app_metadata?.providers
          )
        : '사전 등록',
      memo: allowedUser?.memo ?? null,
      accessCreatedAt: allowedUser?.created_at ?? null,
      signedUpAt: authUser?.created_at ?? null,
      agreedAt: allowedUser?.agreed_at ?? null,
      lastSeenAt:
        allowedUser?.last_seen_at ?? authUser?.last_sign_in_at ?? null,
    }
  })

  users.sort((left, right) => {
    const statusOrder: Record<AccessStatus, number> = {
      pending: 0,
      active: 1,
      blocked: 2,
    }
    const statusDifference =
      statusOrder[left.status] - statusOrder[right.status]

    if (statusDifference !== 0) {
      return statusDifference
    }

    return (
      Date.parse(right.signedUpAt ?? right.accessCreatedAt ?? '0') -
      Date.parse(left.signedUpAt ?? left.accessCreatedAt ?? '0')
    )
  })

  const pendingUsers = users.filter((user) => user.status === 'pending')
  const managedUsers = users.filter((user) => user.status !== 'pending')
  const activeCount = users.filter((user) => user.status === 'active').length
  const blockedCount = users.filter((user) => user.status === 'blocked').length
  const agreedCount = users.filter((user) => !!user.agreedAt).length
  const loadError = allowedResult.error ?? authResult.error

  return (
    <AdminPageShell>
      <AdminHeader
        backHref="/admin"
        title="참여자 관리"
        description="Google·Kakao로 가입한 계정을 확인하고 승인하거나 차단합니다."
      />

      <div className="mb-6">
        <AdminStatGrid>
          <AdminStatCard
            label="승인 대기"
            value={pendingUsers.length}
            tone="warning"
          />
          <AdminStatCard label="승인됨" value={activeCount} tone="success" />
          <AdminStatCard label="차단" value={blockedCount} tone="danger" />
          <AdminStatCard label="약속 동의" value={agreedCount} />
        </AdminStatGrid>
      </div>

      {loadError && (
        <div className="mb-6">
          <AdminNotice title="사용자 목록을 불러오지 못했습니다" tone="danger">
            <p>{loadError.message}</p>
          </AdminNotice>
        </div>
      )}

      <div className="mb-6">
        <AdminListGroup
          title={`승인 대기 ${pendingUsers.length}`}
          footer="소셜 계정 이메일과 청년회 구성원 여부를 확인한 뒤 승인해주세요."
        >
          <UserRows
            users={pendingUsers}
            emptyTitle="승인을 기다리는 가입자가 없습니다"
            emptyDescription="새 Google·Kakao 가입자가 생기면 이곳에 표시됩니다."
          />
        </AdminListGroup>
      </div>

      <div className="mb-6">
        <AddAllowedUserForm />
      </div>

      <AdminListGroup
        title={`승인·차단 사용자 ${managedUsers.length}`}
        footer="사용자 화면에서는 이메일이 공개되지 않습니다. 운영 목적에 한해 확인하세요."
      >
        <UserRows
          users={managedUsers}
          emptyTitle="아직 관리 중인 사용자가 없습니다"
          emptyDescription="가입자를 승인하면 이 목록으로 이동합니다."
        />
      </AdminListGroup>
    </AdminPageShell>
  )
}
