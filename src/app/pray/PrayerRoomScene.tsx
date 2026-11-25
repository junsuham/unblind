'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { MouseEvent } from 'react'
import { FaithAvatarSprite } from '@/app/components/FaithAvatarSprite'
import { useFaithAvatar } from '@/app/components/useFaithAvatar'
import styles from './PrayerRoomScene.module.css'

type Position = { x: number; y: number }
const START: Position = { x: 50, y: 65 }

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function PrayerRoomScene({
  storageScope,
  characterName,
}: {
  storageScope: string
  characterName: string
}) {
  const { ready, avatar } = useFaithAvatar(storageScope, characterName)
  const [position, setPosition] = useState<Position>(START)

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
          src="/prayer/prayer-room-reference-v2.png"
          alt="창과 나무 의자, 십자가가 보이는 도트 그림 기도실"
          fill
          sizes="(max-width: 480px) 100vw, 480px"
          className={styles.background}
          loading="eager"
          unoptimized
        />
        <button type="button" className={styles.walkArea} onClick={moveTo} aria-label="기도실에서 이동할 위치 선택" />
        {ready && (
          <div className={styles.avatar} style={{ left: `${position.x}%`, top: `${position.y}%` }}>
            <FaithAvatarSprite avatar={avatar} name={characterName} size={72} className={styles.sprite} />
            <span className={styles.nameTag}>{characterName}</span>
          </div>
        )}
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
