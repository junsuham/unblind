'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import type { FaithMood } from '@/lib/dailyFaith'
import { defaultPixelAvatar, readPixelAvatar, type PixelAvatarAppearance } from '@/lib/pixelAvatar'
import { PixelAvatarCanvas } from '@/app/components/PixelAvatarCanvas'
import styles from './PrayerRoomScene.module.css'

type Position = { x: number; y: number }
const START: Position = { x: 50, y: 65 }

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function PrayerRoomScene({
  storageScope,
  characterName,
  mood = null,
}: {
  storageScope: string
  characterName: string
  mood?: FaithMood | null
}) {
  const [appearance, setAppearance] = useState<PixelAvatarAppearance>(defaultPixelAvatar)
  const [position, setPosition] = useState<Position>(START)

  useEffect(() => {
    const sync = () => setAppearance(readPixelAvatar(storageScope))
    const timer = window.setTimeout(sync, 0)
    const onUpdated = (event: Event) => {
      if ((event as CustomEvent<string>).detail === storageScope) sync()
    }
    window.addEventListener('unblind:pixel-avatar-updated', onUpdated)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('unblind:pixel-avatar-updated', onUpdated)
    }
  }, [storageScope])

  function moveTo(event: MouseEvent<HTMLButtonElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    setPosition({
      x: clamp(((event.clientX - bounds.left) / bounds.width) * 100, 17, 83),
      y: clamp(((event.clientY - bounds.top) / bounds.height) * 100, 48, 76),
    })
  }

  function moveBy(dx: number, dy: number) {
    setPosition((current) => ({
      x: clamp(current.x + dx, 17, 83),
      y: clamp(current.y + dy, 48, 76),
    }))
  }

  return (
    <section className={styles.container} aria-label="2D 기도실">
      <div className={styles.room}>
        <Image
          src="/prayer/prayer-room-original.png"
          alt="기도실의 창과 의자, 성경이 보이는 오리지널 픽셀 아트 배경"
          fill
          sizes="(max-width: 600px) 100vw, 480px"
          className={styles.background}
          unoptimized
        />
        <button type="button" className={styles.walkArea} onClick={moveTo} aria-label="기도실에서 이동할 위치 선택" />
        <div className={styles.avatar} style={{ left: `${position.x}%`, top: `${position.y}%` }}>
          <PixelAvatarCanvas appearance={appearance} mood={mood} size={67} label={`${characterName}의 기도실 캐릭터`} />
          <span className={styles.nameTag}>{characterName}</span>
        </div>
        <span className={styles.roomName}>기도실</span>
      </div>
      <div className={styles.controls} aria-label="캐릭터 이동 조작">
        <span className={styles.hint}>방 안을 누르거나 방향키로 이동</span>
        <div className={styles.arrows}>
          <button type="button" onClick={() => moveBy(-8, 0)} aria-label="왼쪽으로 이동">←</button>
          <div>
            <button type="button" onClick={() => moveBy(0, -7)} aria-label="위로 이동">↑</button>
            <button type="button" onClick={() => moveBy(0, 7)} aria-label="아래로 이동">↓</button>
          </div>
          <button type="button" onClick={() => moveBy(8, 0)} aria-label="오른쪽으로 이동">→</button>
        </div>
      </div>
    </section>
  )
}
