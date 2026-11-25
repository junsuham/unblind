'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { FaithAvatarSprite } from '@/app/components/FaithAvatarSprite'
import { PrayerRoomChat, usePrayerRoomLive } from '@/app/components/PrayerRoomLive'
import { useFaithAvatar } from '@/app/components/useFaithAvatar'
import { bibleAvatarPresets, suggestedBibleAvatar } from '@/lib/pixelAvatar'
import {
  prayerCameraY, prayerLadders, prayerPlatforms, prayerSummitLevel,
  prayerWorldHeight, prayerWorldWidth, startPrayerAscent, stepPrayerAscent,
  type PrayerMove,
} from '@/lib/prayerParkour'
import styles from './PrayerRoomScene.module.css'

const arrows = [
  { move: 'up', glyph: '▲', label: '위로 이동' },
  { move: 'left', glyph: '◀', label: '왼쪽으로 이동' },
  { move: 'down', glyph: '▼', label: '아래로 이동' },
  { move: 'right', glyph: '▶', label: '오른쪽으로 이동' },
] as const
const keyboardMoves: Readonly<Record<string, PrayerMove | undefined>> = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', Space: 'jump',
}
const avatars = new Map(bibleAvatarPresets.map((item) => [item.id, item]))

export function PrayerRoomScene({
  storageScope, characterName,
}: {
  storageScope: string
  characterName: string
}) {
  const { ready, avatar } = useFaithAvatar(storageScope, characterName)
  const live = usePrayerRoomLive()
  const { updatePosition } = live
  const [bestLevel, setBestLevel] = useState(0)
  const [inChapel, setInChapel] = useState(false)
  const [praying, setPraying] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const spriteRef = useRef<HTMLDivElement>(null)
  const chapelClose = useRef<HTMLButtonElement>(null)
  const player = useRef(startPrayerAscent())
  const best = useRef(0)
  const keys = useRef(new Map<string, PrayerMove>())
  const queuedJump = useRef(false)
  const timers = useRef(new Set<number>())

  useEffect(() => {
    if (inChapel) chapelClose.current?.focus({ preventScroll: true })
  }, [inChapel])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const inputs = keys.current
    const pendingTimers = timers.current
    let scale = 1
    let height = 400
    let camera = prayerCameraY(player.current.y, height)
    let frame = 0
    let previous = 0
    let lastSent = 0

    function resize() {
      if (!viewport) return
      scale = (viewport.clientWidth || prayerWorldWidth) / prayerWorldWidth
      height = (viewport.clientHeight || 400) / scale
      camera = prayerCameraY(player.current.y, height)
      viewport.style.setProperty('--room-scale', String(scale))
      viewport.style.setProperty('--room-pan', `${-camera * scale}px`)
    }

    function render(now: number) {
      if (!viewport) return
      if (document.visibilityState === 'hidden') {
        previous = 0
        frame = window.requestAnimationFrame(render)
        return
      }
      const dt = previous === 0 ? 1 / 60 : (now - previous) / 1000
      previous = now
      const movement = new Set(inputs.values())
      if (!inChapel) {
        const jump = queuedJump.current
        queuedJump.current = false
        if (movement.size || jump || player.current.platform === null) {
          player.current = stepPrayerAscent(player.current, movement, jump, dt)
        }
      }
      const { x, y, facing, platform, climbing } = player.current
      const idealCamera = prayerCameraY(y, height)
      if (Math.abs(camera - idealCamera) > .3) {
        camera += (idealCamera - camera) * Math.min(1, dt * 12)
        viewport.style.setProperty('--room-pan', `${-camera * scale}px`)
      }
      const sprite = spriteRef.current
      if (sprite) {
        sprite.style.left = `${x}px`
        sprite.style.top = `${y}px`
        sprite.dataset.facing = facing
        sprite.dataset.moving = String(climbing || platform === null || movement.has('left') || movement.has('right'))
      }
      if (platform !== null && platform > best.current) {
        best.current = platform
        setBestLevel(platform)
      }
      if (ready && now - lastSent > 250) {
        lastSent = now
        updatePosition({ x, y, facing, avatarId: avatar.id })
      }
      frame = window.requestAnimationFrame(render)
    }

    function release() {
      inputs.clear()
      queuedJump.current = false
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(viewport)
    window.addEventListener('blur', release)
    document.addEventListener('visibilitychange', release)
    frame = window.requestAnimationFrame(render)
    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(frame)
      window.removeEventListener('blur', release)
      document.removeEventListener('visibilitychange', release)
      for (const timer of pendingTimers) window.clearTimeout(timer)
      pendingTimers.clear()
      release()
    }
  }, [avatar.id, inChapel, ready, updatePosition])

  function beginMove(id: string, move: PrayerMove) {
    if (inChapel) return
    if (move === 'jump' && !keys.current.has(id)) queuedJump.current = true
    keys.current.set(id, move)
  }

  function keyboardDown(event: KeyboardEvent<HTMLDivElement>) {
    const move = keyboardMoves[event.code]
    if (!move || event.metaKey || event.ctrlKey || event.altKey || inChapel) return
    if (move === 'jump' && (event.target as HTMLElement).tagName === 'BUTTON') return
    event.preventDefault()
    beginMove(`key:${event.code}`, move)
  }

  function keyboardUp(event: KeyboardEvent<HTMLDivElement>) {
    keys.current.delete(`key:${event.code}`)
  }

  function buttonControls(move: PrayerMove) {
    function end(event: PointerEvent<HTMLButtonElement>) {
      keys.current.delete(`pointer:${event.pointerId}`)
    }
    return {
      onPointerDown(event: PointerEvent<HTMLButtonElement>) {
        if (event.pointerType === 'mouse' && event.button !== 0) return
        event.currentTarget.setPointerCapture(event.pointerId)
        beginMove(`pointer:${event.pointerId}`, move)
      },
      onPointerUp: end,
      onPointerCancel: end,
      onLostPointerCapture: end,
      onClick(event: { detail: number }) {
        if (event.detail !== 0) return
        const id = `button:${move}`
        beginMove(id, move)
        const timer = window.setTimeout(() => {
          timers.current.delete(timer)
          keys.current.delete(id)
        }, 175)
        timers.current.add(timer)
      },
    }
  }

  function resetAscent() {
    player.current = startPrayerAscent()
    keys.current.clear()
    best.current = 0
    setBestLevel(0)
  }

  const initialPlayer = startPrayerAscent()

  return (
    <div className={styles.experience}>
      <section className={styles.container} aria-label="골고다 언덕과 예배당">
        <div
          className={styles.game}
          onKeyDown={keyboardDown}
          onKeyUp={keyboardUp}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              // iOS may not give a tapped button focus. Release only keyboard
              // input here; captured touches release on pointerup/cancel.
              for (const id of keys.current.keys()) if (id.startsWith('key:')) keys.current.delete(id)
            }
          }}
        >
          <div
            ref={viewportRef}
            className={styles.viewport}
            role="group"
            aria-label="골고다 언덕 오르기"
            aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Space"
            aria-describedby={helpOpen ? 'prayer-motion-help' : undefined}
            tabIndex={inChapel ? -1 : 0}
            data-level={bestLevel}
          >
            <div className={styles.world} style={{ width: prayerWorldWidth, height: prayerWorldHeight }} inert={inChapel}>
              <div className={styles.landscape} aria-hidden="true" />
              <div className={styles.summitChapel} style={{ left: 257, top: prayerPlatforms[prayerSummitLevel].y - 60 }} aria-hidden="true">
                <div className={styles.chapelRoof} />
                <div className={styles.chapelCross} />
                <div className={styles.chapelDoor} />
              </div>
              {prayerLadders.map(({ x, top, bottom }) => (
                <div
                  key={top}
                  className={styles.ladder}
                  style={{ left: x, top: prayerPlatforms[top].y - 4, height: prayerPlatforms[bottom].y - prayerPlatforms[top].y + 6 }}
                  aria-hidden="true"
                />
              ))}
              {prayerPlatforms.map(({ x, y, width }, level) => (
                <div
                  key={level}
                  className={styles.ledge}
                  data-ground={level === 0 || undefined}
                  data-summit={level === prayerSummitLevel || undefined}
                  style={{ left: x, top: y, width }}
                  aria-hidden="true"
                />
              ))}
              {!inChapel && live.peers.map((peer) => (
                <div
                  key={peer.id}
                  className={`${styles.player} ${styles.peer}`}
                  style={{ left: peer.x, top: peer.y }}
                  data-facing={peer.facing}
                  title={peer.nickname}
                >
                  <span className={styles.nameTag}>{peer.nickname}</span>
                  <FaithAvatarSprite avatar={avatars.get(peer.avatarId) ?? suggestedBibleAvatar(peer.nickname)} name={peer.nickname} size={60} className={styles.sprite} />
                </div>
              ))}
              {ready && (
                <div ref={spriteRef} className={styles.player} style={{ left: initialPlayer.x, top: initialPlayer.y }}>
                  <span className={styles.nameTag}>{characterName}</span>
                  <FaithAvatarSprite avatar={avatar} name={characterName} size={67} className={styles.sprite} />
                </div>
              )}
            </div>
            {inChapel ? (
              <div className={styles.chapelView}>
                <Image
                  src="/prayer/prayer-room-reference-v2.png"
                  alt=""
                  fill
                  sizes="(max-width: 480px) calc(100vw - 32px), 430px"
                  unoptimized
                  className={styles.chapelBackground}
                />
                <span className={styles.hudTitle}>기도하는 예배당</span>
                <button type="button" ref={chapelClose} className={styles.backToHill} onClick={() => { setInChapel(false); setPraying(false); viewportRef.current?.focus({ preventScroll: true }) }}>
                  언덕으로 돌아가기
                </button>
                <div className={styles.chapelAvatar} data-praying={praying}>
                  <span className={styles.nameTag}>{characterName}</span>
                  <FaithAvatarSprite avatar={avatar} name={characterName} size={96} className={styles.sprite} />
                </div>
                <button type="button" className={styles.chapelAction} aria-pressed={praying} onClick={() => setPraying((value) => !value)}>
                  <span aria-hidden="true">🙏 </span>{praying ? '묵상 마치기' : '조용히 기도하기'}
                </button>
              </div>
            ) : (
              <div className={styles.hud}>
                <span className={styles.hudTitle}><span aria-hidden="true">🍁 </span>골고다 언덕</span>
                <span className={styles.steps} aria-label={`제일 높이 도달한 단계 ${bestLevel} / ${prayerSummitLevel}`}>{bestLevel} / {prayerSummitLevel}</span>
                {bestLevel === prayerSummitLevel && (
                  <button type="button" className={styles.summitButton} onClick={() => setInChapel(true)}>예배당 입장</button>
                )}
              </div>
            )}
          </div>
          {!inChapel && (
            <div className={styles.controls}>
              <div className={styles.pad} role="group" aria-label="캐릭터 이동">
                {arrows.map(({ move, glyph, label }) => (
                  <button type="button" key={move} data-move={move} aria-label={label} {...buttonControls(move)}>{glyph}</button>
                ))}
                <span className={styles.padCenter} aria-hidden="true" />
              </div>
              <div className={styles.controlCenter}>
                <button type="button" className={styles.iconButton} aria-label="조작법" aria-expanded={helpOpen} aria-controls={helpOpen ? 'prayer-motion-help' : undefined} onClick={() => setHelpOpen((value) => !value)}>?</button>
                <button type="button" className={styles.iconButton} aria-label="언덕 시작점으로" onClick={resetAscent}>↺</button>
              </div>
              <button type="button" className={styles.jump} aria-label="점프" {...buttonControls('jump')}>
                <span aria-hidden="true">↑</span>점프
              </button>
            </div>
          )}
        </div>
        {helpOpen && !inChapel && (
          <p id="prayer-motion-help" className={styles.hint}>
            왼쪽·오른쪽으로 움직이고 점프로 다음 발판에 올라요. 사다리에서는 위·아래로 이동할 수 있어요.
            키보드는 방향키와 스페이스바를 사용하세요.
          </p>
        )}
        {!inChapel && (
          <div className={styles.chapelShortcut}>
            <span>{bestLevel === prayerSummitLevel ? '정상에 도착했어요.' : '오르지 않고도 기도할 수 있어요.'}</span>
            <button type="button" onClick={() => setInChapel(true)}>예배당 바로 가기</button>
          </div>
        )}
      </section>
      <PrayerRoomChat live={live} />
    </div>
  )
}
