import type { SystemIconName } from '@/app/components/ui/SystemIcon'

export type MissionCategory = 'church' | 'daily' | 'food' | 'dessert'
export type MissionMode = 'team' | 'individual'

export type MissionCard = {
  id: string
  title: string
  instruction: string
  image?: string
  source?: string
}

export const missionCategories: Record<MissionCategory, { label: string; icon: SystemIconName; description: string }> = {
  church: { label: '교회', icon: 'prayer', description: '교회에서 함께할 수 있는 가벼운 행동 미션' },
  daily: { label: '일상', icon: 'sun', description: '처음 만난 사람과도 부담 없이 즐기는 미션' },
  food: { label: '음식', icon: 'disc', description: '사진을 보고 이야기하거나 맞히는 푸드 카드' },
  dessert: { label: '디저트', icon: 'heart', description: '달콤한 사진 한 장으로 시작하는 미션' },
}

function commonsImage(file: string) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=900`
}

function commonsSource(file: string) {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`
}

function photoCard(id: string, title: string, file: string): MissionCard {
  return {
    id,
    title,
    instruction: '사진 속 메뉴의 이름을 맞히고, 그 메뉴를 한 단어로 소개해 보세요.',
    image: commonsImage(file),
    source: commonsSource(file),
  }
}

export const missionDecks: Record<MissionCategory, MissionCard[]> = {
  church: [
    { id: 'church-1', title: '교회 물건 찾기', instruction: '교회에서 볼 수 있는 물건 5가지를 차례로 말해 보세요.' },
    { id: 'church-2', title: '따뜻한 인사', instruction: '가까운 사람에게 오늘 와줘서 고맙다고 말해 보세요.' },
    { id: 'church-3', title: '찬양 한 소절', instruction: '좋아하는 찬양 제목을 말하고, 좋아하는 이유를 한 문장으로 소개해 보세요.' },
    { id: 'church-4', title: '성경 인물', instruction: '좋아하는 성경 인물을 한 명씩 말해 보세요. 같은 인물이 나와도 괜찮아요.' },
    { id: 'church-5', title: '함께 기도', instruction: '모두가 기도할 수 있는 짧은 감사 제목을 하나 나눠 보세요.' },
    { id: 'church-6', title: '교회 안의 색', instruction: '지금 있는 공간에서 서로 다른 색 3가지를 찾아 말해 보세요.' },
    { id: 'church-7', title: '응원 한마디', instruction: '오른쪽 사람에게 이번 주 힘이 될 짧은 응원 한마디를 전해 보세요.' },
    { id: 'church-8', title: '새로운 발견', instruction: '오늘 교회에 오며 새롭게 본 것 한 가지를 이야기해 보세요.' },
  ],
  daily: [
    { id: 'daily-1', title: '오늘의 기분', instruction: '오늘 기분을 날씨로 표현하고, 이유를 한 문장으로 나눠 보세요.' },
    { id: 'daily-2', title: '같은 취향 찾기', instruction: '주변 사람과 공통으로 좋아하는 음식 하나를 찾아 보세요.' },
    { id: 'daily-3', title: '고마웠던 순간', instruction: '최근 고마웠던 일을 하나씩 이야기해 보세요.' },
    { id: 'daily-4', title: '내 가방 속', instruction: '오늘 챙겨온 물건 중 가장 유용한 것 하나를 소개해 보세요.' },
    { id: 'daily-5', title: '10초 그림', instruction: '10초 동안 손가락으로 공중에 동물을 그려 보세요. 다른 사람이 맞혀요.' },
    { id: 'daily-6', title: '닮은 점', instruction: '서로 공통점 2가지를 찾아 보세요.' },
    { id: 'daily-7', title: '주말 계획', instruction: '이번 주말에 하고 싶은 일을 한 가지씩 말해 보세요.' },
    { id: 'daily-8', title: '이름 기억하기', instruction: '앞사람 이름을 부르고 본인 이름을 덧붙여 보세요. 한 바퀴 돌아요.' },
  ],
  food: [
    photoCard('food-1', '피자', 'PizzaMargherita.jpg'),
    photoCard('food-2', '비빔밥', 'Bibimbap with kkakdugi.jpg'),
    photoCard('food-3', '김치볶음밥', 'Kimchi fried rice.jpg'),
    photoCard('food-4', '초밥', 'Sushi (146427173).jpeg'),
    photoCard('food-5', '치킨', 'Fried chicken thigh.jpg'),
  ],
  dessert: [
    photoCard('dessert-1', '컵케이크', 'Cupcakes 1.jpg'),
    photoCard('dessert-2', '젤라토', 'Gelato ice cream.jpg'),
    photoCard('dessert-3', '치즈케이크', 'Cheesecake001.jpg'),
    photoCard('dessert-4', '도넛', 'Boston Cream Donut.jpg'),
    photoCard('dessert-5', '마카롱', 'French macaroons.jpg'),
  ],
}

export function isMissionCategory(value: unknown): value is MissionCategory {
  return value === 'church' || value === 'daily' || value === 'food' || value === 'dessert'
}

export function isMissionMode(value: unknown): value is MissionMode {
  return value === 'team' || value === 'individual'
}
