import {
  faithMoodOptions,
  faithWeatherOptions,
  type FaithMood,
  type FaithWeather,
  getKoreaDate,
} from './dailyFaith'
import {
  prayerStageOrder,
  type PrayerStage,
} from './prayerJourney'

export type FaithCheckinInsight = {
  checkin_date: string
  mood: FaithMood
  faith_weather: FaithWeather
}

export type PrayerStageInsight = {
  prayer_stage: PrayerStage | null
}

function shiftDateKey(value: string, amount: number) {
  const date = new Date(`${value}T12:00:00+09:00`)
  date.setUTCDate(date.getUTCDate() + amount)
  return getKoreaDate(date)
}

export function getCurrentDayStreak(values: string[], today = getKoreaDate()) {
  const days = new Set(values)
  let cursor = days.has(today) ? today : shiftDateKey(today, -1)
  if (!days.has(cursor)) return 0

  let streak = 0
  while (days.has(cursor)) {
    streak += 1
    cursor = shiftDateKey(cursor, -1)
  }
  return streak
}

export function buildRecentDateKeys(days: number, today = getKoreaDate()) {
  return Array.from({ length: days }, (_, index) =>
    shiftDateKey(today, index - days + 1)
  )
}

export function buildFaithInsightSummary({
  checkins,
  gratitudeDates,
  prayerDates,
  prayerPosts,
  today = getKoreaDate(),
}: {
  checkins: FaithCheckinInsight[]
  gratitudeDates: string[]
  prayerDates: string[]
  prayerPosts: PrayerStageInsight[]
  today?: string
}) {
  const recentDateKeys = buildRecentDateKeys(7, today)
  const checkinsByDate = new Map(checkins.map((item) => [item.checkin_date, item]))
  const recentCheckins = recentDateKeys.map((date) => ({
    date,
    checkin: checkinsByDate.get(date) ?? null,
  }))

  const moodCounts = Object.fromEntries(
    faithMoodOptions.map((option) => [option.value, 0])
  ) as Record<FaithMood, number>
  const weatherCounts = Object.fromEntries(
    faithWeatherOptions.map((option) => [option.value, 0])
  ) as Record<FaithWeather, number>

  checkins.forEach((item) => {
    moodCounts[item.mood] += 1
    weatherCounts[item.faith_weather] += 1
  })

  const stageCounts = Object.fromEntries(
    prayerStageOrder.map((stage) => [stage, 0])
  ) as Record<PrayerStage, number>
  prayerPosts.forEach((post) => {
    if (post.prayer_stage && prayerStageOrder.includes(post.prayer_stage)) {
      stageCounts[post.prayer_stage] += 1
    }
  })

  return {
    checkinStreak: getCurrentDayStreak(
      checkins.map((item) => item.checkin_date),
      today
    ),
    gratitudeStreak: getCurrentDayStreak(gratitudeDates, today),
    prayerStreak: getCurrentDayStreak(prayerDates, today),
    recentCheckins,
    moodCounts,
    weatherCounts,
    stageCounts,
  }
}

export function getFaithNextStep(checkin?: FaithCheckinInsight | null) {
  switch (checkin?.mood) {
    case 'anxious':
      return {
        eyebrow: '마음을 맡기는 다음 걸음',
        title: '혼자 버티지 말고 기도를 요청해보세요',
        description: '익명으로 나누고 함께 기도하는 사람을 만날 수 있어요.',
        href: '/post/new?board=prayer',
        action: '기도 요청하기',
      }
    case 'tired':
      return {
        eyebrow: '쉬어가는 다음 걸음',
        title: '찬양 한 곡으로 마음을 쉬게 해주세요',
        description: '이번 주 찬양에서 지금 필요한 곡을 골라보세요.',
        href: '/praise',
        action: '찬양 듣기',
      }
    case 'lonely':
      return {
        eyebrow: '연결되는 다음 걸음',
        title: '익명의 응원과 기도를 이어가보세요',
        description: '마니또에게 부담 없는 한마디를 전할 수 있어요.',
        href: '/manitto',
        action: '마니또 만나기',
      }
    case 'grateful':
      return {
        eyebrow: '감사를 남기는 다음 걸음',
        title: '오늘의 감사를 한 줄로 기록해보세요',
        description: '기록한 감사는 한 달 달력에서 다시 만날 수 있어요.',
        href: '/gratitude',
        action: '감사 기록하기',
      }
    case 'peaceful':
      return {
        eyebrow: '평안을 나누는 다음 걸음',
        title: '누군가의 기도 제목에 마음을 보태주세요',
        description: '지금 기도가 필요한 요청을 한 장씩 천천히 만나보세요.',
        href: '/pray',
        action: '5분 함께 기도',
      }
    default:
      return {
        eyebrow: '오늘의 첫 걸음',
        title: '마음과 신앙 날씨를 먼저 확인해보세요',
        description: '짧은 체크인이 오늘 필요한 기능을 안내해드려요.',
        href: '/',
        action: '오늘 체크인하기',
      }
  }
}
