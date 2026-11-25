import { describe, expect, it } from 'vitest'
import {
  prayerCameraY, prayerPlatforms, prayerSummitLevel,
  prayerWorldHeight, prayerWorldWidth, startPrayerAscent, stepPrayerAscent,
  type PrayerMove, type PrayerParkourPlayer,
} from '../src/lib/prayerParkour'

const dt = 1 / 60
const noInput = new Set<PrayerMove>()

function advance(
  player: PrayerParkourPlayer,
  controls: readonly PrayerMove[],
  frames: number,
) {
  const held = new Set(controls)
  for (let i = 0; i < frames; i++) player = stepPrayerAscent(player, held, false, dt)
  return player
}

describe('골고다 언덕 이동과 점프', () => {
  it.each([1 / 30, 1 / 60, 1 / 120])('makes all twenty ledges reachable by a jump at frame delta %d', (frameDelta) => {
    expect(prayerWorldHeight).toBe(2240)
    expect(prayerSummitLevel).toBe(20)
    for (let i = 0; i < prayerSummitLevel; i++) {
      const from = prayerPlatforms[i]
      const to = prayerPlatforms[i + 1]
      let player = {
        ...startPrayerAscent(),
        x: from.x + from.width / 2,
        y: from.y,
        platform: i,
      } as PrayerParkourPlayer
      const target = to.x + to.width / 2
      for (let frame = 0; frame < Math.ceil(1.05 / frameDelta) && player.platform !== i + 1; frame++) {
        const dx = target - player.x
        const horizontal = Math.abs(dx) <= 6 ? noInput : new Set<PrayerMove>([dx < 0 ? 'left' : 'right'])
        player = stepPrayerAscent(player, horizontal, frame === 0, frameDelta)
      }
      expect(player.platform, `ledge ${i + 1} not reachable`).toBe(i + 1)
    }
  })

  it('never ascends without a jump and keeps the prayer pose until the next move', () => {
    const start = startPrayerAscent()
    const up = advance(start, ['up'], 60)
    expect(up).toEqual(start)
    const praying = advance(start, ['down'], 1)
    expect(praying).toEqual({ ...start, isPraying: true })
    expect(advance(praying, [], 65)).toEqual(praying)
    expect(advance(praying, ['left'], 1).isPraying).toBe(false)
    expect(stepPrayerAscent(praying, noInput, true, dt)).toMatchObject({ isPraying: false, platform: null })
  })

  it('can wait until landing before displaying the prayer pose', () => {
    const start = startPrayerAscent()
    const air = stepPrayerAscent(start, noInput, true, dt)
    expect(advance(air, ['down'], 2).isPraying).toBe(false)
    expect(advance(air, ['down'], 61)).toMatchObject({ isPraying: true, platform: 1 })
  })

  it('keeps players within the world, blocks air jumps, and lands back at ground level', () => {
    const ground = { ...startPrayerAscent(), x: 63 }
    const air = stepPrayerAscent(ground, noInput, true, dt)
    expect(air.y).toBeLessThan(ground.y)
    expect(air.platform).toBeNull()
    expect(stepPrayerAscent(air, noInput, true, dt)).toEqual(stepPrayerAscent(air, noInput, false, dt))
    expect(advance(air, [], 75)).toMatchObject({ x: ground.x, y: ground.y, platform: ground.platform })
    expect(advance(ground, ['right'], 250).x).toBe(prayerWorldWidth - 11)
    expect(advance(ground, ['left'], 250)).toMatchObject({ x: 11, facing: 'left' })
  })

  it('keeps the camera inside the background at any normalized viewport height', () => {
    for (const height of [225, 300, 420, 520, 800, 1200]) {
      expect(prayerCameraY(0, height)).toBe(0)
      expect(prayerCameraY(prayerWorldHeight, height)).toBe(Math.max(0, prayerWorldHeight - height))
    }
  })
})
