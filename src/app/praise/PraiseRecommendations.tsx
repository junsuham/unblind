'use client'

import { useMemo, useState } from 'react'
import { SystemIcon } from '@/app/components/ui/SystemIcon'

type Mood = 'comfort' | 'gratitude' | 'recovery' | 'decision' | 'prayer' | 'joy'

type Song = {
  title: string
  artist: string
  reason: string
}

const moodLabels: Record<Mood, string> = {
  comfort: '위로',
  gratitude: '감사',
  recovery: '회복',
  decision: '결단',
  prayer: '기도',
  joy: '기쁨',
}

const songsByMood: Record<Mood, Song[]> = {
  comfort: [
    { title: '주가 일하시네', artist: '김브라이언', reason: '보이지 않는 시간에도 일하시는 하나님을 묵상해요.' },
    { title: '주는 완전합니다', artist: '마커스워십', reason: '이해하기 어려운 순간에도 주님의 선하심을 바라봐요.' },
    { title: '내가 늘 의지하는 예수', artist: '찬송가', reason: '지친 마음을 예수님께 조용히 맡겨보세요.' },
  ],
  gratitude: [
    { title: '은혜', artist: '손경민', reason: '평범한 하루 안에 있던 은혜를 돌아봐요.' },
    { title: '감사', artist: '손경민', reason: '상황을 넘어 함께하신 하나님께 감사를 고백해요.' },
    { title: '지금까지 지내온 것', artist: '찬송가', reason: '지나온 모든 시간을 인도하신 은혜를 기억해요.' },
  ],
  recovery: [
    { title: '충만', artist: '지선', reason: '성령님의 위로와 새 힘을 구하며 들어보세요.' },
    { title: '꽃들도', artist: '제이워십', reason: '메마른 자리에도 다시 피어날 소망을 노래해요.' },
    { title: '나의 등 뒤에서', artist: '찬양', reason: '넘어질 때 붙드시는 하나님을 기억해요.' },
  ],
  decision: [
    { title: '나는 주를 섬기는 것에 후회가 없습니다', artist: '피아워십', reason: '믿음의 방향을 다시 고백하고 싶을 때 들어보세요.' },
    { title: '부르신 곳에서', artist: '마커스워십', reason: '지금 있는 자리에서 드릴 순종을 생각해요.' },
    { title: '내 진정 사모하는', artist: '찬송가', reason: '예수님을 가장 귀한 분으로 고백해요.' },
  ],
  prayer: [
    { title: '하나님의 부르심', artist: '피아워십', reason: '조급함을 내려놓고 하나님의 인도를 구해요.' },
    { title: '주 품에', artist: '어노인팅', reason: '말이 나오지 않을 때 주님의 품 안에 머물러요.' },
    { title: '내 기도하는 그 시간', artist: '찬송가', reason: '기도의 자리로 천천히 돌아가도록 도와줘요.' },
  ],
  joy: [
    { title: '기뻐하며 왕께 노래 부르리', artist: '찬양', reason: '가볍게 일어나 기쁨으로 하나님을 찬양해요.' },
    { title: '예수 열방의 소망', artist: '어노인팅', reason: '우리의 소망이신 예수님을 힘차게 고백해요.' },
    { title: '내 영혼이 은총 입어', artist: '찬송가', reason: '은혜 안에서 누리는 기쁨을 함께 노래해요.' },
  ],
}

export default function PraiseRecommendations() {
  const [selectedMood, setSelectedMood] = useState<Mood>('comfort')
  const recommendations = useMemo(() => songsByMood[selectedMood], [selectedMood])

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(moodLabels) as Mood[]).map((mood) => (
          <button
            key={mood}
            type="button"
            onClick={() => setSelectedMood(mood)}
            className={
              selectedMood === mood
                ? 'rounded-full bg-[#ff4b00] px-4 py-2.5 text-[14px] font-semibold text-white'
                : 'rounded-full bg-[var(--ub-surface-card)] px-4 py-2.5 text-[14px] text-[var(--ub-text-primary)] shadow-sm'
            }
          >
            {moodLabels[mood]}
          </button>
        ))}
      </div>

      <section className="mt-5 overflow-hidden rounded-[22px] bg-[var(--ub-surface-card-strong)] text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-soft)]">
        {recommendations.map((song) => {
          const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.title} ${song.artist}`)}`

          return (
            <a
              key={`${selectedMood}-${song.title}`}
              href={searchUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-3 border-b border-[var(--ub-separator)] px-4 py-4 last:border-b-0 active:bg-[var(--ub-surface-pressed)]"
            >
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[var(--ub-surface-muted)] text-[var(--ub-color-brand)]">
                <SystemIcon name="music" size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold">{song.title}</span>
                <span className="mt-0.5 block text-[13px] text-[var(--ub-text-tertiary)]">
                  {song.artist}
                </span>
                <span className="mt-2 block text-[13px] leading-[19px] text-[var(--ub-text-secondary)]">
                  {song.reason}
                </span>
              </span>
              <span className="mt-2 text-[20px] text-[var(--ub-text-tertiary)]">›</span>
            </a>
          )
        })}
      </section>

      <p className="mt-3 px-1 text-[12px] leading-[18px] text-[var(--ub-text-on-brand-tertiary)]">
        곡을 누르면 YouTube 검색 결과로 이동합니다. 공식 음원이나 아티스트 채널을 선택해 들어주세요.
      </p>
    </div>
  )
}
