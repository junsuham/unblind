import Link from 'next/link'
import type { Metadata } from 'next'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import { requireBetaUser } from '@/lib/betaAuth'
import {
  faithMoodOptions,
  faithWeatherOptions,
  getKoreaDate,
} from '@/lib/dailyFaith'
import {
  buildFaithInsightSummary,
  getFaithNextStep,
  type FaithCheckinInsight,
} from '@/lib/faithInsights'
import {
  prayerStageLabels,
  type PrayerStage,
} from '@/lib/prayerJourney'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '나의 신앙 여정 | 언블라인드',
  description: '체크인, 감사, 기도 기록을 한눈에 돌아보고 오늘의 다음 걸음을 찾습니다.',
}

type GratitudeDateRow = {
  entry_date: string
}

type PrayerReactionRow = {
  created_at: string
}

type PrayerPostRow = {
  prayer_stage: PrayerStage | null
}

function getLookbackDate(days: number) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString()
}

function getDayLabel(dateKey: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    weekday: 'short',
  }).format(new Date(`${dateKey}T12:00:00+09:00`))
}

export default async function FaithJourneyPage() {
  const { user } = await requireBetaUser()
  const lookback = getLookbackDate(90)

  const [
    { data: checkinRows, error: checkinError },
    { data: gratitudeRows, error: gratitudeError },
    { data: prayerRows, error: prayerError },
    { data: prayerPostRows, error: prayerPostError },
  ] = await Promise.all([
    supabaseAdmin
      .from('faith_checkins')
      .select('checkin_date, mood, faith_weather')
      .eq('user_id', user.id)
      .gte('created_at', lookback)
      .order('checkin_date', { ascending: false })
      .returns<FaithCheckinInsight[]>(),
    supabaseAdmin
      .from('gratitude_entries')
      .select('entry_date')
      .eq('user_id', user.id)
      .gte('created_at', lookback)
      .order('entry_date', { ascending: false })
      .returns<GratitudeDateRow[]>(),
    supabaseAdmin
      .from('reactions')
      .select('created_at')
      .in('actor_key', [user.id, `user:${user.id}`])
      .eq('type', 'pray')
      .gte('created_at', lookback)
      .order('created_at', { ascending: false })
      .returns<PrayerReactionRow[]>(),
    supabaseAdmin
      .from('posts')
      .select('prayer_stage')
      .eq('author_user_id', user.id)
      .eq('board', 'prayer')
      .neq('status', 'deleted')
      .returns<PrayerPostRow[]>(),
  ])

  const hasError = Boolean(
    checkinError || gratitudeError || prayerError || prayerPostError
  )
  const checkins = checkinRows ?? []
  const gratitudeDates = (gratitudeRows ?? []).map((item) => item.entry_date)
  const prayerDates = (prayerRows ?? []).map((item) => item.created_at)
  const prayerPosts = prayerPostRows ?? []
  const summary = buildFaithInsightSummary({
    checkins,
    gratitudeDates,
    prayerDates: prayerDates.map((value) => getKoreaDate(new Date(value))),
    prayerPosts,
  })
  const latestCheckin = checkins[0] ?? null
  const nextStep = getFaithNextStep(latestCheckin)
  const totalCheckins = checkins.length
  const topMoods = faithMoodOptions
    .map((option) => ({
      ...option,
      count: summary.moodCounts[option.value],
    }))
    .filter((item) => item.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 3)

  return (
    <AppShell topTitle="신앙 여정" bottomBar={<BottomTabBar active="home" />}>
      <div className="space-y-5">
        <section className="overflow-hidden rounded-[24px] bg-[linear-gradient(145deg,var(--ub-surface-card-strong),var(--ub-surface-brand-soft))] p-5 shadow-[var(--ub-shadow-soft)]">
          <p className="text-[11px] font-extrabold tracking-[0.12em] text-[var(--ub-color-brand)]">
            MY FAITH JOURNEY
          </p>
          <h2 className="mt-2 text-[22px] font-extrabold leading-[29px] tracking-[-0.6px] text-[var(--ub-text-primary)]">
            작은 기록이 쌓여
            <br />
            나만의 신앙 리듬이 돼요
          </h2>
          <p className="mt-2 text-[13px] leading-[20px] text-[var(--ub-text-secondary)]">
            최근 90일의 체크인, 감사, 기도를 한곳에서 돌아봅니다.
          </p>
        </section>

        {hasError && (
          <p className="rounded-[16px] bg-[var(--ub-surface-danger-soft)] px-4 py-3 text-[13px] text-[var(--ub-color-danger)]">
            일부 기록을 불러오지 못했어요. 잠시 후 다시 확인해주세요.
          </p>
        )}

        <section aria-label="연속 실천 기록" className="grid grid-cols-3 overflow-hidden rounded-[20px] bg-[var(--ub-surface-card-strong)] shadow-[var(--ub-shadow-soft)]">
          {[
            ['체크인', summary.checkinStreak],
            ['감사', summary.gratitudeStreak],
            ['기도', summary.prayerStreak],
          ].map(([label, value], index) => (
            <div
              key={String(label)}
              className={`px-2 py-4 text-center ${index < 2 ? 'border-r border-[var(--ub-separator)]' : ''}`}
            >
              <strong className="block text-[22px] font-extrabold text-[var(--ub-color-brand)]">
                {value}일
              </strong>
              <span className="mt-1 block text-[11px] font-semibold text-[var(--ub-text-secondary)]">
                연속 {label}
              </span>
            </div>
          ))}
        </section>

        <section className="rounded-[20px] bg-[var(--ub-surface-card-strong)] p-4 shadow-[var(--ub-shadow-soft)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold text-[var(--ub-text-tertiary)]">최근 7일</p>
              <h2 className="mt-0.5 text-[17px] font-extrabold text-[var(--ub-text-primary)]">마음과 신앙 날씨</h2>
            </div>
            <span className="text-[11px] font-semibold text-[var(--ub-text-tertiary)]">
              {summary.recentCheckins.filter((item) => item.checkin).length}/7일
            </span>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {summary.recentCheckins.map(({ date, checkin }) => {
              const mood = checkin
                ? faithMoodOptions.find((item) => item.value === checkin.mood)
                : null
              const weather = checkin
                ? faithWeatherOptions.find((item) => item.value === checkin.faith_weather)
                : null

              return (
                <div key={date} className="min-w-0 text-center">
                  <span className="block text-[10px] font-semibold text-[var(--ub-text-tertiary)]">
                    {getDayLabel(date)}
                  </span>
                  <div
                    title={checkin ? `${mood?.label} · ${weather?.label}` : '기록 없음'}
                    className={`mt-1.5 flex aspect-square items-center justify-center rounded-[12px] text-[18px] ${
                      checkin
                        ? 'bg-[var(--ub-surface-brand-soft)]'
                        : 'border border-dashed border-[var(--ub-separator-strong)] text-[var(--ub-text-tertiary)]'
                    }`}
                  >
                    {checkin ? weather?.emoji : '·'}
                  </div>
                  <span className="mt-1 block truncate text-[9px] text-[var(--ub-text-tertiary)]">
                    {mood?.label ?? ''}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-[20px] bg-[var(--ub-surface-card-strong)] p-4 shadow-[var(--ub-shadow-soft)]">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[12px] font-bold text-[var(--ub-text-tertiary)]">최근 90일</p>
              <h2 className="mt-0.5 text-[17px] font-extrabold text-[var(--ub-text-primary)]">자주 머문 마음</h2>
            </div>
            <span className="text-[11px] text-[var(--ub-text-tertiary)]">{totalCheckins}번 기록</span>
          </div>
          <div className="mt-4 space-y-3">
            {topMoods.map((mood) => {
              const percent = totalCheckins
                ? Math.round((mood.count / totalCheckins) * 100)
                : 0
              return (
                <div key={mood.value}>
                  <div className="mb-1.5 flex items-center gap-2 text-[12px]">
                    <span aria-hidden>{mood.emoji}</span>
                    <span className="font-semibold text-[var(--ub-text-primary)]">{mood.label}</span>
                    <span className="ml-auto text-[var(--ub-text-tertiary)]">{percent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--ub-surface-muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--ub-color-brand)]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {topMoods.length === 0 && (
              <p className="py-4 text-center text-[13px] text-[var(--ub-text-tertiary)]">
                홈에서 오늘의 신앙 체크인을 남겨보세요.
              </p>
            )}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-[14px] font-extrabold text-[var(--ub-text-on-brand-primary)]">내 기도여정</h2>
            <Link href="/board/prayer" className="text-[12px] font-bold text-[var(--ub-color-brand)]">전체 보기</Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(prayerStageLabels) as PrayerStage[]).map((stage) => (
              <Link
                key={stage}
                href={`/board/prayer?stage=${stage}`}
                className="rounded-[17px] bg-[var(--ub-surface-card-strong)] p-4 shadow-sm active:bg-[var(--ub-surface-pressed)]"
              >
                <span className="block text-[20px] font-extrabold text-[var(--ub-color-brand)]">
                  {summary.stageCounts[stage]}
                </span>
                <span className="mt-1 block text-[12px] font-semibold text-[var(--ub-text-secondary)]">
                  {prayerStageLabels[stage]}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[22px] bg-[var(--ub-surface-card-strong)] p-5 shadow-[var(--ub-shadow-soft)]">
          <p className="text-[11px] font-extrabold tracking-[0.08em] text-[var(--ub-color-brand)]">{nextStep.eyebrow}</p>
          <h2 className="mt-2 text-[18px] font-extrabold leading-[25px] text-[var(--ub-text-primary)]">{nextStep.title}</h2>
          <p className="mt-1 text-[13px] leading-[19px] text-[var(--ub-text-secondary)]">{nextStep.description}</p>
          <Link
            href={nextStep.href}
            className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-[14px] bg-[var(--ub-color-brand)] px-4 text-[13px] font-bold text-white"
          >
            {nextStep.action}
            <SystemIcon name="next" size={15} />
          </Link>
        </section>

        <p className="px-2 pb-2 text-center text-[11px] leading-[17px] text-[var(--ub-text-on-brand-tertiary)]">
          신앙 기록은 본인에게만 보이며 다른 사용자에게 공개되지 않습니다.
        </p>
      </div>
    </AppShell>
  )
}
