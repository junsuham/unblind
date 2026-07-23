export type PrayerStage = 'requested' | 'praying' | 'answered' | 'grateful'

export const prayerStageOrder: PrayerStage[] = [
  'requested',
  'praying',
  'answered',
  'grateful',
]

export const prayerStageLabels: Record<PrayerStage, string> = {
  requested: '기도 요청',
  praying: '함께 기도 중',
  answered: '응답 완료!',
  grateful: '주님께 감사',
}

export function isPrayerStage(value: unknown): value is PrayerStage {
  return prayerStageOrder.includes(value as PrayerStage)
}
