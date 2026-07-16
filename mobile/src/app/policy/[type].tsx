import { router, useLocalSearchParams } from 'expo-router'
import { Pressable, Text } from 'react-native'
import { Card } from '@/components/Card'
import { PageTitle } from '@/components/PageTitle'
import { Screen } from '@/components/Screen'
import { useAppTheme } from '@/constants/design'

const policies: Record<string, { title: string; sections: { heading: string; body: string }[] }> = {
  community: {
    title: '커뮤니티 운영정책',
    sections: [
      { heading: '서로를 지키는 원칙', body: '개인이나 교회를 특정하는 정보, 혐오·비난·성적 콘텐츠, 포교·금전 요구, 스팸을 게시할 수 없습니다.' },
      { heading: '신고와 조치', body: '신고된 콘텐츠는 운영자가 확인하며 숨김, 삭제, 이용 제한 조치를 할 수 있습니다. 긴급한 위험 신호는 전문기관이나 가까운 보호자에게 즉시 도움을 요청해주세요.' },
      { heading: '차단', body: '원하지 않는 사용자를 차단하면 해당 사용자의 글과 댓글이 내 화면에서 숨겨집니다.' },
    ],
  },
  privacy: {
    title: '개인정보처리방침',
    sections: [
      { heading: '수집 정보', body: '로그인 이메일, 소셜 연령 확인 결과, 앱 아이디, 출석 교회, 현재 상태, 서비스 이용 기록을 가입과 안전 운영 목적으로 처리합니다.' },
      { heading: '보관과 삭제', body: '계정 삭제 시 로그인·프로필 정보와 알림 토큰은 삭제됩니다. 작성한 글과 댓글은 작성자를 알 수 없는 상태로 남을 수 있습니다.' },
      { heading: '공개 범위', body: '다른 사용자에게 이메일과 출석 교회는 공개하지 않습니다. 운영자는 신고 처리와 안전 운영에 필요한 범위에서만 확인합니다.' },
    ],
  },
  terms: {
    title: '이용약관',
    sections: [
      { heading: '이용 자격', body: '현재 운영 기준에 따라 Google 계정으로 연령 확인을 완료하고 관리자의 승인을 받은 사용자만 이용할 수 있습니다.' },
      { heading: '이용자의 책임', body: '타인의 권리와 개인정보를 침해하지 않아야 하며, 운영정책을 반복해서 위반하면 이용이 제한될 수 있습니다.' },
      { heading: '서비스 변경', body: '안전과 품질 향상을 위해 기능과 정책이 변경될 수 있으며 중요한 변경은 앱 안에서 안내합니다.' },
    ],
  },
}

export default function PolicyScreen() {
  const colors = useAppTheme()
  const { type } = useLocalSearchParams<{ type: string }>()
  const policy = policies[type] ?? policies.community
  return <Screen><Pressable onPress={() => router.back()} style={{ minHeight: 40, justifyContent: 'center' }}><Text style={{ color: colors.brand, fontWeight: '700' }}>‹ 계정 관리</Text></Pressable><PageTitle title={policy.title} />{policy.sections.map((section) => <Card key={section.heading} style={{ marginBottom: 12 }}><Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>{section.heading}</Text><Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8 }}>{section.body}</Text></Card>)}</Screen>
}
