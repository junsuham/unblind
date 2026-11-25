'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { FaithMood, FaithWeather } from '@/lib/dailyFaith'
import {
  appearanceFromPhoto,
  defaultPixelAvatar,
  readPixelAvatar,
  savePixelAvatar,
  type PixelAvatarAppearance,
} from '@/lib/pixelAvatar'
import { drawPixelAvatar, PixelAvatarCanvas } from './PixelAvatarCanvas'
import styles from './FaithAvatar.module.css'

const weatherNames: Record<FaithWeather, string> = {
  sunny: '맑음', partly_cloudy: '구름 조금', cloudy: '흐림', rainy: '비',
}

const hairStyles: Array<[PixelAvatarAppearance['hairStyle'], string]> = [
  ['short', '짧은 머리'], ['long', '긴 머리'], ['up', '묶은 머리'],
]

const colorFields: Array<[keyof Pick<PixelAvatarAppearance, 'skin' | 'hair' | 'eyes' | 'top' | 'bottom' | 'shoes'>, string]> = [
  ['skin', '피부'], ['hair', '머리'], ['eyes', '눈'], ['top', '상의'], ['bottom', '하의'], ['shoes', '신발'],
]

export function FaithAvatar({
  mood,
  weather,
  storageScope,
  characterName,
}: {
  mood: FaithMood | null
  weather: FaithWeather | null
  storageScope: string
  characterName: string
}) {
  const [appearance, setAppearance] = useState<PixelAvatarAppearance>(defaultPixelAvatar)
  const [customizing, setCustomizing] = useState(false)
  const [readingPhoto, setReadingPhoto] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setAppearance(readPixelAvatar(storageScope)), 0)
    return () => window.clearTimeout(timer)
  }, [storageScope])

  function updateAppearance(next: PixelAvatarAppearance) {
    setAppearance(next)
    savePixelAvatar(storageScope, next)
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setReadingPhoto(true)
    setNotice('')
    try {
      const next = await appearanceFromPhoto(file, appearance)
      updateAppearance(next)
      setNotice('사진의 색감을 가져왔어요. 머리와 의상은 아래에서 조정할 수 있어요.')
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : '사진을 읽지 못했습니다.')
    } finally {
      setReadingPhoto(false)
      event.target.value = ''
    }
  }

  function downloadAvatar() {
    const sprite = document.createElement('canvas')
    sprite.width = 56
    sprite.height = 64
    const spriteContext = sprite.getContext('2d')
    if (!spriteContext) return
    drawPixelAvatar(spriteContext, appearance, mood)

    const output = document.createElement('canvas')
    output.width = 1080
    output.height = 1080
    const context = output.getContext('2d')
    if (!context) return
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, 1080, 1080)
    context.imageSmoothingEnabled = false
    const scale = 13
    const width = sprite.width * scale
    const height = sprite.height * scale
    context.drawImage(sprite, Math.round((1080 - width) / 2), Math.round((1080 - height) / 2), width, height)

    const link = document.createElement('a')
    link.href = output.toDataURL('image/png')
    link.download = `${characterName}-pixel-avatar.png`
    link.click()
    setNotice('흰 배경의 1080×1080 PNG로 저장했어요.')
  }

  return (
    <div className={styles.studio}>
      <div className={styles.scene} data-weather={weather ?? 'unset'}>
        <span className={styles.sun} aria-hidden />
        <span className={styles.cloud} aria-hidden />
        <span className={styles.floor} aria-hidden />
        <div className={styles.spriteWrap}>
          <PixelAvatarCanvas appearance={appearance} mood={mood} size={136} label={`${characterName}의 2D 픽셀 캐릭터`} />
        </div>
        <span className={styles.weatherLabel}>{weather ? weatherNames[weather] : '오늘의 나'}</span>
      </div>
      <div className={styles.caption}>
        <div className={styles.captionText}>
          <strong>{characterName}</strong>
          <span>나의 2D 캐릭터</span>
        </div>
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
          <label className={styles.photoButton}>
            {readingPhoto ? '사진 분석 중…' : '내 사진에서 색상 가져오기'}
            <input type="file" accept="image/*" onChange={(event) => void handlePhoto(event)} disabled={readingPhoto} />
          </label>
          <p className={styles.privacyNote}>사진은 이 기기에서만 분석하며 업로드·저장하지 않아요. 피부·머리·옷 색과 머리 길이를 추정하므로 결과를 아래에서 수정할 수 있어요.</p>
          {notice && <p role="status" className={styles.notice}>{notice}</p>}

          <fieldset className={styles.fieldset}>
            <legend>헤어</legend>
            <div className={styles.choices}>
              {hairStyles.map(([value, label]) => (
                <button key={value} type="button" aria-pressed={appearance.hairStyle === value} onClick={() => updateAppearance({ ...appearance, hairStyle: value })}>{label}</button>
              ))}
            </div>
          </fieldset>

          <div className={styles.colorGrid}>
            {colorFields.map(([field, label]) => (
              <label key={field} className={styles.colorField}>
                <span>{label}</span>
                <input type="color" value={appearance[field]} onChange={(event) => updateAppearance({ ...appearance, [field]: event.target.value })} aria-label={`${label} 색상`} />
              </label>
            ))}
          </div>

          <div className={styles.equipmentGrid}>
            <label>모자
              <select value={appearance.hat} onChange={(event) => updateAppearance({ ...appearance, hat: event.target.value as PixelAvatarAppearance['hat'] })}>
                <option value="none">없음</option><option value="cap">캡</option><option value="beanie">비니</option>
              </select>
            </label>
            <label>얼굴 장식
              <select value={appearance.faceAccessory} onChange={(event) => updateAppearance({ ...appearance, faceAccessory: event.target.value as PixelAvatarAppearance['faceAccessory'] })}>
                <option value="none">없음</option><option value="glasses">안경</option>
              </select>
            </label>
            <label>망토·스카프
              <select value={appearance.cape} onChange={(event) => updateAppearance({ ...appearance, cape: event.target.value as PixelAvatarAppearance['cape'] })}>
                <option value="none">없음</option><option value="scarf">스카프</option>
              </select>
            </label>
            <label>손 소품
              <select value={appearance.prop} onChange={(event) => updateAppearance({ ...appearance, prop: event.target.value as PixelAvatarAppearance['prop'] })}>
                <option value="none">없음</option><option value="book">책</option>
              </select>
            </label>
          </div>
          <details className={styles.example}>
            <summary>2D 캐릭터 스타일 예시</summary>
            <Image src="/avatars/faith-player-original-white.png" width={128} height={128} alt="오렌지 상의를 입은 오리지널 2D 픽셀 캐릭터 예시" unoptimized />
          </details>
          <button type="button" onClick={downloadAvatar} className={styles.exportButton}>1080×1080 캐릭터 이미지 저장</button>
          <p className={styles.storageNote}>설정은 이 기기에만 저장되며 기도실에서도 같은 모습으로 보여요.</p>
        </div>
      )}
    </div>
  )
}
