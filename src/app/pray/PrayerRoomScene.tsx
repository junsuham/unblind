'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent, KeyboardEvent, MouseEvent, PointerEvent, TouchEvent } from 'react'
import { FaithAvatarSprite } from '@/app/components/FaithAvatarSprite'
import { PrayerRoomChat, usePrayerRoomLive } from '@/app/components/PrayerRoomLive'
import { useFaithAvatar } from '@/app/components/useFaithAvatar'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import { bibleAvatarPresets, suggestedBibleAvatar, type BibleAvatarPreset } from '@/lib/pixelAvatar'
import {
  prayerCameraY, prayerPlatforms, prayerSummitLevel,
  prayerWorldHeight, prayerWorldWidth, startPrayerAscent, stepPrayerAscent,
  type PrayerMove,
} from '@/lib/prayerParkour'
import { latestPrayerRoomBubbles, prayerRoomPoseSrc } from '@/lib/prayerRoomLive'
import styles from './PrayerRoomScene.module.css'

const arrows = [
  { move: 'up', glyph: '▲', label: '위로 뛰기' },
  { move: 'left', glyph: '◀', label: '왼쪽으로 이동' },
  { move: 'down', glyph: '▼', label: '기도 자세' },
  { move: 'right', glyph: '▶', label: '오른쪽으로 이동' },
] as const
const keyboardMoves: Readonly<Record<string, PrayerMove | undefined>> = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', Space: 'jump',
}
const avatars = new Map(bibleAvatarPresets.map((item) => [item.id, item]))

function bubbleEdge(x: number) {
  return x < 78 ? 'left' : x > prayerWorldWidth - 78 ? 'right' : undefined
}

function PrayerRoomAvatar({
  avatar, name, size, message, preloadPose = false,
}: {
  avatar: BibleAvatarPreset
  name: string
  size: number
  message?: string
  preloadPose?: boolean
}) {
  const [loadedPose, setLoadedPose] = useState<string | null>(null)
  const [failedPose, setFailedPose] = useState<string | null>(null)
  const kneeling = prayerRoomPoseSrc(avatar.id)
  const canLoad = Boolean(kneeling && failedPose !== kneeling)
  const hasPose = canLoad && loadedPose === kneeling
  return (
    <>
      <span className={styles.avatarArt} data-has-pose={hasPose || undefined}>
        <FaithAvatarSprite avatar={avatar} name={name} size={size} className={`${styles.sprite} ${styles.standingSprite}`} />
        {canLoad && kneeling && (
          <Image
            src={kneeling}
            alt={`${name}의 기도 자세`}
            className={`${styles.sprite} ${styles.kneelingSprite}`}
            width={size}
            height={size}
            unoptimized
            loading={preloadPose ? 'eager' : 'lazy'}
            onLoad={() => setLoadedPose(kneeling)}
            onError={() => setFailedPose(kneeling)}
          />
        )}
      </span>
      <span className={styles.nameTag} title={name}>{name}</span>
      {message && <span className={styles.speechBubble} aria-hidden="true"><span>{message}</span></span>}
    </>
  )
}

function JumpPictogram() {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28" width="31" height="31" fill="currentColor">
      <path d="M13 3h2l8 8-3 3-4-4v11h-4V10l-4 4-3-3zM6 23h16v2H6z" />
    </svg>
  )
}

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
  const [chapelPraying, setChapelPraying] = useState(false)
  const [messageTime, setMessageTime] = useState(0)
  const viewportRef = useRef<HTMLDivElement>(null)
  const spriteRef = useRef<HTMLDivElement>(null)
  const chapelClose = useRef<HTMLButtonElement>(null)
  const player = useRef(startPrayerAscent())
  const best = useRef(0)
  const keys = useRef(new Map<string, PrayerMove>())
  const queuedJump = useRef(false)
  const queuedPrayer = useRef(false)
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const timers = useRef(new Set<number>())
  const hasMessages = live.messages.length > 0
  const bubbles = useMemo(() => latestPrayerRoomBubbles(live.messages, messageTime), [live.messages, messageTime])

  useEffect(() => {
    if (inChapel) chapelClose.current?.focus({ preventScroll: true })
  }, [inChapel])

  useEffect(() => {
    if (!hasMessages) return
    const tick = () => setMessageTime(Date.now())
    const first = window.setTimeout(tick, 0)
    const interval = window.setInterval(tick, 500)
    return () => { window.clearTimeout(first); window.clearInterval(interval) }
  }, [hasMessages])

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
        if (queuedPrayer.current) movement.add('down')
        if (movement.size || jump || player.current.platform === null) {
          player.current = stepPrayerAscent(player.current, movement, jump, dt)
          if (player.current.platform !== null) queuedPrayer.current = false
        }
      }
      const { x, y, facing, platform, isPraying } = player.current
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
        sprite.dataset.moving = String(platform === null || movement.has('left') || movement.has('right'))
        sprite.dataset.praying = String(isPraying)
        sprite.dataset.bubbleEdge = bubbleEdge(x) ?? ''
      }
      if (platform !== null && platform > best.current) {
        best.current = platform
        setBestLevel(platform)
      }
      if (ready && now - lastSent > 250) {
        lastSent = now
        updatePosition({ x, y, facing, avatarId: avatar.id, isPraying: inChapel ? chapelPraying : isPraying })
      }
      frame = window.requestAnimationFrame(render)
    }

    function release() {
      inputs.clear()
      queuedJump.current = false
      queuedPrayer.current = false
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
  }, [avatar.id, chapelPraying, inChapel, ready, updatePosition])

  function beginMove(id: string, move: PrayerMove) {
    if (inChapel) return
    if (move === 'down') queuedPrayer.current = true
    else {
      queuedPrayer.current = false
      if ((move === 'jump' || move === 'up') && !keys.current.has(id)) queuedJump.current = true
    }
    keys.current.set(id, move)
  }

  function stageTouchStart(event: TouchEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    const touch = event.touches[0]
    swipeStart.current = !inChapel && event.touches.length === 1 && touch && !target.closest('button')
      ? { x: touch.clientX, y: touch.clientY } : null
  }

  function stageTouchMove(event: TouchEvent<HTMLDivElement>) {
    const start = swipeStart.current
    const touch = event.touches[0]
    if (!start || !touch || event.touches.length !== 1) return
    const down = start.y - touch.clientY
    if (down >= 22 && down > Math.abs(start.x - touch.clientX)) {
      queuedPrayer.current = true
      swipeStart.current = null
    }
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
      draggable: false,
      onDragStart(event: DragEvent<HTMLButtonElement>) { event.preventDefault() },
      onContextMenu(event: MouseEvent<HTMLButtonElement>) { event.preventDefault() },
      onPointerDown(event: PointerEvent<HTMLButtonElement>) {
        if (event.pointerType === 'mouse' && event.button !== 0) return
        if (event.pointerType !== 'mouse') event.preventDefault()
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
    queuedJump.current = false
    queuedPrayer.current = false
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
            tabIndex={inChapel ? -1 : 0}
            data-level={bestLevel}
            onWheel={(event) => { if (!inChapel && !event.ctrlKey && event.deltaY > 1) queuedPrayer.current = true }}
            onTouchStart={stageTouchStart}
            onTouchMove={stageTouchMove}
            onTouchEnd={() => { swipeStart.current = null }}
            onTouchCancel={() => { swipeStart.current = null }}
          >
            <div className={styles.world} style={{ width: prayerWorldWidth, height: prayerWorldHeight }} inert={inChapel}>
              <div className={styles.landscape} aria-hidden="true">
                <div className={styles.summitScenery} />
                <div className={styles.ridgeScenery} />
                <div className={styles.baseScenery} />
              </div>
              <div className={styles.summitChapel} style={{ left: 257, top: prayerPlatforms[prayerSummitLevel].y - 60 }} aria-hidden="true">
                <div className={styles.chapelRoof} />
                <div className={styles.chapelCross} />
                <div className={styles.chapelDoor} />
              </div>
              {prayerPlatforms.map(({ x, y, width }, level) => (
                <div key={level} className={styles.terrainPiece} aria-hidden="true" style={{ left: x, top: y, width }}>
                  {level > 0 && <div className={styles.pew} data-rest-level={level} />}
                  <div
                    className={styles.ledge}
                    data-ground={level === 0 || undefined}
                    data-summit={level === prayerSummitLevel || undefined}
                    data-checkpoint={level > 0 && level % 5 === 0 || undefined}
                  />
                </div>
              ))}
              {!inChapel && live.peers.map((peer) => (
                <div
                  key={peer.id}
                  className={`${styles.player} ${styles.peer}`}
                  style={{ left: peer.x, top: peer.y }}
                  data-facing={peer.facing}
                  data-praying={peer.isPraying === true}
                  data-bubble-edge={bubbleEdge(peer.x)}
                >
                  <PrayerRoomAvatar avatar={avatars.get(peer.avatarId) ?? suggestedBibleAvatar(peer.nickname)} name={peer.nickname} size={60} message={bubbles.get(peer.nickname)?.text} />
                </div>
              ))}
              {ready && (
                <div ref={spriteRef} className={styles.player} style={{ left: initialPlayer.x, top: initialPlayer.y }}>
                  <PrayerRoomAvatar avatar={avatar} name={characterName} size={67} message={bubbles.get(characterName)?.text} preloadPose />
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
                <button type="button" ref={chapelClose} className={styles.backToHill} onClick={() => { setInChapel(false); setChapelPraying(false); viewportRef.current?.focus({ preventScroll: true }) }}>
                  언덕으로 돌아가기
                </button>
                <div className={styles.chapelAvatar} data-praying={chapelPraying}>
                  <PrayerRoomAvatar avatar={avatar} name={characterName} size={96} message={bubbles.get(characterName)?.text} preloadPose />
                </div>
                <button type="button" className={styles.chapelAction} aria-pressed={chapelPraying} onClick={() => setChapelPraying((value) => !value)}>
                  <span aria-hidden="true">🙏 </span>{chapelPraying ? '묵상 마치기' : '조용히 기도하기'}
                </button>
              </div>
            ) : (
              <div className={styles.hud}>
                <span className={styles.hudTitle}>골고다 언덕</span>
                <span className={styles.steps} aria-label={`제일 높이 도달한 단계 ${bestLevel} / ${prayerSummitLevel}`}>
                  {bestLevel} / {prayerSummitLevel}
                  <span className={styles.progress} aria-hidden="true"><span style={{ inlineSize: `${bestLevel / prayerSummitLevel * 100}%` }} /></span>
                </span>
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
              <div className={styles.controlActions}>
                <button type="button" className={styles.iconButton} aria-label="언덕 시작점으로" onClick={resetAscent}>↺</button>
                <button
                  type="button"
                  className={styles.iconButton}
                  data-solo={!live.joined || undefined}
                  aria-label={live.joined ? '혼자 하기' : '함께 입장'}
                  title={live.joined ? '혼자 하기' : '함께 입장'}
                  onClick={live.joined ? live.leave : live.enter}
                >
                  <SystemIcon name={live.joined ? 'person' : 'people'} size={19} />
                </button>
                <button type="button" className={styles.jump} aria-label="점프" {...buttonControls('jump')}>
                  <JumpPictogram />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      {live.joined && <PrayerRoomChat live={live} />}
    </div>
  )
}
