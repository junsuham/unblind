export type MbtiAxis = 'EI' | 'SN' | 'TF' | 'JP'
export type MbtiPole = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P'
export type MbtiType =
  | 'ISTJ' | 'ISFJ' | 'INFJ' | 'INTJ'
  | 'ISTP' | 'ISFP' | 'INFP' | 'INTP'
  | 'ESTP' | 'ESFP' | 'ENFP' | 'ENTP'
  | 'ESTJ' | 'ESFJ' | 'ENFJ' | 'ENTJ'

export type BibleMbtiQuestion = {
  id: string
  axis: MbtiAxis
  prompt: string
  options: readonly [
    { pole: MbtiPole; text: string },
    { pole: MbtiPole; text: string },
  ]
}

export type BibleCharacterProfile = {
  type: MbtiType
  name: string
  tagline: string
  summary: string
  traits: readonly [string, string, string]
  records: readonly [string, string]
  references: readonly string[]
  reflection: string
}

export type BibleMbtiAnswers = Record<string, MbtiPole>

export type BibleMbtiAxisResult = {
  axis: MbtiAxis
  leftPole: MbtiPole
  rightPole: MbtiPole
  selectedPole: MbtiPole
  leftScore: number
  rightScore: number
  percentage: number
}

export type BibleMbtiResult = {
  type: MbtiType
  similarity: number
  character: BibleCharacterProfile
  axes: BibleMbtiAxisResult[]
}

const q = (
  id: string,
  axis: MbtiAxis,
  prompt: string,
  first: { pole: MbtiPole; text: string },
  second: { pole: MbtiPole; text: string },
): BibleMbtiQuestion => ({ id, axis, prompt, options: [first, second] })

const bibleMbtiQuestionBank: readonly BibleMbtiQuestion[] = [
  q('ei-1', 'EI', '처음 참석한 모임에서 나는',
    { pole: 'E', text: '먼저 인사하며 대화의 문을 연다' },
    { pole: 'I', text: '분위기를 살핀 뒤 자연스럽게 말을 건다' }),
  q('ei-2', 'EI', '마음이 복잡한 일이 생기면',
    { pole: 'I', text: '혼자 기도하고 생각을 정리한 뒤 나눈다' },
    { pole: 'E', text: '믿는 사람과 이야기하며 생각을 정리한다' }),
  q('ei-3', 'EI', '팀 활동에서 에너지가 살아나는 순간은',
    { pole: 'E', text: '여럿이 의견을 주고받을 때다' },
    { pole: 'I', text: '내 역할에 깊이 집중할 때다' }),
  q('ei-4', 'EI', '낯선 소그룹에 들어가면',
    { pole: 'I', text: '이야기를 충분히 들으며 사람을 파악한다' },
    { pole: 'E', text: '질문을 건네며 어색함을 먼저 푼다' }),
  q('ei-5', 'EI', '바쁜 한 주 뒤 회복에 더 필요한 것은',
    { pole: 'E', text: '좋아하는 사람들과 보내는 활기찬 시간' },
    { pole: 'I', text: '조용히 머물며 충전하는 나만의 시간' }),
  q('ei-6', 'EI', '중요한 생각을 말할 때 나는',
    { pole: 'I', text: '생각을 충분히 다듬은 뒤 말한다' },
    { pole: 'E', text: '말로 풀어가며 생각을 선명하게 만든다' }),
  q('ei-7', 'EI', '간증을 나누는 방식으로 더 편한 것은',
    { pole: 'E', text: '사람들의 반응을 보며 생생하게 이야기하기' },
    { pole: 'I', text: '글이나 메모로 차분하게 정리해 전하기' }),

  q('sn-1', 'SN', '성경을 읽을 때 먼저 눈에 들어오는 것은',
    { pole: 'S', text: '사건과 인물의 구체적인 행동' },
    { pole: 'N', text: '본문 전체를 잇는 의미와 메시지' }),
  q('sn-2', 'SN', '새로운 행사를 준비한다면',
    { pole: 'N', text: '아직 해보지 않은 신선한 가능성을 떠올린다' },
    { pole: 'S', text: '검증된 사례와 필요한 항목부터 확인한다' }),
  q('sn-3', 'SN', '설명을 들을 때 더 이해가 잘 되는 것은',
    { pole: 'S', text: '실제 사례와 단계가 분명한 설명' },
    { pole: 'N', text: '큰 그림과 핵심 원리를 보여주는 설명' }),
  q('sn-4', 'SN', '문제가 생겼을 때 먼저 확인하는 것은',
    { pole: 'N', text: '앞으로 펼쳐질 가능성과 숨은 원인' },
    { pole: 'S', text: '지금 확인할 수 있는 사실과 조건' }),
  q('sn-5', 'SN', '지난 모임을 떠올릴 때 더 잘 기억나는 것은',
    { pole: 'S', text: '누가 무엇을 말했는지에 대한 구체적인 장면' },
    { pole: 'N', text: '그날 느낀 분위기와 전체적인 인상' }),
  q('sn-6', 'SN', '새 역할을 맡을 때 편한 시작 방식은',
    { pole: 'N', text: '목적을 이해한 뒤 내 방식으로 길을 찾기' },
    { pole: 'S', text: '정확한 순서와 기준을 확인한 뒤 실행하기' }),
  q('sn-7', 'SN', '사람을 볼 때 자연스럽게 발견하는 것은',
    { pole: 'S', text: '지금 실제로 필요한 도움과 강점' },
    { pole: 'N', text: '앞으로 자라날 가능성과 새로운 모습' }),

  q('tf-1', 'TF', '의견이 부딪힐 때 더 중요하게 보는 것은',
    { pole: 'T', text: '모두에게 일관되게 적용되는 기준' },
    { pole: 'F', text: '각 사람이 처한 상황과 마음' }),
  q('tf-2', 'TF', '친구가 고민을 털어놓으면 나는',
    { pole: 'F', text: '마음을 충분히 공감하고 곁에 머문다' },
    { pole: 'T', text: '문제를 정리하고 가능한 해결책을 찾는다' }),
  q('tf-3', 'TF', '공동체의 중요한 결정을 내릴 때',
    { pole: 'T', text: '원칙과 효과를 중심으로 판단한다' },
    { pole: 'F', text: '관계와 공동체의 조화를 함께 살핀다' }),
  q('tf-4', 'TF', '누군가에게 개선점을 말해야 한다면',
    { pole: 'F', text: '상대가 받아들일 수 있는 표현을 먼저 고른다' },
    { pole: 'T', text: '원인과 바꿀 점을 분명하게 설명한다' }),
  q('tf-5', 'TF', '갈등을 풀 때 먼저 해야 할 일은',
    { pole: 'T', text: '사실관계와 책임을 객관적으로 정리하는 것' },
    { pole: 'F', text: '상처받은 마음을 듣고 관계를 회복하는 것' }),
  q('tf-6', 'TF', '한정된 시간에 섬김을 선택한다면',
    { pole: 'F', text: '지금 가장 돌봄이 필요한 사람을 향한다' },
    { pole: 'T', text: '가장 큰 효과를 낼 수 있는 일을 택한다' }),
  q('tf-7', 'TF', '어려운 진실을 전할 때 나는',
    { pole: 'T', text: '핵심을 흐리지 않고 정확히 말하려 한다' },
    { pole: 'F', text: '진실과 함께 따뜻함이 전해지도록 한다' }),

  q('jp-1', 'JP', '한 주를 시작할 때 더 편한 것은',
    { pole: 'J', text: '일정과 우선순위를 미리 정해두는 것' },
    { pole: 'P', text: '상황을 보며 그때그때 선택하는 것' }),
  q('jp-2', 'JP', '수련회 프로그램을 맡는다면',
    { pole: 'P', text: '큰 방향만 세우고 현장에 맞게 바꾼다' },
    { pole: 'J', text: '시간표와 역할을 세부적으로 정리한다' }),
  q('jp-3', 'JP', '마감이 있는 일을 할 때 나는',
    { pole: 'J', text: '여유 있게 끝내기 위해 일찍 시작한다' },
    { pole: 'P', text: '마감이 가까워질 때 집중력이 올라간다' }),
  q('jp-4', 'JP', '갑작스럽게 계획이 바뀌면',
    { pole: 'P', text: '새로운 흐름을 즐기며 바로 적응한다' },
    { pole: 'J', text: '변경된 계획을 다시 정리해야 마음이 놓인다' }),
  q('jp-5', 'JP', '결정을 내릴 때 더 자연스러운 모습은',
    { pole: 'J', text: '충분히 검토한 뒤 한 방향으로 확정한다' },
    { pole: 'P', text: '가능한 선택지를 오래 열어두고 살핀다' }),
  q('jp-6', 'JP', '여러 일을 동시에 맡으면',
    { pole: 'P', text: '관심과 흐름에 따라 유연하게 오간다' },
    { pole: 'J', text: '목록과 순서를 만들어 하나씩 끝낸다' }),
  q('jp-7', 'JP', '여행이나 외출을 준비할 때',
    { pole: 'J', text: '동선과 시간을 미리 확인하는 편이다' },
    { pole: 'P', text: '핵심 목적지만 정하고 현장에서 발견한다' }),
] as const

const AXES: readonly MbtiAxis[] = ['EI', 'SN', 'TF', 'JP']

// 같은 기준의 문항이 연속으로 보이지 않도록 네 성향 축을 한 문항씩 섞습니다.
export const bibleMbtiQuestions: readonly BibleMbtiQuestion[] = Array.from(
  { length: 7 },
  (_, index) => AXES.map((axis) => bibleMbtiQuestionBank.find(
    (question) => question.id === `${axis.toLowerCase()}-${index + 1}`,
  )),
).flat().filter((question): question is BibleMbtiQuestion => Boolean(question))

export const bibleCharacters: Record<MbtiType, BibleCharacterProfile> = {
  ISTJ: {
    type: 'ISTJ', name: '다니엘', tagline: '흔들림 없이 원칙을 지키는 사람',
    summary: '조용한 확신과 꾸준한 습관으로 어느 자리에서든 신뢰를 쌓는 모습이 다니엘을 닮았습니다.',
    traits: ['신중한 책임감', '꾸준한 원칙', '위기 속 침착함'],
    records: ['낯선 왕궁에서도 뜻을 정하고 자신의 기준을 지켰습니다.', '위기 속에서도 기도의 리듬과 맡은 일에 대한 충성을 놓지 않았습니다.'],
    references: ['다니엘 1:8', '다니엘 6:3–10', '다니엘 6:23'],
    reflection: '지금 내가 조용히 지켜야 할 한 가지 좋은 원칙은 무엇인가요?',
  },
  ISFJ: {
    type: 'ISFJ', name: '룻', tagline: '곁을 지키며 신뢰를 세우는 사람',
    summary: '눈에 띄는 말보다 성실한 돌봄과 충실한 선택으로 관계를 깊게 만드는 모습이 룻을 닮았습니다.',
    traits: ['따뜻한 충성', '세심한 돌봄', '성실한 실행'],
    records: ['나오미 곁에 남아 새로운 길을 함께 걷기로 선택했습니다.', '낯선 환경에서도 성실히 일하며 가족과 공동체를 살렸습니다.'],
    references: ['룻기 1:16–17', '룻기 2:11–12', '룻기 4:13–17'],
    reflection: '오늘 말없이 곁을 지켜주고 싶은 사람은 누구인가요?',
  },
  INFJ: {
    type: 'INFJ', name: '에스더', tagline: '사람을 품고 때를 분별하는 사람',
    summary: '깊이 생각하고 사람의 아픔을 품은 뒤 결정적인 순간에는 용기 있게 나아가는 모습이 에스더를 닮았습니다.',
    traits: ['깊은 통찰', '공동체를 향한 마음', '절제된 용기'],
    records: ['자신의 위치가 공동체를 위한 부르심일 수 있음을 받아들였습니다.', '금식과 숙고 뒤 위험을 감수하며 백성을 살리는 행동에 나섰습니다.'],
    references: ['에스더 4:14–16', '에스더 5:1–2', '에스더 8:3–8'],
    reflection: '내가 가진 자리와 영향력을 누구를 위해 사용할 수 있을까요?',
  },
  INTJ: {
    type: 'INTJ', name: '느헤미야', tagline: '기도로 비전을 설계하는 사람',
    summary: '문제의 본질을 오래 살피고 목표와 전략을 세워 공동체를 움직이는 모습이 느헤미야를 닮았습니다.',
    traits: ['장기적인 시야', '전략적 계획', '집중력 있는 리더십'],
    records: ['무너진 성벽의 소식을 듣고 기도하며 구체적인 계획을 준비했습니다.', '방해 속에서도 역할을 나누고 성벽 재건을 끝까지 완수했습니다.'],
    references: ['느헤미야 1:4', '느헤미야 2:17–18', '느헤미야 6:15–16'],
    reflection: '기도와 계획을 함께 세워야 할 나의 다음 과제는 무엇인가요?',
  },
  ISTP: {
    type: 'ISTP', name: '브살렐', tagline: '지혜를 손끝의 결과로 만드는 사람',
    summary: '복잡한 요구를 실제 결과물로 풀어내고 기술과 집중력으로 공동체를 섬기는 모습이 브살렐을 닮았습니다.',
    traits: ['실용적인 지혜', '정교한 문제 해결', '차분한 몰입'],
    records: ['성막 제작을 위해 지혜와 총명, 여러 기술을 받은 사람으로 세워졌습니다.', '자신의 기술에 머물지 않고 다른 사람을 가르치며 함께 완성했습니다.'],
    references: ['출애굽기 31:1–5', '출애굽기 35:34–35', '출애굽기 36:1–2'],
    reflection: '내가 가진 기술로 공동체의 어떤 필요를 해결할 수 있을까요?',
  },
  ISFP: {
    type: 'ISFP', name: '다윗', tagline: '마음과 용기로 하나님을 표현하는 사람',
    summary: '풍부한 감수성과 현재에 집중하는 용기, 진솔한 예배로 사람의 마음을 움직이는 모습이 다윗을 닮았습니다.',
    traits: ['섬세한 감수성', '순간의 용기', '진솔한 표현'],
    records: ['목동의 자리에서 음악과 돌봄의 감각을 길렀습니다.', '골리앗 앞에서 자신의 방식과 믿음으로 담대하게 행동했습니다.'],
    references: ['사무엘상 16:18', '사무엘상 17:45–47', '시편 23편'],
    reflection: '내 마음을 가장 진솔하게 표현할 수 있는 방식은 무엇인가요?',
  },
  INFP: {
    type: 'INFP', name: '한나', tagline: '깊은 마음을 기도로 길어 올리는 사람',
    summary: '내면의 소망을 소중히 품고 고통과 기쁨을 진실한 기도로 바꾸는 모습이 한나를 닮았습니다.',
    traits: ['깊은 진정성', '가치에 대한 헌신', '조용한 인내'],
    records: ['마음의 괴로움을 숨기지 않고 하나님 앞에 오래 쏟아놓았습니다.', '응답받은 뒤 약속을 지키고 자신의 기쁨을 찬양으로 표현했습니다.'],
    references: ['사무엘상 1:10–11', '사무엘상 1:20', '사무엘상 2:1–10'],
    reflection: '아직 말로 꺼내지 못했지만 기도로 가져가고 싶은 소망은 무엇인가요?',
  },
  INTP: {
    type: 'INTP', name: '아볼로', tagline: '배움으로 진리를 선명하게 하는 사람',
    summary: '깊이 배우고 논리적으로 연결하며, 더 정확한 가르침도 기꺼이 받아들이는 모습이 아볼로를 닮았습니다.',
    traits: ['지적인 탐구', '논리적인 설명', '배움에 열린 태도'],
    records: ['성경에 능통하고 열정적으로 자신이 아는 바를 가르쳤습니다.', '브리스길라와 아굴라의 설명을 받아들인 뒤 많은 사람을 도왔습니다.'],
    references: ['사도행전 18:24–26', '사도행전 18:27–28', '고린도전서 3:6'],
    reflection: '내가 더 정확히 배우고 다른 사람에게 쉽게 설명하고 싶은 주제는 무엇인가요?',
  },
  ESTP: {
    type: 'ESTP', name: '베드로', tagline: '먼저 발을 내딛으며 배우는 사람',
    summary: '생각만 하기보다 현장에 뛰어들고 실패에서도 다시 일어나 사람들을 움직이는 모습이 베드로를 닮았습니다.',
    traits: ['빠른 행동력', '현장 적응력', '담대한 표현'],
    records: ['예수님의 부르심과 물 위를 걸으라는 말씀에 먼저 반응했습니다.', '성령강림 뒤 군중 앞에 서서 복음을 선명하게 전했습니다.'],
    references: ['마태복음 14:28–29', '마태복음 16:16', '사도행전 2:14–41'],
    reflection: '완벽히 준비되지 않아도 믿음으로 한 걸음 내디딜 일은 무엇인가요?',
  },
  ESFP: {
    type: 'ESFP', name: '막달라 마리아', tagline: '기쁨을 생생한 증언으로 전하는 사람',
    summary: '받은 사랑을 온 마음으로 표현하고 중요한 순간에 곁을 지키며 기쁜 소식을 전하는 모습이 막달라 마리아를 닮았습니다.',
    traits: ['따뜻한 표현력', '현재에 충실함', '기쁨을 나누는 힘'],
    records: ['예수님의 사역을 가까이에서 따르며 자신의 것으로 섬겼습니다.', '부활하신 예수님을 만난 뒤 제자들에게 소식을 전한 증인이 되었습니다.'],
    references: ['누가복음 8:1–3', '요한복음 20:16–18'],
    reflection: '내가 경험한 좋은 소식을 오늘 누구와 나누고 싶나요?',
  },
  ENFP: {
    type: 'ENFP', name: '바나바', tagline: '사람의 가능성을 발견해 일으키는 사람',
    summary: '새로운 가능성을 보고 따뜻한 격려로 사람과 공동체를 연결하는 모습이 바나바를 닮았습니다.',
    traits: ['가능성을 보는 눈', '진심 어린 격려', '사람을 잇는 열정'],
    records: ['필요를 위해 자신의 소유를 나누며 공동체를 격려했습니다.', '사람들이 바울을 경계할 때 그의 변화를 믿고 공동체와 연결했습니다.'],
    references: ['사도행전 4:36–37', '사도행전 9:26–27', '사도행전 11:22–24'],
    reflection: '아직 드러나지 않은 가능성을 믿어주고 싶은 사람은 누구인가요?',
  },
  ENTP: {
    type: 'ENTP', name: '브리스길라', tagline: '대화와 지혜로 새로운 길을 여는 사람',
    summary: '낯선 환경에서도 관계를 만들고 질문과 설명으로 사람의 이해를 넓히는 모습이 브리스길라를 닮았습니다.',
    traits: ['유연한 사고', '설득력 있는 대화', '새 길을 여는 용기'],
    records: ['이동과 변화 속에서도 일과 사역의 새로운 기반을 만들었습니다.', '아볼로의 가능성을 존중하며 더 정확한 길을 차분히 설명했습니다.'],
    references: ['사도행전 18:2–3', '사도행전 18:24–26', '로마서 16:3–4'],
    reflection: '좋은 질문과 대화로 더 넓혀보고 싶은 생각은 무엇인가요?',
  },
  ESTJ: {
    type: 'ESTJ', name: '여호수아', tagline: '목표를 행동으로 완성하는 사람',
    summary: '분명한 책임감과 실행력으로 사람들을 이끌고 약속된 목표를 현실로 만드는 모습이 여호수아를 닮았습니다.',
    traits: ['분명한 책임감', '조직적인 실행', '결단력 있는 리더십'],
    records: ['모세의 뒤를 이어 공동체를 이끌 책임을 받아들였습니다.', '백성과 역할을 정비하며 가나안 진입과 분배를 실제로 이끌었습니다.'],
    references: ['여호수아 1:6–9', '여호수아 3:7', '여호수아 24:15'],
    reflection: '지금 분명한 결정과 실행이 필요한 공동체의 일은 무엇인가요?',
  },
  ESFJ: {
    type: 'ESFJ', name: '루디아', tagline: '환대하며 공동체의 자리를 만드는 사람',
    summary: '사람의 필요를 빠르게 살피고 기꺼이 공간과 자원을 나누어 공동체를 세우는 모습이 루디아를 닮았습니다.',
    traits: ['따뜻한 환대', '현실적인 돌봄', '관계를 세우는 힘'],
    records: ['말씀에 마음을 열고 가족과 함께 새로운 믿음의 길을 선택했습니다.', '자신의 집을 열어 바울 일행과 빌립보 공동체의 든든한 자리가 되었습니다.'],
    references: ['사도행전 16:14–15', '사도행전 16:40'],
    reflection: '내 시간과 공간을 나누어 편안하게 맞이하고 싶은 사람은 누구인가요?',
  },
  ENFJ: {
    type: 'ENFJ', name: '드보라', tagline: '사람에게 용기를 불어넣는 리더',
    summary: '사람의 가능성과 공동체의 방향을 함께 보고, 따뜻한 확신으로 행동을 이끄는 모습이 드보라를 닮았습니다.',
    traits: ['사람을 세우는 리더십', '공동체적 통찰', '용기를 주는 말'],
    records: ['사람들이 찾아오는 재판관으로 지혜롭게 공동체를 섬겼습니다.', '바락을 격려하고 함께 나아가며 위기 속 행동을 이끌었습니다.'],
    references: ['사사기 4:4–9', '사사기 5:7'],
    reflection: '내가 용기를 북돋아 함께 일으켜 세우고 싶은 사람은 누구인가요?',
  },
  ENTJ: {
    type: 'ENTJ', name: '바울', tagline: '사명을 향해 길을 개척하는 사람',
    summary: '큰 목적을 분명히 붙들고 전략과 설득력으로 새로운 공동체와 길을 만들어가는 모습이 바울을 닮았습니다.',
    traits: ['사명 중심의 추진력', '전략적인 개척', '분명한 설득력'],
    records: ['도시와 문화에 맞게 소통하며 여러 지역에 공동체를 세웠습니다.', '어려움 속에서도 자신이 받은 사명을 끝까지 완수하는 데 집중했습니다.'],
    references: ['사도행전 13:2–3', '사도행전 17:22–34', '사도행전 20:24'],
    reflection: '내가 장기적으로 개척하고 완수해야 할 사명은 무엇인가요?',
  },
}

export const bibleCharacterImages: Record<MbtiType, string> = {
  ISTJ: '/characters/mbti/istj-daniel.png',
  ISFJ: '/characters/mbti/isfj-ruth.png',
  INFJ: '/characters/mbti/infj-esther.png',
  INTJ: '/characters/mbti/intj-nehemiah.png',
  ISTP: '/characters/mbti/istp-bezalel.png',
  ISFP: '/characters/mbti/isfp-david.png',
  INFP: '/characters/mbti/infp-hannah.png',
  INTP: '/characters/mbti/intp-apollos.png',
  ESTP: '/characters/mbti/estp-peter.png',
  ESFP: '/characters/mbti/esfp-mary-magdalene.png',
  ENFP: '/characters/mbti/enfp-barnabas.png',
  ENTP: '/characters/mbti/entp-priscilla.png',
  ESTJ: '/characters/mbti/estj-joshua.png',
  ESFJ: '/characters/mbti/esfj-lydia.png',
  ENFJ: '/characters/mbti/enfj-deborah.png',
  ENTJ: '/characters/mbti/entj-paul.png',
}

export const axisCopy: Record<MbtiAxis, {
  left: { pole: MbtiPole; label: string }
  right: { pole: MbtiPole; label: string }
}> = {
  EI: {
    left: { pole: 'E', label: '함께하며 충전' },
    right: { pole: 'I', label: '고요 속에서 충전' },
  },
  SN: {
    left: { pole: 'S', label: '사실과 현실' },
    right: { pole: 'N', label: '의미와 가능성' },
  },
  TF: {
    left: { pole: 'T', label: '원칙과 논리' },
    right: { pole: 'F', label: '사람과 가치' },
  },
  JP: {
    left: { pole: 'J', label: '계획과 완결' },
    right: { pole: 'P', label: '유연함과 발견' },
  },
}

export function calculateBibleMbtiResult(answers: BibleMbtiAnswers): BibleMbtiResult {
  const scores: Record<MbtiPole, number> = {
    E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0,
  }

  for (const question of bibleMbtiQuestions) {
    const answer = answers[question.id]
    if (question.options.some((option) => option.pole === answer)) scores[answer] += 1
  }

  const axes = AXES.map((axis): BibleMbtiAxisResult => {
    const [leftPole, rightPole] = axis.split('') as [MbtiPole, MbtiPole]
    const leftScore = scores[leftPole]
    const rightScore = scores[rightPole]
    const selectedPole = leftScore >= rightScore ? leftPole : rightPole
    const total = Math.max(1, leftScore + rightScore)
    const percentage = Math.round((Math.max(leftScore, rightScore) / total) * 100)

    return {
      axis,
      leftPole,
      rightPole,
      selectedPole,
      leftScore,
      rightScore,
      percentage,
    }
  })

  const type = axes.map((axis) => axis.selectedPole).join('') as MbtiType
  const similarity = Math.round(
    axes.reduce((sum, axis) => sum + axis.percentage, 0) / axes.length,
  )

  return { type, similarity, character: bibleCharacters[type], axes }
}
