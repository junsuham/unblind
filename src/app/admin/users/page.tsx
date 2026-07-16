import { requireAdmin } from '@/lib/adminAuth'
import { listAllAuthUsers } from '@/lib/adminUsers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { occupationLabels, type Occupation } from '@/lib/profile'
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

type ProfileRow = {
  user_id: string
  email: string
  nickname: string
  birth_date: string
  reference_age: number
  church_name: string
  church_address: string
  occupation: Occupation
  completed_at: string
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
  profileComplete: boolean
  nickname: string | null
  birthDate: string | null
  referenceAge: number | null
  churchName: string | null
  churchAddress: string | null
  occupation: Occupation | null
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
            subtitle={`${user.provider} · ${statusText}${user.nickname ? ` · ${user.nickname}` : ''}`}
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
                  프로필:
                </span>{' '}
                {user.profileComplete ? '입력 완료' : '미입력'}
              </p>

              <p className="mt-1">
                <span className="font-semibold text-[var(--ub-text-primary)]">
                  앱 아이디:
                </span>{' '}
                {user.nickname || '-'}
              </p>

              <p className="mt-1">
                <span className="font-semibold text-[var(--ub-text-primary)]">
                  생년월일 / 기준 나이:
                </span>{' '}
                {user.birthDate || '-'} / {user.referenceAge ?? '-'}세
              </p>

              <p className="mt-1">
                <span className="font-semibold text-[var(--ub-text-primary)]">
                  출석 교회:
                </span>{' '}
                {user.churchName || '-'}
                {user.churchAddress ? ` · ${user.churchAddress}` : ''}
              </p>

              <p className="mt-1">
                <span className="font-semibold text-[var(--ub-text-primary)]">
                  현재 상태:
                </span>{' '}
                {user.occupation ? occupationLabels[user.occupation] : '-'}
              </p>

              <p className="mt-1">
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
              profileComplete={user.profileComplete}
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

  const [allowedResult, authResult, profileResult] = await Promise.all([
    supabaseAdmin
      .from('allowed_users')
      .select(
        'email, status, memo, created_at, agreed_at, agreed_version, last_seen_at'
      )
      .order('created_at', { ascending: false })
      .returns<AllowedUserRow[]>(),
    listAllAuthUsers(),
    supabaseAdmin
      .from('user_profiles')
      .select(
        'user_id, email, nickname, birth_date, reference_age, church_name, church_address, occupation, completed_at'
      )
      .returns<ProfileRow[]>(),
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
  const profilesByEmail = new Map(
    (profileResult.data ?? []).map((profile) => [
      profile.email.toLowerCase(),
      profile,
    ])
  )
  const emails = new Set([
    ...allowedByEmail.keys(),
    ...authByEmail.keys(),
    ...profilesByEmail.keys(),
  ])

  const users: ManagedUserRow[] = Array.from(emails).map((email) => {
    const allowedUser = allowedByEmail.get(email)
    const authUser = authByEmail.get(email)
    const profile = profilesByEmail.get(email)

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
      profileComplete: !!profile?.completed_at,
      nickname: profile?.nickname ?? null,
      birthDate: profile?.birth_date ?? null,
      referenceAge: profile?.reference_age ?? null,
      churchName: profile?.church_name ?? null,
      churchAddress: profile?.church_address ?? null,
      occupation: profile?.occupation ?? null,
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
  const loadError =
    allowedResult.error ?? authResult.error ?? profileResult.error

  return (
    <AdminPageShell>
      <AdminHeader
        backHref="/admin"
        title="참여자 관리"
        description="Google로 가입한 계정을 확인하고 승인하거나 차단합니다."
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
          footer="프로필 입력이 완료된 가입자의 연령·교회·현재 상태를 확인한 뒤 승인해주세요."
        >
          <UserRows
            users={pendingUsers}
            emptyTitle="승인을 기다리는 가입자가 없습니다"
            emptyDescription="새 Google 가입자가 생기면 이곳에 표시됩니다."
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
