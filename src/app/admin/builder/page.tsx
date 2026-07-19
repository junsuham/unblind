import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import {
  BUILDER_HOME_MODEL,
  BUILDER_HOME_PREVIEW_PATH,
  isBuilderConfigured,
} from '@/lib/builder'
import { AdminIcon } from '../components/AdminIcon'
import {
  AdminHeader,
  AdminListGroup,
  AdminListRow,
  AdminNotice,
  AdminPageShell,
} from '../components/AdminIOS'

export const dynamic = 'force-dynamic'

export default async function AdminBuilderPage() {
  await requireAdmin()

  const configured = isBuilderConfigured()

  return (
    <AdminPageShell>
      <AdminHeader
        eyebrow="홈 콘텐츠"
        title="화면 편집"
        description="홈의 안전한 편집 영역만 Builder.io에서 변경합니다. 로그인과 상단·하단바는 코드로 보호됩니다."
      />

      <AdminNotice
        title={configured ? 'Builder.io 연결됨' : '연결 키 등록 필요'}
        tone={configured ? 'default' : 'warning'}
      >
        {configured
          ? '발행한 변경은 앱을 다시 배포하지 않아도 홈에 반영됩니다.'
          : 'Builder 공개 API 키를 Vercel에 등록하면 편집과 발행이 활성화됩니다.'}
      </AdminNotice>

      <AdminListGroup title="편집 도구">
        <AdminListRow
          href={BUILDER_HOME_PREVIEW_PATH}
          title="앱 미리보기"
          subtitle="홈에 삽입될 영역을 단독으로 확인합니다."
          leading={<AdminIcon name="post" className="h-6 w-6" />}
        />
        <AdminListRow
          title="Builder.io 편집기"
          subtitle="텍스트, 카드, 여백과 배치를 실시간으로 편집합니다."
          leading={<AdminIcon name="activity" className="h-6 w-6" />}
        >
          <a
            href="https://builder.io/content"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center rounded-full bg-[var(--admin-accent)] px-4 text-[13px] font-bold text-white"
          >
            편집기 열기
          </a>
        </AdminListRow>
      </AdminListGroup>

      <AdminListGroup title="Builder 설정">
        <AdminListRow
          title="모델 이름"
          subtitle={BUILDER_HOME_MODEL}
        />
        <AdminListRow
          title="미리보기 주소"
          subtitle={BUILDER_HOME_PREVIEW_PATH}
        />
      </AdminListGroup>

      <Link
        href="/admin"
        className="inline-flex min-h-11 items-center text-[14px] font-semibold text-[var(--admin-accent)]"
      >
        ‹ 관리자 홈
      </Link>
    </AdminPageShell>
  )
}
