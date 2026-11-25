'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { FaithMood, FaithWeather } from '@/lib/dailyFaith'
import {
  DEFAULT_PIXEL_SPRITE,
  PIXEL_AVATAR_ENDPOINT,
  isGeneratedPixelAvatar,
  pixelColorFields,
  prepareAvatarPhoto,
  writeGeneratedAvatar,
  type PixelColorField,
  type PixelHairStyle,
} from '@/lib/pixelAvatar'
import { FaithAvatarSprite } from './FaithAvatarSprite'
import { useFaithAvatar } from './useFaithAvatar'
import styles from './FaithAvatar.module.css'

const weatherNames: Record<FaithWeather, string> = {
  sunny: '맑음', partly_cloudy: '구름 조금', cloudy: '흐림', rainy: '비',
}

export function FaithAvatar({
  mood, weather, storageScope, characterName,
}: {
  mood: FaithMood | null
  weather: FaithWeather | null
  storageScope: string
  characterName: string
}) {
  const { ready, avatar } = useFaithAvatar(storageScope)
  const [customizing, setCustomizing] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [consent, setConsent] = useState(false)
  const [hairStyle, setHairStyle] = useState<PixelHairStyle>('')
  const [colors, setColors] = useState<Partial<Record<PixelColorField, string>>>({})
  const [action, setAction] = useState<'generate' | 'reset' | null>(null)
  const [notice, setNotice] = useState('')
  const generation = useRef<AbortController | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const busy = action !== null

  useEffect(() => {
    if (!customizing) return
    const controller = new AbortController()
    void fetch(PIXEL_AVATAR_ENDPOINT, { cache: 'no-store', signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        if (!controller.signal.aborted) setAvailable(result?.available === true)
      })
      .catch(() => {
        if (!controller.signal.aborted) setAvailable(false)
      })
    return () => controller.abort()
  }, [customizing])

  useEffect(() => () => generation.current?.abort(), [storageScope])

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file || !consent || !available || generation.current || busy || !ready) return
    const controller = new AbortController()
    generation.current = controller
    setAction('generate')
    setNotice('')
    try {
      const photo = await prepareAvatarPhoto(file)
      if (controller.signal.aborted) return
      const form = new FormData()
      form.set('photo', photo, 'portrait.jpg')
      form.set('consent', 'accepted')
      if (hairStyle) form.set('hairStyle', hairStyle)
      for (const [field, color] of Object.entries(colors)) {
        if (color) form.set(field, color)
      }
      const response = await fetch(PIXEL_AVATAR_ENDPOINT, {
        method: 'POST', body: form, signal: controller.signal,
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(typeof result?.error === 'string' ? result.error : '이미지를 만들지 못했어요. 잠시 후 다시 시도해주세요.')
      }
      if (!isGeneratedPixelAvatar(result)) throw new Error('생성된 이미지가 올바르지 않아요. 다시 시도해주세요.')
      if (controller.signal.aborted) return
      await writeGeneratedAvatar(storageScope, result).catch(() => {
        throw new Error('이미지를 기기에 저장하지 못했어요. 저장 공간을 확인해주세요.')
      })
      if (fileInput.current) fileInput.current.value = ''
      setFile(null)
      setConsent(false)
      setNotice('캐릭터와 배경을 만들었어요. 기도실에서도 같은 캐릭터가 보여요.')
    } catch (cause) {
      if (!controller.signal.aborted) setNotice(cause instanceof Error ? cause.message : '이미지를 만들지 못했어요.')
    } finally {
      if (generation.current === controller) {
        generation.current = null
        if (!controller.signal.aborted) setAction(null)
      }
    }
  }

  async function restoreDefault() {
    setAction('reset')
    try {
      await writeGeneratedAvatar(storageScope, null)
      setNotice('이 기기의 생성 이미지를 지우고 기본 캐릭터로 바꿨어요.')
    } catch {
      setNotice('이미지를 지우지 못했어요. 다시 시도해주세요.')
    } finally {
      setAction(null)
    }
  }

  async function downloadAvatar() {
    try {
      const sprite = new window.Image()
      sprite.src = avatar?.sprite ?? DEFAULT_PIXEL_SPRITE
      await sprite.decode()
      const output = document.createElement('canvas')
      output.width = output.height = 1080
      const context = output.getContext('2d')
      if (!context) throw new Error()
      context.fillStyle = '#fff'
      context.fillRect(0, 0, 1080, 1080)
      context.imageSmoothingEnabled = false
      const scale = (avatar ? 810 : 1080) / Math.max(sprite.naturalWidth, sprite.naturalHeight)
      const width = sprite.naturalWidth * scale
      const height = sprite.naturalHeight * scale
      context.drawImage(sprite, (1080 - width) / 2, (1080 - height) / 2, width, height)
      const link = document.createElement('a')
      link.href = output.toDataURL('image/png')
      link.download = `${characterName}-pixel-avatar.png`
      link.click()
      setNotice('캐릭터를 흰 배경의 PNG로 저장했어요.')
    } catch {
      setNotice('캐릭터 이미지를 저장하지 못했어요.')
    }
  }

  return (
    <div className={styles.studio}>
      <div className={styles.scene} data-weather={weather ?? 'unset'} data-mood={mood ?? 'unset'}>
        {avatar ? (
          <Image src={avatar.background} alt="" fill unoptimized className={styles.generatedBackground} />
        ) : (
          <>
            <span className={styles.sun} aria-hidden />
            <span className={styles.cloud} aria-hidden />
            <span className={styles.floor} aria-hidden />
          </>
        )}
        {ready && <FaithAvatarSprite avatar={avatar} name={characterName} size={228} className={styles.sprite} />}
        {!ready && <span className={styles.loadingSprite} role="status">캐릭터 불러오는 중…</span>}
        {weather && <span className={styles.weatherLabel}>{weatherNames[weather]}</span>}
      </div>
      <div className={styles.caption}>
        <strong className={styles.name}>{characterName}</strong>
        <button
          type="button"
          aria-expanded={customizing}
          aria-controls="faith-avatar-customizer"
          onClick={() => {
            if (!customizing) setAvailable(null)
            else {
              setFile(null)
              setConsent(false)
            }
            setCustomizing(!customizing)
          }}
          disabled={busy}
          className={styles.customizeButton}
        >
          {customizing ? '꾸미기 닫기' : '캐릭터 꾸미기'}
        </button>
      </div>
      {customizing && (
        <form id="faith-avatar-customizer" className={styles.customizer} onSubmit={(event) => void generate(event)} aria-busy={busy}>
          {available === null && <p role="status" className={styles.privacyNote}>사진 생성 서비스 확인 중…</p>}
          {available === false && <p role="status" className={styles.privacyNote}>사진 생성 서비스가 현재 연결되지 않았어요. 저장된 캐릭터는 계속 사용할 수 있어요.</p>}
          {available && (
            <>
              <label className={styles.fileLabel}>
                한 사람이 잘 보이는 사진
                <input ref={fileInput} type="file" accept="image/*" onChange={(event) => {
                  setFile(event.currentTarget.files?.[0] ?? null)
                  setConsent(false)
                  setNotice('')
                }} disabled={busy} />
              </label>
              <details className={styles.preferences}>
                <summary>헤어·색상 선택 (선택사항)</summary>
                <label className={styles.hairField}>헤어
                  <select value={hairStyle} onChange={(event) => setHairStyle(event.currentTarget.value as PixelHairStyle)} disabled={busy}>
                    <option value="">사진 그대로</option><option value="short">짧은 머리</option><option value="long">긴 머리</option><option value="up">묶은 머리</option>
                  </select>
                </label>
                <div className={styles.colorGrid}>
                  {pixelColorFields.map(([field, label, defaultColor]) => (
                    <div key={field} className={styles.colorField} data-overridden={Boolean(colors[field])}>
                      <label>
                        {label}
                        <input type="color" value={colors[field] ?? defaultColor} onChange={(event) => {
                          const color = event.currentTarget.value
                          setColors((current) => ({ ...current, [field]: color }))
                        }} aria-label={`${label} 색상`} disabled={busy} />
                      </label>
                      {colors[field] && <button type="button" onClick={() => setColors((current) => ({ ...current, [field]: undefined }))} aria-label={`${label} 색상 선택 해제`} disabled={busy}>해제</button>}
                    </div>
                  ))}
                </div>
                <p className={styles.privacyNote}>변경하지 않은 곳은 사진의 모습과 색을 바탕으로 만들어요.</p>
              </details>
              <label className={styles.consent}>
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.currentTarget.checked)} disabled={busy} />
                <span>사진을 도트 캐릭터와 배경 생성에 사용하도록 OpenAI에 보내는 데 동의합니다.</span>
              </label>
              <p className={styles.privacyNote}>본인이 사용 권한을 가진 사진만 올려주세요. 언블라인드는 원본 사진을 저장하지 않으며 결과물은 이 기기에만 보관합니다.</p>
              <button type="submit" className={styles.generateButton} disabled={!file || !consent || busy || !ready}>
                {action === 'generate' ? '캐릭터와 배경을 만드는 중…' : '사진으로 캐릭터 만들기'}
              </button>
              {action === 'generate' && <p role="status" className={styles.privacyNote}>완료될 때까지 이 화면을 열어주세요. 최대 몇 분이 걸릴 수 있어요.</p>}
            </>
          )}
          {notice && <p role="status" className={styles.notice}>{notice}</p>}
          <div className={styles.actions}>
            <button type="button" onClick={() => void downloadAvatar()} disabled={!ready || busy}>캐릭터 PNG 저장</button>
            {avatar && <button type="button" onClick={() => void restoreDefault()} disabled={busy}>기본으로 돌리기</button>}
          </div>
        </form>
      )}
    </div>
  )
}
