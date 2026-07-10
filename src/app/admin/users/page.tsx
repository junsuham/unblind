import { requireAdmin } from '@/lib/adminAuth'
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

type AllowedUserRow = {
  email: string
  status: 'active' | 'blocked'
  memo: string | null
  created_at: string
  agreed_at: string | null
  agreed_version: string | null
  last_seen_at: string | null
}

function formatDate(value: string | null) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString('ko-KR')
}

export default async function AdminUsersPage() {
  await requireAdmin()

  const { data, error } = await supabaseAdmin
    .from('allowed_users')
    .select(
      'email, status, memo, created_at, agreed_at, agreed_version, last_seen_at'
    )
    .order('created_at', { ascending: false })
    .returns<AllowedUserRow[]>()

  const users = data ?? []

  const activeCount = users.filter((user) => user.status === 'active').length
  const blockedCount = users.filter((user) => user.status === 'blocked').length
  const agreedCount = users.filter((user) => !!user.agreed_at).length

  return (
    <AdminPageShell>
      <AdminHeader
        backHref="/admin"
        title="참여자 관리"
        description="청년회 베타에 입장할 수 있는 이메일을 추가하고, 차단·동의 상태를 관리합니다."
      />

      <div className="mb-6">
        <AdminStatGrid>
          <AdminStatCard label="활성" value={activeCount} tone="success" />
          <AdminStatCard label="차단" value={blockedCount} tone="danger" />
          <AdminStatCard label="동의" value={agreedCount} />
        </AdminStatGrid>
      </div>

      <div className="mb-6">
        <AddAllowedUserForm />
      </div>

      {error && (
        <div className="mb-6">
          <AdminNotice title="사용자 목록을 불러오지 못했습니다" tone="danger">
            <p>{error.message}</p>
          </AdminNotice>
        </div>
      )}

      <AdminListGroup
        title={`승인된 이메일 ${users.length}`}
        footer="사용자 화면에서는 이메일이 공개되지 않습니다. 운영 목적에 한해 확인하세요."
      >
        {users.map((user) => {
          const statusText = user.status === 'active' ? '활성' : '차단'
          const agreementText = user.agreed_at ? '동의 완료' : '미동의'

          return (
            <AdminListRow
              key={user.email}
              title={user.email}
              subtitle={`${statusText} · ${agreementText}`}
              leading={user.status === 'active' ? '👤' : '🚫'}
              trailing={
                <span
                  className={
                    user.status === 'active'
                      ? 'rounded-full bg-green-50 px-3 py-1 ios-caption font-semibold text-green-700'
                      : 'rounded-full bg-[#FF3B30]/10 px-3 py-1 ios-caption font-semibold text-[#7A1A16]'
                  }
                >
                  {statusText}
                </span>
              }
            >
              <div className="rounded-[18px] bg-[#fff7f2] p-4 ios-secondary">
                <p>
                  <span className="font-semibold text-black">추가일:</span>{' '}
                  {formatDate(user.created_at)}
                </p>

                <p className="mt-1">
                  <span className="font-semibold text-black">동의 시각:</span>{' '}
                  {formatDate(user.agreed_at)}
                </p>

                <p className="mt-1">
                  <span className="font-semibold text-black">마지막 기록:</span>{' '}
                  {formatDate(user.last_seen_at)}
                </p>

                <p className="mt-1">
                  <span className="font-semibold text-black">메모:</span>{' '}
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

        {users.length === 0 && !error && (
          <div className="px-5 py-10 text-center">
            <p className="ios-title text-black">
              아직 승인된 이메일이 없습니다
            </p>

            <p className="mt-2 ios-secondary">
              위 입력창에서 첫 베타 참여자를 추가해보세요.
            </p>
          </div>
        )}
      </AdminListGroup>
    </AdminPageShell>
  )
}
