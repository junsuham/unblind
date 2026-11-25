export const prayerWorldWidth = 360
export const prayerWorldHeight = 1120
export const prayerPlayerRadius = 9

type Direction = 'left' | 'right'
export type PrayerMove = Direction | 'up' | 'down' | 'jump'
export type PrayerControls = ReadonlySet<PrayerMove>

export type PrayerPlatform = {
  x: number
  width: number
  y: number
}

export const prayerPlatforms: readonly PrayerPlatform[] = [
  { x: 0, width: 360, y: 1082 },
  { x: 112, width: 126, y: 1002 },
  { x: 207, width: 117, y: 922 },
  { x: 121, width: 123, y: 842 },
  { x: 28, width: 117, y: 762 },
  { x: 109, width: 115, y: 682 },
  { x: 210, width: 115, y: 602 },
  { x: 121, width: 128, y: 522 },
  { x: 28, width: 121, y: 442 },
  { x: 103, width: 121, y: 362 },
  { x: 133, width: 204, y: 282 },
]

export const prayerSummitLevel = prayerPlatforms.length - 1

export const prayerLadders = [
  { x: 167, top: 1, bottom: 0 },
  { x: 227, top: 2, bottom: 1 },
  { x: 229, top: 3, bottom: 2 },
  { x: 134, top: 4, bottom: 3 },
  { x: 125, top: 5, bottom: 4 },
  { x: 217, top: 6, bottom: 5 },
  { x: 233, top: 7, bottom: 6 },
  { x: 135, top: 8, bottom: 7 },
  { x: 126, top: 9, bottom: 8 },
  { x: 195, top: 10, bottom: 9 },
] as const

export type PrayerParkourPlayer = {
  x: number
  y: number
  facing: Direction
  velocityY: number
  platform: number | null
  climbing: boolean
}

export function startPrayerAscent(): PrayerParkourPlayer {
  return { x: 68, y: prayerPlatforms[0].y, facing: 'right', velocityY: 0, platform: 0, climbing: false }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function prayerCameraY(y: number, viewportHeight: number) {
  return clamp(y - viewportHeight * .66, 0, Math.max(0, prayerWorldHeight - viewportHeight))
}

function canLandAt(platform: PrayerPlatform, x: number) {
  return x + prayerPlayerRadius > platform.x && x - prayerPlayerRadius < platform.x + platform.width
}

export function stepPrayerAscent(
  player: PrayerParkourPlayer,
  controls: PrayerControls,
  jump: boolean,
  delta: number,
): PrayerParkourPlayer {
  const dt = clamp(delta, 0, 1 / 30)
  const horizontal = Number(controls.has('right')) - Number(controls.has('left'))
  const vertical = Number(controls.has('down')) - Number(controls.has('up'))
  const facing = horizontal < 0 ? 'left' : horizontal > 0 ? 'right' : player.facing
  const x = clamp(player.x + horizontal * 164 * dt, 11, prayerWorldWidth - 11)
  const ladder = !horizontal && !jump && (vertical !== 0 || player.climbing)
    ? prayerLadders.find((candidate) => {
      const top = prayerPlatforms[candidate.top].y
      const bottom = prayerPlatforms[candidate.bottom].y
      if (Math.abs(player.x - candidate.x) > 15) return false
      if (player.climbing && player.x !== candidate.x) return false
      return vertical < 0 ? player.y > top && player.y <= bottom + 10
        : vertical > 0 ? player.y >= top - 10 && player.y < bottom
        : player.y > top && player.y < bottom
    }) : undefined

  if (ladder) {
    const top = prayerPlatforms[ladder.top].y
    const bottom = prayerPlatforms[ladder.bottom].y
    const y = clamp(player.y + vertical * 98 * dt, top, bottom)
    const platform = y === top ? ladder.top : y === bottom ? ladder.bottom : null
    return { x: ladder.x, y, facing, velocityY: 0, platform, climbing: platform === null }
  }

  const onPlatform = player.platform !== null && canLandAt(prayerPlatforms[player.platform], x)
  if (onPlatform && !jump) {
    return { ...player, x, facing, velocityY: 0, climbing: false }
  }

  // Ground is one-way: rise freely, then land on the highest ledge crossed.
  const impulse = jump && (player.platform !== null || player.climbing) ? -575 : player.velocityY
  const velocityY = Math.min(485, impulse + 1210 * dt)
  const y = clamp(player.y + velocityY * dt, 22, prayerWorldHeight)
  if (velocityY >= 0) {
    for (let i = prayerSummitLevel; i >= 0; i--) {
      const ledge = prayerPlatforms[i]
      if (player.y <= ledge.y && y >= ledge.y && canLandAt(ledge, x)) {
        return { x, y: ledge.y, facing, velocityY: 0, platform: i, climbing: false }
      }
    }
  }

  return { x, y, facing, velocityY, platform: null, climbing: false }
}
