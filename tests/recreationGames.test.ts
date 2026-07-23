import { describe, expect, it } from 'vitest'
import {
  recommendRecreationGames,
  recreationGames,
  parseRecreationParticipantNames,
  splitParticipantsIntoTeams,
} from '../src/lib/recreationGames'

describe('recreation games', () => {
  it('provides a practical starter library with safety instructions', () => {
    expect(recreationGames.length).toBeGreaterThanOrEqual(20)
    expect(recreationGames.every((game) => game.steps.length >= 3)).toBe(true)
    expect(recreationGames.every((game) => game.safety.trim().length > 0)).toBe(true)
    expect(recreationGames.every((game) => game.facilitatorScript.trim().length > 0)).toBe(true)
    expect(recreationGames.map((game) => game.id)).not.toContain('five-second-profile')
    expect(recreationGames.map((game) => game.id)).not.toContain('one-line-prayer')
    expect(recreationGames.filter((game) => game.tool)).toHaveLength(4)
  })

  it('prioritizes games that fit the selected group context', () => {
    const recommendations = recommendRecreationGames({
      players: 12,
      minutes: 10,
      place: 'small',
      mood: 'calm',
      noMaterials: true,
    })

    expect(recommendations).toHaveLength(3)
    expect(recommendations.every((game) => game.places.includes('small'))).toBe(true)
    expect(recommendations.every((game) => game.materials.length === 0)).toBe(true)
    expect(recommendations[0].moods).toContain('calm')
  })

  it('deduplicates names and distributes participants evenly', () => {
    const randomValues = [0.1, 0.9, 0.2, 0.8, 0.3]
    let index = 0
    const teams = splitParticipantsIntoTeams(
      ['은우', '하람', '주원', '다온', '시온', '은우'],
      2,
      () => randomValues[index++ % randomValues.length]
    )

    const allMembers = teams.flatMap((team) => team.members)
    expect(teams).toHaveLength(2)
    expect(new Set(allMembers).size).toBe(5)
    expect(Math.abs(teams[0].members.length - teams[1].members.length)).toBeLessThanOrEqual(1)
  })

  it('accepts spaces, commas, and line breaks when parsing participant names', () => {
    expect(parseRecreationParticipantNames('은우 하람,주원\n다온')).toEqual([
      '은우', '하람', '주원', '다온',
    ])
  })
})
