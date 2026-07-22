export type RecreationCategory =
  | 'icebreaker'
  | 'teamwork'
  | 'active'
  | 'bible'
  | 'calm'
  | 'large'

export type RecreationPlace = 'indoor' | 'outdoor' | 'small'

export type RecreationMood = 'easy' | 'active' | 'teamwork' | 'calm' | 'bible'

export type RecreationNoise = 'low' | 'medium' | 'high'

export type RecreationGame = {
  id: string
  title: string
  summary: string
  category: RecreationCategory
  moods: RecreationMood[]
  places: RecreationPlace[]
  minPlayers: number
  maxPlayers: number | null
  minutes: number
  materials: string[]
  preparation: string
  steps: string[]
  facilitatorScript: string
  safety: string
  contact: 'none' | 'light'
  noise: RecreationNoise
  newcomerFriendly: boolean
}

export type RecreationContext = {
  players: number
  minutes: number
  place: RecreationPlace
  mood: RecreationMood | 'all'
  noMaterials?: boolean
}

export const recreationCategoryLabels: Record<RecreationCategory, string> = {
  icebreaker: '첫 만남',
  teamwork: '협동',
  active: '활동형',
  bible: '성경·찬양',
  calm: '차분한 마무리',
  large: '대규모',
}

export const recreationMoodLabels: Record<RecreationMood, string> = {
  easy: '가볍게',
  active: '신나게',
  teamwork: '협동',
  calm: '차분하게',
  bible: '말씀과 함께',
}

export const recreationPlaceLabels: Record<RecreationPlace, string> = {
  indoor: '실내',
  outdoor: '야외',
  small: '좁은 공간',
}

export const recreationGames: RecreationGame[] = [
  {
    id: 'three-common-things',
    title: '공통점 3개 찾기',
    summary: '처음 만난 사람들과 자연스럽게 대화를 여는 안전한 아이스브레이킹',
    category: 'icebreaker',
    moods: ['easy', 'teamwork'],
    places: ['indoor', 'outdoor', 'small'],
    minPlayers: 6,
    maxPlayers: 40,
    minutes: 10,
    materials: [],
    preparation: '3~5명씩 앉거나 설 수 있는 작은 모둠을 만드세요.',
    steps: [
      '3~5명씩 모둠을 나눕니다.',
      '외모와 출신 지역을 제외한 공통점 3개를 4분 안에 찾습니다.',
      '각 모둠이 가장 의외였던 공통점 하나를 소개합니다.',
    ],
    facilitatorScript: '정답을 찾는 게임이 아니라 서로 편안하게 말을 거는 시간이에요. 말하고 싶지 않은 질문은 언제든 건너뛰어도 됩니다.',
    safety: '가족 형편, 연애, 건강처럼 민감한 개인정보는 질문하지 않도록 먼저 안내하세요.',
    contact: 'none',
    noise: 'medium',
    newcomerFriendly: true,
  },
  {
    id: 'name-bingo',
    title: '이름 빙고',
    summary: '이름과 한 가지 특징을 기억하며 공동체의 어색함을 빠르게 푸는 게임',
    category: 'icebreaker',
    moods: ['easy', 'active'],
    places: ['indoor', 'outdoor'],
    minPlayers: 10,
    maxPlayers: 60,
    minutes: 15,
    materials: ['종이', '펜'],
    preparation: '참가자에게 3×3 빈 빙고판을 나눠주세요.',
    steps: [
      '돌아다니며 서로 이름과 좋아하는 것을 하나씩 묻습니다.',
      '한 사람의 이름은 한 칸에만 적습니다.',
      '한 줄을 완성하면 앉고, 적힌 이름을 차례로 말하면 성공입니다.',
    ],
    facilitatorScript: '빨리 채우는 것보다 이름을 정확히 듣는 게 더 중요해요. 이름을 들은 뒤 한 번 불러주세요.',
    safety: '뛰지 않도록 안내하고 이동이 어려운 참가자에게는 사람들이 먼저 찾아가게 해주세요.',
    contact: 'none',
    noise: 'medium',
    newcomerFriendly: true,
  },
  {
    id: 'five-second-profile',
    title: '5초 프로필 릴레이',
    summary: '이름과 오늘의 기분을 짧게 이어 말하는 부담 없는 시작 게임',
    category: 'icebreaker',
    moods: ['easy'],
    places: ['indoor', 'outdoor', 'small'],
    minPlayers: 4,
    maxPlayers: 25,
    minutes: 5,
    materials: [],
    preparation: '모두가 서로 볼 수 있도록 원이나 반원으로 앉습니다.',
    steps: [
      '진행자가 이름과 오늘의 기분을 한 단어로 말합니다.',
      '오른쪽 사람부터 같은 방식으로 5초 안에 이어갑니다.',
      '두 번째 바퀴에는 앞사람의 이름을 먼저 부르고 자신의 차례를 진행합니다.',
    ],
    facilitatorScript: '길게 설명하지 않아도 괜찮아요. 이름과 지금 기분 한 단어만 가볍게 나눠볼게요.',
    safety: '기분을 자세히 설명하도록 압박하지 마세요.',
    contact: 'none',
    noise: 'low',
    newcomerFriendly: true,
  },
  {
    id: 'same-answer',
    title: '이구동성',
    summary: '제시어를 보고 팀원 모두 같은 답을 외치면 점수를 얻는 팀 대항 게임',
    category: 'teamwork',
    moods: ['easy', 'teamwork'],
    places: ['indoor', 'outdoor', 'small'],
    minPlayers: 8,
    maxPlayers: 50,
    minutes: 15,
    materials: ['제시어 카드 또는 화면'],
    preparation: '두 팀 이상으로 나누고 제시어를 10개 준비하세요.',
    steps: [
      '진행자가 “여름”, “간식”, “성경 인물” 같은 제시어를 보여줍니다.',
      '팀원은 상의하지 않고 셋을 센 뒤 답을 동시에 말합니다.',
      '팀 안에서 가장 많이 일치한 답의 인원만큼 점수를 얻습니다.',
    ],
    facilitatorScript: '상의는 금지예요. 우리 팀이 어떤 생각을 할지 마음을 모아 하나의 답을 외쳐주세요.',
    safety: '사람을 평가하거나 특정 참가자를 답으로 지목하는 제시어는 제외하세요.',
    contact: 'none',
    noise: 'high',
    newcomerFriendly: true,
  },
  {
    id: 'forbidden-word',
    title: '제한어 설명왕',
    summary: '금지된 단어를 피해서 제시어를 설명하는 순발력 팀 게임',
    category: 'teamwork',
    moods: ['active', 'teamwork'],
    places: ['indoor', 'outdoor', 'small'],
    minPlayers: 6,
    maxPlayers: 40,
    minutes: 15,
    materials: ['제시어 카드'],
    preparation: '제시어와 함께 말하면 안 되는 단어 2개를 적어둡니다.',
    steps: [
      '팀마다 설명자 한 명이 앞으로 나옵니다.',
      '설명자는 45초 동안 금지어를 피해서 제시어를 설명합니다.',
      '정답 하나당 1점, 금지어를 말하면 그 문제는 넘어갑니다.',
    ],
    facilitatorScript: '몸짓은 사용할 수 있지만 제시어의 일부나 영어 번역을 말하면 안 됩니다.',
    safety: '내부 은어나 새신자가 모를 만한 표현은 제시어에서 제외하세요.',
    contact: 'none',
    noise: 'medium',
    newcomerFriendly: true,
  },
  {
    id: 'drawing-relay',
    title: '한 획 그림 릴레이',
    summary: '한 사람당 한 획씩 더해 팀이 함께 그림을 완성하는 협동 게임',
    category: 'teamwork',
    moods: ['easy', 'teamwork'],
    places: ['indoor', 'small'],
    minPlayers: 6,
    maxPlayers: 30,
    minutes: 15,
    materials: ['큰 종이', '굵은 펜'],
    preparation: '팀별로 종이와 펜을 하나씩 준비합니다.',
    steps: [
      '각 팀의 첫 번째 사람에게만 제시어를 보여줍니다.',
      '말하지 않고 한 사람당 한 획만 그린 뒤 다음 사람에게 넘깁니다.',
      '마지막 사람이 그림을 보고 정답을 맞히면 점수를 얻습니다.',
    ],
    facilitatorScript: '한 번에 딱 한 획만 그릴 수 있어요. 지우거나 글자를 쓰면 안 됩니다.',
    safety: '펜을 들고 이동하지 않게 하고 종이를 고정하세요.',
    contact: 'none',
    noise: 'medium',
    newcomerFriendly: true,
  },
  {
    id: 'paper-tower',
    title: '종이탑 챌린지',
    summary: '제한된 재료로 가장 높고 안정적인 탑을 만드는 협동 미션',
    category: 'teamwork',
    moods: ['teamwork'],
    places: ['indoor', 'small'],
    minPlayers: 6,
    maxPlayers: 36,
    minutes: 20,
    materials: ['A4 용지 10장씩', '테이프 50cm씩'],
    preparation: '팀마다 같은 양의 종이와 테이프를 봉투에 넣어둡니다.',
    steps: [
      '3~6명씩 팀을 나눕니다.',
      '3분 동안 설계하고 10분 동안 종이탑을 만듭니다.',
      '손을 뗀 상태로 10초 이상 서 있는 탑의 높이를 측정합니다.',
    ],
    facilitatorScript: '재료는 추가되지 않습니다. 먼저 역할을 나누고 팀의 방법을 정해보세요.',
    safety: '의자나 책상 위에 올라가 높이를 더하지 못하게 하세요.',
    contact: 'none',
    noise: 'medium',
    newcomerFriendly: true,
  },
  {
    id: 'silent-lineup',
    title: '말없이 줄서기',
    summary: '말을 하지 않고 생일 월·일이나 이름순으로 줄을 완성하는 협동 게임',
    category: 'teamwork',
    moods: ['active', 'teamwork'],
    places: ['indoor', 'outdoor'],
    minPlayers: 8,
    maxPlayers: 50,
    minutes: 10,
    materials: [],
    preparation: '참가자가 한 줄로 설 수 있는 통로를 확보합니다.',
    steps: [
      '팀별로 출발선에 섭니다.',
      '말과 휴대폰 없이 이름 가나다순으로 줄을 섭니다.',
      '완료 후 한 명씩 이름을 말해 순서를 확인합니다.',
    ],
    facilitatorScript: '말소리는 사용할 수 없지만 손짓과 표정은 괜찮아요. 서로 배려하며 순서를 찾아보세요.',
    safety: '생년이나 나이는 묻지 않고 이름순처럼 민감하지 않은 기준을 우선 사용하세요.',
    contact: 'none',
    noise: 'low',
    newcomerFriendly: true,
  },
  {
    id: 'mission-relay',
    title: '미션 스테이션 릴레이',
    summary: '짧은 미션을 팀원이 하나씩 해결하며 완주하는 대규모 활동 게임',
    category: 'active',
    moods: ['active', 'teamwork'],
    places: ['indoor', 'outdoor'],
    minPlayers: 12,
    maxPlayers: 100,
    minutes: 30,
    materials: ['종이컵', '탁구공', '미션 카드'],
    preparation: '공간에 4개의 미션 지점을 만들고 진행자를 한 명씩 배치합니다.',
    steps: [
      '팀마다 이동 순서가 다른 미션 카드를 받습니다.',
      '컵 쌓기, 탁구공 옮기기, 초성 맞히기, 팀 구호 만들기를 수행합니다.',
      '모든 지점의 확인 도장을 먼저 받은 팀이 승리합니다.',
    ],
    facilitatorScript: '빠른 것보다 안전하고 정확하게 미션을 마치는 팀이 좋은 팀입니다.',
    safety: '달리는 구간을 분리하고 바닥의 미끄러운 물건을 모두 치우세요.',
    contact: 'light',
    noise: 'high',
    newcomerFriendly: true,
  },
  {
    id: 'move-if',
    title: '해당되면 자리 이동',
    summary: '가벼운 취향 질문에 해당하는 사람이 자리를 옮기는 활기찬 공감 게임',
    category: 'active',
    moods: ['active', 'easy'],
    places: ['indoor', 'outdoor'],
    minPlayers: 10,
    maxPlayers: 40,
    minutes: 15,
    materials: ['참가자보다 하나 적은 의자'],
    preparation: '의자를 원형으로 놓고 가운데 장애물을 치웁니다.',
    steps: [
      '술래가 가운데서 “민트초코를 좋아하는 사람”처럼 가벼운 문장을 말합니다.',
      '해당하는 사람은 두 칸 이상 떨어진 빈자리로 이동합니다.',
      '자리에 앉지 못한 사람이 다음 문장을 말합니다.',
    ],
    facilitatorScript: '외모, 성적, 가정, 연애, 신앙 수준에 관한 문장은 사용할 수 없어요.',
    safety: '의자 사이 간격을 넓히고 뛰거나 밀지 않도록 안내하세요.',
    contact: 'light',
    noise: 'high',
    newcomerFriendly: true,
  },
  {
    id: 'human-rock-paper-scissors',
    title: '전신 가위바위보',
    summary: '팀이 같은 동작을 정해 동시에 표현하는 단순하고 큰 활동 게임',
    category: 'active',
    moods: ['active', 'teamwork'],
    places: ['indoor', 'outdoor'],
    minPlayers: 10,
    maxPlayers: 80,
    minutes: 10,
    materials: [],
    preparation: '두 팀이 서로 마주 볼 수 있는 안전한 간격을 확보합니다.',
    steps: [
      '팀끼리 가위·바위·보 중 하나의 전신 동작을 정합니다.',
      '진행자의 신호에 맞춰 팀 전원이 동시에 동작합니다.',
      '3판 2선승으로 진행하고 팀원이 모두 같은 동작을 하지 못하면 무효입니다.',
    ],
    facilitatorScript: '우리 팀의 동작을 조용히 정하고, 신호가 들리면 한마음으로 크게 표현해주세요.',
    safety: '점프 대신 제자리 동작으로 진행하고 팀 사이 간격을 유지하세요.',
    contact: 'none',
    noise: 'high',
    newcomerFriendly: true,
  },
  {
    id: 'number-sense',
    title: '숫자 눈치',
    summary: '서로 신호하지 않고 1부터 차례대로 숫자를 이어가는 집중 게임',
    category: 'active',
    moods: ['easy', 'calm'],
    places: ['indoor', 'outdoor', 'small'],
    minPlayers: 5,
    maxPlayers: 30,
    minutes: 5,
    materials: [],
    preparation: '모두가 편하게 앉거나 설 수 있으면 준비가 끝납니다.',
    steps: [
      '누구든 1부터 시작해 한 번에 숫자 하나를 말합니다.',
      '두 명 이상 동시에 말하면 다시 1부터 시작합니다.',
      '참가자 수만큼의 숫자에 도달하면 성공입니다.',
    ],
    facilitatorScript: '순서를 정하거나 눈짓으로 신호하면 안 됩니다. 조용히 서로의 호흡을 느껴보세요.',
    safety: '실패한 사람을 지목하지 말고 공동의 도전으로 진행하세요.',
    contact: 'none',
    noise: 'low',
    newcomerFriendly: true,
  },
  {
    id: 'bible-initial-quiz',
    title: '성경 인물 초성 퀴즈',
    summary: '난이도를 조절할 수 있는 팀 대항 성경 인물 맞히기',
    category: 'bible',
    moods: ['bible', 'teamwork'],
    places: ['indoor', 'outdoor', 'small'],
    minPlayers: 6,
    maxPlayers: 80,
    minutes: 15,
    materials: ['초성 문제 화면 또는 카드'],
    preparation: '쉬움·보통·어려움 난이도로 문제를 5개씩 준비합니다.',
    steps: [
      '팀마다 순서대로 난이도를 선택합니다.',
      '초성을 본 뒤 20초 동안 팀원끼리 상의합니다.',
      '인물 이름과 관련 사건을 함께 맞히면 보너스 점수를 얻습니다.',
    ],
    facilitatorScript: '성경 지식을 평가하는 시간이 아니에요. 모르면 힌트를 함께 듣고 알아가면 됩니다.',
    safety: '새신자가 소외되지 않도록 팀 상의 방식으로 진행하고 개인에게 답을 강요하지 마세요.',
    contact: 'none',
    noise: 'medium',
    newcomerFriendly: true,
  },
  {
    id: 'verse-order',
    title: '말씀 순서 맞추기',
    summary: '낱말 카드를 조합해 한 절의 말씀을 완성하는 협동 게임',
    category: 'bible',
    moods: ['bible', 'teamwork'],
    places: ['indoor', 'small'],
    minPlayers: 6,
    maxPlayers: 36,
    minutes: 15,
    materials: ['말씀 낱말 카드'],
    preparation: '팀별로 같은 성경 구절의 낱말 카드를 섞어 봉투에 넣습니다.',
    steps: [
      '봉투를 열고 낱말을 모두 펼칩니다.',
      '팀이 상의해 말씀 순서를 완성합니다.',
      '완성한 말씀을 함께 읽고 구절의 의미를 한 문장으로 나눕니다.',
    ],
    facilitatorScript: '정확한 순서를 먼저 맞춘 뒤, 이 말씀이 오늘 우리에게 주는 의미도 한 문장으로 나눠볼게요.',
    safety: '암송 경험의 차이를 평가하지 말고 성경 찾기를 허용하세요.',
    contact: 'none',
    noise: 'low',
    newcomerFriendly: true,
  },
  {
    id: 'bible-twenty-questions',
    title: '성경 인물 스무고개',
    summary: '예·아니요 질문만으로 성경 인물을 추리하는 전 연령 게임',
    category: 'bible',
    moods: ['bible', 'easy'],
    places: ['indoor', 'outdoor', 'small'],
    minPlayers: 4,
    maxPlayers: 40,
    minutes: 15,
    materials: ['성경 인물 카드'],
    preparation: '잘 알려진 성경 인물 카드를 난이도별로 준비합니다.',
    steps: [
      '한 명이 인물 카드를 보지 않고 이마 앞에 듭니다.',
      '예·아니요로 답할 수 있는 질문을 한 번씩 합니다.',
      '10개의 질문 안에 인물을 맞히면 성공합니다.',
    ],
    facilitatorScript: '“구약에 나오나요?”, “왕인가요?”처럼 예·아니요로 답할 수 있는 질문을 해주세요.',
    safety: '정답을 모르는 참가자를 놀리지 않도록 팀이 힌트를 도울 수 있게 하세요.',
    contact: 'none',
    noise: 'medium',
    newcomerFriendly: true,
  },
  {
    id: 'praise-intro',
    title: '찬양 전주 맞히기',
    summary: '공식 찬양 음원의 앞부분을 듣고 곡명을 맞히는 분위기 전환 게임',
    category: 'bible',
    moods: ['bible', 'active'],
    places: ['indoor', 'small'],
    minPlayers: 6,
    maxPlayers: 100,
    minutes: 20,
    materials: ['스피커', '공식 찬양 음원'],
    preparation: '세대와 취향을 고려해 익숙한 찬양 10곡의 시작 위치를 확인합니다.',
    steps: [
      '찬양의 전주 3초를 들려줍니다.',
      '팀은 답안판에 곡명을 적어 동시에 듭니다.',
      '정답 공개 후 후렴 한 소절을 함께 부르면 보너스 점수를 줍니다.',
    ],
    facilitatorScript: '가수보다 찬양 제목을 맞히면 됩니다. 한 번 더 듣기 기회는 팀마다 한 번씩 있어요.',
    safety: '영상은 공식 찬양팀 채널을 사용하고 음량을 지나치게 높이지 마세요.',
    contact: 'none',
    noise: 'medium',
    newcomerFriendly: true,
  },
  {
    id: 'gratitude-keyword',
    title: '감사 키워드 한 바퀴',
    summary: '오늘 감사한 일을 한 단어로 나누며 모임을 따뜻하게 마무리하는 활동',
    category: 'calm',
    moods: ['calm', 'bible'],
    places: ['indoor', 'outdoor', 'small'],
    minPlayers: 3,
    maxPlayers: 25,
    minutes: 10,
    materials: [],
    preparation: '서로의 얼굴을 볼 수 있도록 원이나 반원으로 앉습니다.',
    steps: [
      '진행자가 오늘 감사한 일을 한 단어로 먼저 나눕니다.',
      '원하는 순서대로 한 사람씩 한 단어를 말합니다.',
      '모든 단어를 천천히 다시 읽고 짧은 감사 기도로 마칩니다.',
    ],
    facilitatorScript: '설명은 선택이에요. 떠오르는 감사 한 단어만 편안하게 나눠주세요. 건너뛰어도 괜찮습니다.',
    safety: '발언을 원하지 않는 참가자에게 순서를 강요하지 마세요.',
    contact: 'none',
    noise: 'low',
    newcomerFriendly: true,
  },
  {
    id: 'anonymous-cheer',
    title: '익명 응원 우체통',
    summary: '서로에게 짧은 격려를 익명으로 적어 전하는 조용한 공동체 활동',
    category: 'calm',
    moods: ['calm', 'teamwork'],
    places: ['indoor', 'small'],
    minPlayers: 5,
    maxPlayers: 40,
    minutes: 20,
    materials: ['작은 종이', '펜', '이름 봉투'],
    preparation: '참가자 이름을 적은 봉투를 벽이나 테이블에 놓습니다.',
    steps: [
      '각자 세 사람 이상에게 구체적인 장점이나 응원을 적습니다.',
      '이름을 쓰지 않고 해당 봉투에 쪽지를 넣습니다.',
      '모임이 끝날 때 자신의 봉투를 가져갑니다.',
    ],
    facilitatorScript: '외모 평가 대신 오늘 본 태도와 장점, 앞으로의 응원을 구체적으로 적어주세요.',
    safety: '진행자가 모욕적이거나 장난스러운 문구가 없는지 전달 전에 확인하세요.',
    contact: 'none',
    noise: 'low',
    newcomerFriendly: true,
  },
  {
    id: 'balance-talk',
    title: '선택 밸런스 토크',
    summary: '가벼운 두 가지 선택을 통해 서로의 취향을 알아가는 대화 게임',
    category: 'calm',
    moods: ['easy', 'calm'],
    places: ['indoor', 'outdoor', 'small'],
    minPlayers: 4,
    maxPlayers: 30,
    minutes: 15,
    materials: ['선택 질문 카드'],
    preparation: '“바다 vs 산”, “계획 vs 즉흥” 같은 가벼운 질문을 준비합니다.',
    steps: [
      '진행자가 두 가지 선택지를 읽습니다.',
      '참가자는 손가락이나 자리 방향으로 선택을 표시합니다.',
      '각 선택에서 한 명씩 이유를 짧게 나눕니다.',
    ],
    facilitatorScript: '정답은 없습니다. 선택하지 않거나 이유 설명을 건너뛰어도 괜찮아요.',
    safety: '정치, 연애, 경제 형편, 신앙 수준을 비교하는 질문은 사용하지 마세요.',
    contact: 'none',
    noise: 'low',
    newcomerFriendly: true,
  },
  {
    id: 'one-line-prayer',
    title: '한 문장 기도 릴레이',
    summary: '부담 없는 한 문장으로 서로를 축복하며 모임을 마무리하는 시간',
    category: 'calm',
    moods: ['calm', 'bible'],
    places: ['indoor', 'outdoor', 'small'],
    minPlayers: 3,
    maxPlayers: 20,
    minutes: 10,
    materials: [],
    preparation: '기도 제목을 공개하지 않아도 된다고 먼저 안내합니다.',
    steps: [
      '진행자가 공동체를 위한 짧은 한 문장 기도로 시작합니다.',
      '원하는 사람만 한 문장씩 기도를 이어갑니다.',
      '진행자가 모두를 축복하는 기도로 마무리합니다.',
    ],
    facilitatorScript: '길거나 잘해야 하는 기도가 아니에요. 참여하지 않고 마음으로 함께해도 괜찮습니다.',
    safety: '개인의 기도 제목이나 과거를 공개하도록 요구하지 마세요.',
    contact: 'none',
    noise: 'low',
    newcomerFriendly: true,
  },
  {
    id: 'team-motion-quiz',
    title: '팀 전체 몸짓 퀴즈',
    summary: '팀원 모두가 동시에 제시어를 표현하고 대표가 맞히는 대규모 게임',
    category: 'large',
    moods: ['active', 'teamwork'],
    places: ['indoor', 'outdoor'],
    minPlayers: 16,
    maxPlayers: 120,
    minutes: 20,
    materials: ['큰 제시어 화면'],
    preparation: '팀 대표만 화면을 등지고, 나머지는 화면을 볼 수 있게 배치합니다.',
    steps: [
      '화면에 제시어가 나오면 팀원 전체가 말없이 몸으로 표현합니다.',
      '대표는 30초 안에 답을 맞힙니다.',
      '라운드마다 대표를 바꾸고 정답 수를 합산합니다.',
    ],
    facilitatorScript: '입 모양으로 단어를 말하거나 글자를 쓰면 안 됩니다. 모두가 함께 표현할수록 쉬워져요.',
    safety: '과도하게 큰 동작이나 바닥에 눕는 동작을 금지하고 팀 간 간격을 확보하세요.',
    contact: 'none',
    noise: 'high',
    newcomerFriendly: true,
  },
  {
    id: 'four-corner-choice',
    title: '네 모퉁이 취향 이동',
    summary: '네 가지 선택지 중 하나로 이동해 같은 취향의 사람과 대화하는 게임',
    category: 'large',
    moods: ['active', 'easy'],
    places: ['indoor', 'outdoor'],
    minPlayers: 16,
    maxPlayers: 100,
    minutes: 15,
    materials: ['선택지 표지 4장'],
    preparation: '공간의 네 구역에 1~4번 표지를 붙입니다.',
    steps: [
      '진행자가 네 가지 선택지를 읽습니다.',
      '참가자는 자신이 고른 구역으로 천천히 이동합니다.',
      '같은 구역의 두세 명과 선택 이유를 30초 동안 나눕니다.',
    ],
    facilitatorScript: '다른 사람의 선택을 따라갈 필요 없어요. 지금 내 마음에 가까운 곳으로 이동해주세요.',
    safety: '이동 통로를 넓게 확보하고 민감하거나 소수자를 드러내는 질문은 제외하세요.',
    contact: 'none',
    noise: 'medium',
    newcomerFriendly: true,
  },
  {
    id: 'team-slogan',
    title: '60초 팀 구호 제작소',
    summary: '짧은 시간 안에 팀 이름과 동작을 함께 만드는 활기찬 팀 빌딩',
    category: 'large',
    moods: ['active', 'teamwork'],
    places: ['indoor', 'outdoor'],
    minPlayers: 12,
    maxPlayers: 100,
    minutes: 10,
    materials: [],
    preparation: '4~10명씩 팀을 나누고 발표할 앞 공간을 확보합니다.',
    steps: [
      '팀에게 60초 동안 이름, 짧은 구호, 한 가지 동작을 만들게 합니다.',
      '팀마다 10초 안에 결과를 발표합니다.',
      '가장 협동적, 가장 기억에 남는 등 여러 부문으로 모두를 격려합니다.',
    ],
    facilitatorScript: '완벽한 공연이 아니라 팀이 함께 결정하는 게 목표예요. 짧고 모두가 할 수 있는 동작으로 만들어주세요.',
    safety: '특정 사람을 놀리거나 다른 팀을 비하하는 이름과 구호는 사용할 수 없습니다.',
    contact: 'none',
    noise: 'high',
    newcomerFriendly: true,
  },
  {
    id: 'memory-chain',
    title: '기억 연결 이야기',
    summary: '앞사람의 단어를 기억해 한 단어씩 더하며 집중력을 높이는 원형 게임',
    category: 'icebreaker',
    moods: ['easy', 'calm'],
    places: ['indoor', 'outdoor', 'small'],
    minPlayers: 4,
    maxPlayers: 20,
    minutes: 10,
    materials: [],
    preparation: '참가자가 서로의 목소리를 잘 들을 수 있도록 앉습니다.',
    steps: [
      '첫 사람이 “수련회에 가져갈 것은 성경”처럼 한 단어로 시작합니다.',
      '다음 사람은 앞의 모든 단어를 말하고 자신의 단어를 하나 더합니다.',
      '틀리면 모두가 힌트를 주고 끝까지 한 바퀴를 완성합니다.',
    ],
    facilitatorScript: '탈락은 없습니다. 기억나지 않으면 모두가 함께 힌트를 줘서 끝까지 이어갈게요.',
    safety: '기억 실수를 놀리지 않고 협동 방식으로 진행하세요.',
    contact: 'none',
    noise: 'low',
    newcomerFriendly: true,
  },
]

function playerFit(game: RecreationGame, players: number) {
  if (players < game.minPlayers) return -Math.min(40, (game.minPlayers - players) * 6)
  if (game.maxPlayers !== null && players > game.maxPlayers) {
    return -Math.min(40, (players - game.maxPlayers) * 2)
  }
  return 28
}

export function scoreRecreationGame(
  game: RecreationGame,
  context: RecreationContext
) {
  let score = playerFit(game, context.players)

  score += game.places.includes(context.place) ? 24 : -24
  score += game.minutes <= context.minutes ? 18 : -(game.minutes - context.minutes) * 2
  score += context.mood === 'all' || game.moods.includes(context.mood) ? 22 : 0
  score += context.noMaterials && game.materials.length > 0 ? -18 : 6
  score += game.newcomerFriendly ? 4 : 0

  return score
}

export function recommendRecreationGames(
  context: RecreationContext,
  limit = 3
) {
  return [...recreationGames]
    .map((game) => ({ game, score: scoreRecreationGame(game, context) }))
    .sort((a, b) => b.score - a.score || a.game.title.localeCompare(b.game.title, 'ko'))
    .slice(0, Math.max(0, limit))
    .map(({ game }) => game)
}

export function splitParticipantsIntoTeams(
  participantNames: string[],
  teamCount: number,
  random: () => number = Math.random
) {
  const normalized = Array.from(
    new Set(participantNames.map((name) => name.trim()).filter(Boolean))
  )
  const shuffled = [...normalized]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]]
  }

  const size = Math.min(Math.max(1, Math.floor(teamCount)), Math.max(1, shuffled.length))
  const teams = Array.from({ length: size }, (_, index) => ({
    name: `${index + 1}팀`,
    members: [] as string[],
  }))

  shuffled.forEach((name, index) => {
    teams[index % size].members.push(name)
  })

  return teams
}

export function formatRecreationPlayers(game: RecreationGame) {
  return game.maxPlayers === null
    ? `${game.minPlayers}명 이상`
    : `${game.minPlayers}–${game.maxPlayers}명`
}
