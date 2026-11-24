'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { FaithMood, FaithWeather } from '@/lib/dailyFaith'
import styles from './FaithAvatar.module.css'

type Skin = 'light' | 'medium' | 'deep'
type Hair = 'short' | 'wave' | 'fringe'
type Outfit = 'orange' | 'sage' | 'violet'
type Appearance = { skin: Skin; hair: Hair; outfit: Outfit }

const defaultAppearance: Appearance = { skin: 'medium', hair: 'wave', outfit: 'orange' }
const skinOptions: { value: Skin; label: string; color: string }[] = [
  { value: 'light', label: '밝은 피부', color: '#f4c59d' },
  { value: 'medium', label: '중간 피부', color: '#c88a5b' },
  { value: 'deep', label: '짙은 피부', color: '#83513d' },
]
const hairOptions: { value: Hair; label: string }[] = [
  { value: 'short', label: '짧은 머리' },
  { value: 'wave', label: '웨이브 머리' },
  { value: 'fringe', label: '앞머리' },
]
const outfitOptions: { value: Outfit; label: string; color: string }[] = [
  { value: 'orange', label: '오렌지 옷', color: '#e45330' },
  { value: 'sage', label: '세이지 옷', color: '#618a79' },
  { value: 'violet', label: '바이올렛 옷', color: '#7d6c9b' },
]
const moodLabel: Record<FaithMood, string> = {
  peaceful: '평안한', grateful: '감사하는', tired: '지친', anxious: '불안한', lonely: '외로운',
}
const weatherLabel: Record<FaithWeather, string> = {
  sunny: '맑은', partly_cloudy: '구름 조금인', cloudy: '흐린', rainy: '비 오는',
}

function isAppearance(value: unknown): value is Appearance {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return skinOptions.some(({ value: skin }) => skin === item.skin)
    && hairOptions.some(({ value: hair }) => hair === item.hair)
    && outfitOptions.some(({ value: outfit }) => outfit === item.outfit)
}

export function FaithAvatar({
  mood,
  weather,
  storageScope,
}: {
  mood: FaithMood | null
  weather: FaithWeather | null
  storageScope: string
}) {
  const [appearance, setAppearance] = useState<Appearance>(defaultAppearance)
  const [customizing, setCustomizing] = useState(false)
  const storageKey = `unblind-faith-avatar:${storageScope}`

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(storageKey)
        if (!raw) return
        const parsed: unknown = JSON.parse(raw)
        if (isAppearance(parsed)) setAppearance(parsed)
      } catch {
        // Private browsing can disable storage; the preview still works.
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [storageKey])

  function updateAppearance(next: Appearance) {
    setAppearance(next)
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      // Keep the current preview even when local storage is unavailable.
    }
  }

  const avatarStyle = {
    '--avatar-skin': skinOptions.find(({ value }) => value === appearance.skin)?.color,
    '--avatar-outfit': outfitOptions.find(({ value }) => value === appearance.outfit)?.color,
  } as CSSProperties
  const description = `${weather ? weatherLabel[weather] : '오늘의'} 배경 속 ${mood ? moodLabel[mood] : '나를 기다리는'} 아바타`

  return (
    <div className={styles.studio}>
      <div
        className={styles.scene}
        data-weather={weather ?? 'unset'}
        data-mood={mood ?? 'unset'}
        data-hair={appearance.hair}
        role="img"
        aria-label={description}
        style={avatarStyle}
      >
        <span className={styles.glow} aria-hidden />
        <span className={styles.orbit} aria-hidden />
        <span className={styles.weatherMark} aria-hidden />
        <span className={styles.floor} aria-hidden />
        <span className={styles.character} aria-hidden>
          <span className={styles.body} />
          <span className={styles.neck} />
          <span className={styles.face}>
            <span className={styles.hair} />
            <span className={styles.eyeLeft} />
            <span className={styles.eyeRight} />
            <span className={styles.mouth} />
          </span>
        </span>
      </div>
      <div className={styles.caption}>
        <span className={styles.captionText}>오늘의 나를 닮은 캐릭터</span>
        <button
          type="button"
          aria-expanded={customizing}
          aria-controls="faith-avatar-customizer"
          onClick={() => setCustomizing((value) => !value)}
          className={styles.customizeButton}
        >
          {customizing ? '꾸미기 닫기' : '캐릭터 꾸미기'}
        </button>
      </div>
      {customizing && (
        <div id="faith-avatar-customizer" className={styles.customizer}>
          <fieldset className={styles.fieldset}>
            <legend>피부색</legend>
            <div className={styles.choiceRow}>
              {skinOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-label={option.label}
                  aria-pressed={appearance.skin === option.value}
                  onClick={() => updateAppearance({ ...appearance, skin: option.value })}
                  className={styles.swatch}
                  style={{ backgroundColor: option.color }}
                />
              ))}
            </div>
          </fieldset>
          <fieldset className={styles.fieldset}>
            <legend>헤어</legend>
            <div className={styles.choiceRow}>
              {hairOptions.map((option) => (
                <button key={option.value} type="button" aria-pressed={appearance.hair === option.value} onClick={() => updateAppearance({ ...appearance, hair: option.value })} className={styles.textChoice}>{option.label}</button>
              ))}
            </div>
          </fieldset>
          <fieldset className={styles.fieldset}>
            <legend>옷 색</legend>
            <div className={styles.choiceRow}>
              {outfitOptions.map((option) => (
                <button key={option.value} type="button" aria-label={option.label} aria-pressed={appearance.outfit === option.value} onClick={() => updateAppearance({ ...appearance, outfit: option.value })} className={styles.swatch} style={{ backgroundColor: option.color }} />
              ))}
            </div>
          </fieldset>
          <p className={styles.storageNote}>꾸민 모습은 이 기기에만 저장돼요.</p>
        </div>
      )}
    </div>
  )
}
