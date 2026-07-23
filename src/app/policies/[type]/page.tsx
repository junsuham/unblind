import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AppShell, PageHeader, GlassCard } from '@/app/components/ui/AppShell'

type Policy = {
  title: string
  effectiveDate: string
  sections: { title: string; body: string }[]
}

const policies: Record<string, Policy> = {
  community: {
    title: '커뮤니티 운영정책',
    effectiveDate: '2026년 7월 18일',
    sections: [
      { title: '익명성과 책임', body: '다른 사용자에게는 랜덤 익명 ID가 표시됩니다. 익명성은 안전한 나눔을 위한 장치이며 타인을 공격하거나 규칙을 회피할 권리를 뜻하지 않습니다.' },
      { title: '게시할 수 없는 내용', body: '실명·연락처·교회명과 직책 등 개인을 특정할 수 있는 정보, 혐오·비난·성적 콘텐츠, 이단·사이비 포교, 금전 요구, 스팸과 외부 연락 유도는 제한됩니다.' },
      { title: '위기 상황', body: '자해나 생명 위험이 의심되는 긴급 상황에서는 앱 게시글보다 112·119, 가까운 보호자, 전문 상담기관에 즉시 도움을 요청해주세요. 앱은 긴급 구조 서비스를 제공하지 않습니다.' },
      { title: '신고와 조치', body: '신고된 콘텐츠는 운영자가 필요한 범위에서 확인합니다. 위반 정도와 반복 여부에 따라 숨김, 삭제, 이용 제한, 승인 취소 조치를 할 수 있으며 처리 사유를 기록합니다.' },
      { title: '차단과 이의 제기', body: '사용자를 차단하면 해당 사용자의 글과 댓글이 내 화면에서 숨겨집니다. 신고 결과나 이용 제한에 이의가 있으면 고객지원 경로로 재검토를 요청할 수 있습니다.' },
    ],
  },
  privacy: {
    title: '개인정보처리방침',
    effectiveDate: '2026년 7월 23일',
    sections: [
      { title: '처리 목적', body: '가입 자격과 Google 계정 확인, 승인 사용자 관리, 익명 커뮤니티 제공, 신고·차단·분쟁 대응, 알림 전송, 오류 분석과 보안 운영을 위해 필요한 정보를 처리합니다.' },
      { title: '처리 항목', body: 'Google 이메일과 계정 식별자, 소셜 연령 확인 결과, 출석 교회와 현재 상태, 랜덤 닉네임, 글·댓글·반응·신고·차단 기록, 접속 및 오류 기록, 선택한 경우 기기 푸시 구독 정보를 처리합니다. 다른 사용자에게 이메일과 교회 정보는 공개하지 않습니다.' },
      { title: '보유 기간', body: '회원 정보는 회원 기간 동안 보관하고 계정 삭제 시 삭제합니다. 읽은 알림과 오류 기록은 90일, 비활성 알림 구독은 30일, 계정 삭제 감사 기록과 처리 완료 신고의 신고자 정보는 1년, 운영 조치 이력은 2년 이내 보관 후 정리합니다. 법령상 별도 보존 의무가 있으면 해당 기간을 우선합니다.' },
      { title: '계정 삭제와 게시물', body: '계정 삭제 시 로그인·프로필·알림 구독 정보가 삭제됩니다. 작성한 글과 댓글은 커뮤니티 대화의 연속성을 위해 작성자를 알 수 없는 상태로 남을 수 있으며, 삭제가 필요한 콘텐츠는 신고 또는 고객지원으로 요청할 수 있습니다.' },
      { title: '처리 위탁과 외부 서비스', body: '서비스 제공을 위해 Google(로그인), Supabase(인증·데이터베이스·파일 저장), Vercel(웹 호스팅), Expo 및 브라우저 푸시 제공자(선택한 알림), YouTube(찬양·쇼츠 검색 및 재생)와 OpenStreetMap 계열 서비스(위치 검색)를 이용할 수 있습니다. YouTube 플레이어가 로드되면 영상 재생 가능 여부와 부정 사용 방지를 위한 기본 기기·접속 정보가 Google에 전달될 수 있습니다. 푸시 알림은 사용자가 허용한 경우에만 등록됩니다.' },
      { title: '안전조치', body: '전송 구간 암호화, 데이터베이스 접근 통제, 관리자 권한 분리, 요청 속도 제한, 변경 요청 출처 확인, 비공개 파일 저장과 만료 링크, 운영 조치 기록을 적용합니다.' },
      { title: '이용자의 권리', body: '이용자는 자신의 정보 열람, 정정, 삭제, 처리정지와 동의 철회를 요청할 수 있습니다. 앱의 계정 관리 또는 고객지원 경로로 요청하면 본인 확인 후 처리 결과를 안내합니다.' },
      { title: '아동과 연령', body: '이 서비스는 소셜 계정 연령 확인과 가입 승인 절차를 거치며, 현재 운영 기준에 맞지 않는 연령의 가입은 제한합니다.' },
      { title: '문의와 권리 행사', body: '개인정보 관련 문의와 권리 행사는 고객지원 페이지의 이메일로 접수할 수 있습니다. 실제 운영자는 공개 배포 전에 상호 또는 성명, 연락처와 개인정보 보호 담당자를 고객지원 페이지에 정확히 기재해야 합니다.' },
      { title: '방침 변경', body: '처리 항목이나 목적 등 중요한 내용이 바뀌면 시행 전에 앱 안에서 알립니다. 이전 방침과 변경일을 확인할 수 있도록 이력을 관리합니다.' },
    ],
  },
  terms: {
    title: '이용약관',
    effectiveDate: '2026년 7월 23일',
    sections: [
      { title: '이용 자격', body: 'Google 계정으로 연령 확인을 완료하고 운영자의 승인을 받은 사용자만 이용할 수 있습니다. 계정과 승인 자격을 타인에게 양도할 수 없습니다.' },
      { title: '서비스의 성격', body: '언블라인드는 익명 기도·고민 커뮤니티이며 의료, 법률, 긴급 구조 또는 전문 상담 서비스를 대신하지 않습니다.' },
      { title: '이용자의 책임', body: '타인의 권리와 개인정보를 침해하지 않아야 하며 게시한 내용에 대한 책임은 작성자에게 있습니다. 운영정책을 반복해서 위반하면 이용이 제한될 수 있습니다.' },
      { title: '콘텐츠 운영', body: '안전한 운영과 법적 의무 이행을 위해 신고 콘텐츠를 확인하고 노출을 제한할 수 있습니다. 중대한 조치에는 사유를 기록하고 이의 제기 경로를 제공합니다.' },
      { title: 'YouTube 콘텐츠', body: '크리스천 쇼츠와 찬양 재생은 YouTube API 서비스와 공식 플레이어를 사용합니다. 해당 기능을 이용하면 YouTube 이용약관의 적용을 받습니다. 영상의 소유권과 내용은 각 제작자와 YouTube에 있으며, 언블라인드는 영상을 다운로드하거나 재배포하지 않습니다.' },
      { title: '서비스 변경과 중단', body: '안전과 품질 향상을 위해 기능을 변경하거나 점검할 수 있습니다. 중요한 변경이나 장기 중단은 가능한 범위에서 사전에 안내합니다.' },
      { title: '약관 변경', body: '약관이 변경되면 적용일과 변경 내용을 앱 안에서 알립니다. 동의가 필요한 변경은 다시 동의를 받습니다.' },
    ],
  },
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params
  const policy = policies[type]
  return {
    title: `${policy?.title ?? '정책'} | 언블라인드`,
    description: policy ? `${policy.title}과 시행일을 확인합니다.` : '언블라인드 운영 정책입니다.',
  }
}

export default async function PolicyPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const policy = policies[type]
  if (!policy) notFound()

  return (
    <AppShell>
      <PageHeader title={policy.title} titleSize="compact" backHref="/support" backLabel="고객지원" />
      <p className="mb-4 px-1 text-[12px] font-semibold text-[var(--ub-text-on-brand-tertiary)]">시행일 {policy.effectiveDate}</p>
      <div className="space-y-3">
        {policy.sections.map((section) => (
          <GlassCard key={section.title}>
            <h2 className="text-[17px] font-bold">{section.title}</h2>
            <p className="mt-2 text-[14px] leading-[22px] text-[var(--ub-text-secondary)]">{section.body}</p>
          </GlassCard>
        ))}
      </div>
    </AppShell>
  )
}
