export type FaithMood = 'peaceful' | 'grateful' | 'tired' | 'anxious' | 'lonely'
export type FaithWeather = 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy'

export const faithMoodOptions: Array<{
  value: FaithMood
  label: string
  emoji: string
}> = [
  { value: 'peaceful', label: '평안함', emoji: '😌' },
  { value: 'grateful', label: '감사함', emoji: '🥰' },
  { value: 'tired', label: '지침', emoji: '😮‍💨' },
  { value: 'anxious', label: '불안함', emoji: '😟' },
  { value: 'lonely', label: '외로움', emoji: '🥺' },
]

export const faithWeatherOptions: Array<{
  value: FaithWeather
  label: string
  emoji: string
}> = [
  { value: 'sunny', label: '맑음', emoji: '☀️' },
  { value: 'partly_cloudy', label: '구름 조금', emoji: '🌤️' },
  { value: 'cloudy', label: '흐림', emoji: '☁️' },
  { value: 'rainy', label: '비', emoji: '🌧️' },
]

export function isFaithMood(value: unknown): value is FaithMood {
  return faithMoodOptions.some((option) => option.value === value)
}

export function isFaithWeather(value: unknown): value is FaithWeather {
  return faithWeatherOptions.some((option) => option.value === value)
}

export function getKoreaDate(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value)
}

export function isYearMonth(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
}

export function getMonthRange(yearMonth: string) {
  const [year, month] = yearMonth.split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()

  return {
    start: `${yearMonth}-01`,
    end: `${yearMonth}-${String(lastDay).padStart(2, '0')}`,
  }
}
