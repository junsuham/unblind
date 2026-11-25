export const prayerWorldWidth = 360
export const prayerWorldHeight = 2240
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
  { x: 0, width: 360, y: 2202 },
  { x: 92, width: 133, y: 2107 },
  { x: 204, width: 123, y: 2010 },
  { x: 126, width: 124, y: 1906 },
  { x: 31, width: 123, y: 1804 },
  { x: 105, width: 118, y: 1704 },
  { x: 213, width: 119, y: 1598 },
  { x: 140, width: 111, y: 1495 },
  { x: 49, width: 111, y: 1391 },
  { x: 112, width: 118, y: 1290 },
  { x: 210, width: 122, y: 1184 },
  { x: 126, width: 114, y: 1084 },
  { x: 30, width: 115, y: 974 },
  { x: 110, width: 120, y: 871 },
  { x: 220, width: 110, y: 768 },
  { x: 143, width: 112, y: 668 },
  { x: 39, width: 114, y: 563 },
  { x: 105, width: 121, y: 461 },
  { x: 209, width: 108, y: 353 },
  { x: 132, width: 112, y: 249 },
  { x: 86, width: 233, y: 145 },
]

export const prayerSummitLevel = prayerPlatforms.length - 1

export type PrayerParkourPlayer = {
  x: number
  y: number
  facing: Direction
  velocityY: number
  platform: number | null
  isPraying: boolean
}

export function startPrayerAscent(): PrayerParkourPlayer {
  return { x: 140, y: prayerPlatforms[0].y, facing: 'right', velocityY: 0, platform: 0, isPraying: false }
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
  const facing = horizontal < 0 ? 'left' : horizontal > 0 ? 'right' : player.facing
  const x = clamp(player.x + horizontal * 176 * dt, 11, prayerWorldWidth - 11)

  const onPlatform = player.platform !== null && canLandAt(prayerPlatforms[player.platform], x)
  if (onPlatform && !jump) {
    return { ...player, x, facing, velocityY: 0, isPraying: !horizontal && (controls.has('down') || player.isPraying) }
  }

  // Ledges are one-way surfaces: only a jump raises the player, then the
  // highest crossed ledge catches their fall.
  const impulse = jump && player.platform !== null ? -608 : player.velocityY
  const velocityY = Math.min(485, impulse + 1210 * dt)
  const y = clamp(player.y + velocityY * dt, 22, prayerWorldHeight)
  if (velocityY >= 0) {
    for (let i = prayerSummitLevel; i >= 0; i--) {
      const ledge = prayerPlatforms[i]
      if (player.y <= ledge.y && y >= ledge.y && canLandAt(ledge, x)) {
        return { x, y: ledge.y, facing, velocityY: 0, platform: i, isPraying: !horizontal && controls.has('down') }
      }
    }
  }

  return { x, y, facing, velocityY, platform: null, isPraying: false }
}
