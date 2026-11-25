'use client'

import { useEffect, useRef } from 'react'
import type { FaithMood } from '@/lib/dailyFaith'
import type { PixelAvatarAppearance } from '@/lib/pixelAvatar'

const WIDTH = 56
const HEIGHT = 64
const OUTLINE = '#241b19'

function shade(hex: string, amount: number) {
  const channels = [1, 3, 5].map((position) => parseInt(hex.slice(position, position + 2), 16))
  return `#${channels.map((value) => Math.max(0, Math.min(255, value + amount)).toString(16).padStart(2, '0')).join('')}`
}

export function drawPixelAvatar(
  context: CanvasRenderingContext2D,
  appearance: PixelAvatarAppearance,
  mood: FaithMood | null,
) {
  const block = (color: string, x: number, y: number, width: number, height: number) => {
    context.fillStyle = color
    context.fillRect(x, y, width, height)
  }
  const framed = (color: string, x: number, y: number, width: number, height: number) => {
    block(OUTLINE, x, y, width, height)
    block(color, x + 1, y + 1, width - 2, height - 2)
  }

  context.clearRect(0, 0, WIDTH, HEIGHT)
  context.imageSmoothingEnabled = false

  // Layer 1: cape/scarf. It stays behind the small body and face.
  if (appearance.cape === 'scarf') {
    framed(shade(appearance.top, -48), 10, 41, 36, 16)
    block(shade(appearance.top, -28), 14, 47, 28, 10)
  }

  // Layer 2: legs, bottom and shoes.
  framed(appearance.bottom, 18, 48, 12, 12)
  framed(shade(appearance.bottom, -12), 31, 48, 12, 12)
  block(shade(appearance.skin, -8), 21, 58, 6, 3)
  block(shade(appearance.skin, -8), 34, 58, 6, 3)
  framed(appearance.shoes, 16, 59, 14, 5)
  framed(appearance.shoes, 30, 59, 15, 5)
  block(shade(appearance.shoes, 45), 19, 62, 9, 1)
  block(shade(appearance.shoes, 45), 33, 62, 10, 1)

  // Layer 3: tiny top and arms.
  framed(appearance.top, 17, 40, 27, 13)
  framed(appearance.top, 12, 42, 7, 10)
  framed(shade(appearance.top, -12), 43, 42, 7, 10)
  block(appearance.skin, 13, 50, 5, 3)
  block(appearance.skin, 44, 50, 5, 3)
  block(shade(appearance.top, 44), 21, 42, 3, 8)
  block(shade(appearance.top, 44), 26, 42, 2, 9)
  block(shade(appearance.top, -28), 18, 50, 25, 2)

  // Layer 4: large head with no visible neck.
  framed(appearance.skin, 12, 16, 36, 25)
  block(OUTLINE, 15, 13, 30, 4)
  block(OUTLINE, 16, 40, 28, 2)
  block(appearance.skin, 15, 18, 30, 22)
  block(shade(appearance.skin, 19), 17, 20, 20, 8)
  block(shade(appearance.skin, -19), 42, 23, 3, 14)
  framed(appearance.skin, 10, 27, 5, 9)
  framed(appearance.skin, 46, 27, 5, 9)

  // Layer 5: face. Eyes sit low and remain visible in quarter view.
  framed('#fffaf2', 18, 29, 10, 8)
  framed('#fffaf2', 34, 29, 10, 8)
  block(appearance.eyes, 22, 31, 4, 5)
  block(appearance.eyes, 37, 31, 4, 5)
  block('#ffffff', 22, 31, 2, 2)
  block('#ffffff', 37, 31, 2, 2)
  block('#dc8e87', 15, 37, 4, 2)
  block('#dc8e87', 43, 37, 3, 2)
  if (mood === 'tired') {
    block(OUTLINE, 19, 33, 9, 1)
    block(OUTLINE, 35, 33, 8, 1)
  }
  block(mood === 'grateful' || mood === 'peaceful' ? '#a54e49' : '#8e625b', 29, 39, 3, 1)

  // Layer 6: voluminous hair, the visual identity of the sprite.
  const hair = appearance.hair
  const hairLight = shade(hair, 35)
  const hairShade = shade(hair, -30)
  if (appearance.hairStyle === 'long') {
    framed(hair, 8, 17, 9, 31)
    framed(hairShade, 44, 16, 10, 34)
    block(hairLight, 10, 22, 2, 14)
  }
  if (appearance.hairStyle === 'up') {
    framed(hairShade, 39, 1, 14, 19)
    block(hairLight, 43, 3, 5, 5)
  }
  block(OUTLINE, 11, 10, 39, 16)
  block(OUTLINE, 15, 6, 31, 7)
  block(OUTLINE, 20, 3, 22, 6)
  block(hair, 13, 12, 35, 12)
  block(hair, 17, 8, 27, 10)
  block(hair, 22, 5, 18, 7)
  block(hair, 11, 21, 7, 10)
  block(hairShade, 43, 18, 6, 11)
  block(hair, 18, 20, 7, 8)
  block(hair, 25, 18, 7, 7)
  block(hair, 39, 20, 7, 7)
  block(hairLight, 21, 8, 12, 2)
  block(hairLight, 17, 13, 7, 2)
  block(shade(hair, 18), 35, 10, 8, 2)

  // Layer 7: optional hat and face accessory.
  if (appearance.hat === 'cap') {
    framed(shade(appearance.top, -28), 16, 5, 31, 10)
    framed(shade(appearance.top, -8), 9, 13, 40, 4)
  } else if (appearance.hat === 'beanie') {
    framed(shade(appearance.top, -25), 17, 2, 29, 13)
    block(shade(appearance.top, 32), 20, 4, 22, 2)
  }
  if (appearance.faceAccessory === 'glasses') {
    block('#393b3d', 17, 28, 12, 1)
    block('#393b3d', 33, 28, 12, 1)
    block('#393b3d', 28, 30, 5, 1)
    block('#393b3d', 17, 28, 1, 7)
    block('#393b3d', 44, 28, 1, 7)
  }

  // Layer 8: an optional book occupies the item slot without combat imagery.
  if (appearance.prop === 'book') {
    framed('#f7efe0', 46, 45, 8, 10)
    block('#a25d3e', 49, 46, 2, 8)
  }
}

export function PixelAvatarCanvas({
  appearance,
  mood,
  size = 154,
  label = '2D 픽셀 캐릭터',
  className,
}: {
  appearance: PixelAvatarAppearance
  mood: FaithMood | null
  size?: number
  label?: string
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const context = canvasRef.current?.getContext('2d')
    if (context) drawPixelAvatar(context, appearance, mood)
  }, [appearance, mood])

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      role="img"
      aria-label={label}
      className={className}
      style={{ width: size, height: Math.round(size * HEIGHT / WIDTH), imageRendering: 'pixelated' }}
    />
  )
}
