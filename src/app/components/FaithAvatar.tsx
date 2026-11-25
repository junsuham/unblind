'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { FaithMood, FaithWeather } from '@/lib/dailyFaith'
import {
  DEFAULT_PIXEL_SPRITE,
  prepareImportedAvatar,
  writeGeneratedAvatar,
} from '@/lib/pixelAvatar'
import { FaithAvatarSprite } from './FaithAvatarSprite'
import { useFaithAvatar } from './useFaithAvatar'
import styles from './FaithAvatar.module.css'

const weatherNames: Record<FaithWeather, string> = {
  sunny: '맑음', partly_cloudy: '구름 조금', cloudy: '흐림', rainy: '비',
}

const prompts = [
  ['캐릭터 요청문', '첨부한 인물 사진을 참고해 전신이 보이는 2D 횡스크롤 RPG 도트 캐릭터 한 명을 만들어줘. 헤어와 의상 특징을 살리고, 큰 머리와 작은 몸, 선명한 픽셀 윤곽으로 그려줘. 배경은 실제로 투명하게 만들고, 그림자·글자·다른 인물 없이 캐릭터만 PNG 한 장으로 만들어줘.'],
  ['배경 요청문', '앞 사진의 색감과 분위기를 참고해 2D 횡스크롤 RPG용 가로 도트 배경을 별도 이미지 한 장으로 만들어줘. 가운데 아래에는 캐릭터를 놓을 자리와 바닥을 남기고, 사람·캐릭터·글자는 넣지 마.'],
] as const

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
  const [spriteFile, setSpriteFile] = useState<File | null>(null)
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null)
  const [action, setAction] = useState<'import' | 'reset' | null>(null)
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null)
  const spriteInput = useRef<HTMLInputElement>(null)
  const backgroundInput = useRef<HTMLInputElement>(null)
  const working = useRef(false)
  const busy = action !== null

  async function importAvatar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!spriteFile || !backgroundFile || working.current || !ready) return
    working.current = true
    setAction('import')
    setNotice(null)
    try {
      const result = await prepareImportedAvatar(spriteFile, backgroundFile)
      await writeGeneratedAvatar(storageScope, result).catch(() => {
        throw new Error('이미지를 이 기기에 저장하지 못했어요. 저장 공간을 확인해주세요.')
      })
      if (spriteInput.current) spriteInput.current.value = ''
      if (backgroundInput.current) backgroundInput.current.value = ''
      setSpriteFile(null)
      setBackgroundFile(null)
      setNotice({ text: '적용했어요. 기도실에도 같은 캐릭터가 보여요.' })
    } catch (cause) {
      setNotice({ text: cause instanceof Error ? cause.message : '이미지를 가져오지 못했어요. 다시 시도해주세요.', error: true })
    } finally {
      working.current = false
      setAction(null)
    }
  }

  async function restoreDefault() {
    if (working.current) return
    working.current = true
    setAction('reset')
    setNotice(null)
    try {
      await writeGeneratedAvatar(storageScope, null)
      setNotice({ text: '이 기기에 저장한 캐릭터와 배경을 지우고 기본으로 돌렸어요.' })
    } catch {
      setNotice({ text: '이미지를 지우지 못했어요. 다시 시도해주세요.', error: true })
    } finally {
      working.current = false
      setAction(null)
    }
  }

  async function copyPrompt(label: string, prompt: string) {
    try {
      await navigator.clipboard.writeText(prompt)
      setNotice({ text: `${label}을 복사했어요.` })
    } catch {
      setNotice({ text: '자동 복사가 되지 않았어요. 요청문을 길게 눌러 복사해주세요.', error: true })
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
      context.imageSmoothingEnabled = false
      const scale = (avatar ? 810 : 1080) / Math.max(sprite.naturalWidth, sprite.naturalHeight)
      const width = sprite.naturalWidth * scale
      const height = sprite.naturalHeight * scale
      context.drawImage(sprite, (1080 - width) / 2, (1080 - height) / 2, width, height)
      const link = document.createElement('a')
      link.href = output.toDataURL('image/png')
      link.download = `${characterName}-pixel-avatar.png`
      link.click()
      setNotice({ text: '투명 배경 PNG 다운로드를 시작했어요.' })
    } catch {
      setNotice({ text: '캐릭터 이미지를 저장하지 못했어요.', error: true })
    }
  }

  return (
    <div className={styles.studio}>
      <div className={styles.scene} data-weather={weather ?? 'unset'} data-mood={mood ?? 'unset'}>
        {avatar ? (
          <Image src={avatar.background} alt="" fill unoptimized className={styles.customBackground} />
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
            if (customizing) {
              setSpriteFile(null)
              setBackgroundFile(null)
              setNotice(null)
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
        <form id="faith-avatar-customizer" className={styles.customizer} onSubmit={(event) => void importAvatar(event)} aria-busy={busy}>
          <div className={styles.guide}>
            <a className={styles.chatLink} href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">ChatGPT 열기 <span aria-hidden>↗</span></a>
            <p className={styles.helpText}>새 채팅에서 <strong>임시 채팅</strong>을 켜고, 투명 캐릭터와 가로 배경을 각각 만드세요. 화면을 캡처하지 말고 이미지 파일을 저장하세요.</p>
            <details className={styles.prompts}>
              <summary>이미지 만들기 요청문</summary>
              {prompts.map(([label, prompt]) => (
                <div key={label} className={styles.prompt}>
                  <p>{prompt}</p>
                  <button type="button" onClick={() => void copyPrompt(label, prompt)}>{label} 복사</button>
                </div>
              ))}
            </details>
          </div>
          <label className={styles.fileLabel}>
            <span>1. 투명 도트 캐릭터 <small>PNG · WebP</small></span>
            <input ref={spriteInput} type="file" accept="image/png,image/webp,.png,.webp" onChange={(event) => {
              setSpriteFile(event.currentTarget.files?.[0] ?? null)
              setNotice(null)
            }} disabled={busy} />
          </label>
          <label className={styles.fileLabel}>
            <span>2. 홈 배경 <small>PNG · JPG · WebP</small></span>
            <input ref={backgroundInput} type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" onChange={(event) => {
              setBackgroundFile(event.currentTarget.files?.[0] ?? null)
              setNotice(null)
            }} disabled={busy} />
          </label>
          <p className={styles.helpText}>파일당 최대 12MB. 이미지는 서버로 보내지 않고 현재 브라우저 또는 설치 앱에만 저장합니다.</p>
          <button type="submit" className={styles.importButton} disabled={!spriteFile || !backgroundFile || busy || !ready}>
            {action === 'import' ? '이미지 가져오는 중…' : '캐릭터와 배경 적용'}
          </button>
          {notice && <p role={notice.error ? 'alert' : 'status'} className={styles.notice} data-error={Boolean(notice.error)}>{notice.text}</p>}
          <div className={styles.actions}>
            <button type="button" onClick={() => void downloadAvatar()} disabled={!ready || busy}>캐릭터 PNG 저장</button>
            {avatar && <button type="button" onClick={() => void restoreDefault()} disabled={busy}>기본으로 돌리기</button>}
          </div>
        </form>
      )}
    </div>
  )
}
