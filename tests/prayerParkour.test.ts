import { describe, expect, it } from 'vitest'
import {
  prayerCameraY, prayerLadders, prayerPlatforms, prayerSummitLevel,
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
  it('makes every ledge, including the summit, reachable by one jump', () => {
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
      for (let frame = 0; frame < 62 && player.platform !== i + 1; frame++) {
        const dx = target - player.x
        const horizontal = Math.abs(dx) <= 2.5 ? noInput : new Set<PrayerMove>([dx < 0 ? 'left' : 'right'])
        player = stepPrayerAscent(player, horizontal, frame === 0, dt)
      }
      expect(player.platform, `ledge ${i + 1} not reachable`).toBe(i + 1)
    }
  })

  it('connects every pair of platforms with a ladder that climbs in both directions', () => {
    for (const { x, top, bottom } of prayerLadders) {
      const start = { ...startPrayerAscent(), x, y: prayerPlatforms[bottom].y, platform: bottom }
      const up = advance(start, ['up'], 49)
      expect(up.platform, `up to ledge ${top}`).toBe(top)
      const down = advance(up, ['down'], 49)
      expect(down.platform, `down to ledge ${bottom}`).toBe(bottom)
    }
  })

  it('keeps players within the world, blocks air jumps, and lands back at ground level', () => {
    const ground = startPrayerAscent()
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
