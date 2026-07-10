export type ModerationIssueLevel = 'block' | 'warn' | 'danger'

export type ModerationIssue = {
  code: string
  level: ModerationIssueLevel
  title: string
  description: string
}

type Rule = {
  code: string
  level: ModerationIssueLevel
  pattern: RegExp
  title: string
  description: string
}

const rules: Rule[] = [
  {
    code: 'phone',
    level: 'block',
    pattern: /01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/,
    title: '전화번호가 포함된 것 같아요',
    description:
      '전화번호는 개인을 특정하거나 외부 접촉으로 이어질 수 있어 올릴 수 없습니다.',
  },
  {
    code: 'email',
    level: 'block',
    pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    title: '이메일 주소가 포함된 것 같아요',
    description:
      '이메일 주소는 개인 정보에 해당할 수 있어 올릴 수 없습니다.',
  },
  {
    code: 'link',
    level: 'block',
    pattern:
      /(https?:\/\/|www\.|open\.kakao\.com|forms\.gle|docs\.google\.com|instagram\.com|instagr\.am)/i,
    title: '외부 링크가 포함된 것 같아요',
    description:
      '베타 기간에는 외부 링크, 오픈채팅, 폼 링크 등을 올릴 수 없습니다.',
  },
  {
    code: 'kakao',
    level: 'block',
    pattern: /(카카오톡|카톡|오픈채팅|오픈톡|kakao|kakaotalk|open\.kakao)/i,
    title: '외부 연락 수단이 포함된 것 같아요',
    description:
      '카카오톡, 오픈채팅 등 외부 연락 수단은 안전을 위해 제한합니다.',
  },
  {
    code: 'social-handle',
    level: 'block',
    pattern: /(^|\s)@[A-Za-z0-9._]{3,30}/,
    title: 'SNS 아이디처럼 보이는 표현이 있어요',
    description:
      '@아이디 형태의 표현은 특정 계정으로 연결될 수 있어 올릴 수 없습니다.',
  },
  {
    code: 'church-identifiable',
    level: 'warn',
    pattern:
      /([가-힣A-Za-z0-9]+교회|목사님|목사|전도사님|전도사|간사님|간사|장로님|집사님|찬양팀|교사팀|소그룹|셀장|순장|리더)/,
    title: '개인이나 공동체가 특정될 수 있어요',
    description:
      '교회명, 사역팀, 직책, 리더 역할이 함께 쓰이면 특정 인물을 추측할 수 있습니다.',
  },
  {
    code: 'exposure',
    level: 'warn',
    pattern: /(실명|폭로|고발|문제\s*있|누구인지|누군지|어느\s*교회|어디\s*교회)/,
    title: '폭로나 특정 요청처럼 보일 수 있어요',
    description:
      '이 공간은 고발 게시판이 아니라 고민 나눔 공간입니다. 내 감정과 고민 중심으로 바꿔보세요.',
  },
  {
    code: 'money',
    level: 'warn',
    pattern: /(계좌|송금|입금|돈\s*빌려|후원\s*계좌|토스|카카오페이|페이로)/,
    title: '금전 요청으로 보일 수 있어요',
    description:
      '금전 요구나 계좌 공유는 분쟁과 피해로 이어질 수 있어 운영자가 제한할 수 있습니다.',
  },
  {
    code: 'self-harm',
    level: 'danger',
    pattern: /(죽고\s*싶|자살|자해|극단적\s*선택|살기\s*싫|목숨|사라지고\s*싶)/,
    title: '위험 신호가 포함된 것 같아요',
    description:
      '긴급한 위험이 있다면 앱에 글을 쓰기보다 가까운 사람, 담당 사역자, 전문기관에 즉시 도움을 요청해주세요.',
  },
]

export function analyzeTextForSafety(text: string) {
  const normalizedText = text.normalize('NFKC')

  const issues = rules
    .filter((rule) => rule.pattern.test(normalizedText))
    .map((rule) => ({
      code: rule.code,
      level: rule.level,
      title: rule.title,
      description: rule.description,
    }))

  return {
    issues,
    blockingIssues: issues.filter((issue) => issue.level === 'block'),
    warningIssues: issues.filter((issue) => issue.level === 'warn'),
    dangerIssues: issues.filter((issue) => issue.level === 'danger'),
  }
}
