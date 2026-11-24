import { describe, expect, it } from 'vitest'
import { buildMissionStandings, isMissionPoints, type MissionBoardResult } from '../src/app/recreation/mission/missionBoard'

const completed: MissionBoardResult[] = [
  { round_no: 1, team_number: 1, card_id: 'a', points: 10, completed_at: '2026-11-24T00:00:00Z' },
  { round_no: 2, team_number: 2, card_id: 'b', points: 20, completed_at: '2026-11-24T00:01:00Z' },
  { round_no: 3, team_number: 1, card_id: 'c', points: 10, completed_at: '2026-11-24T00:02:00Z' },
]

describe('mission board', () => {
  it('accepts only bounded whole-number points', () => {
    expect([0, 10, 100].every(isMissionPoints)).toBe(true)
    expect([-1, 1.5, 101, '10', NaN, Infinity].some(isMissionPoints)).toBe(false)
  })

  it('orders teams by points then completed count and finds the current completion', () => {
    const standings = buildMissionStandings(3, {
      'team:1': { cardId: 'c', roundNo: 3, drawnAt: '' },
      'team:2': { cardId: 'd', roundNo: 4, drawnAt: '' },
    }, completed)

    expect(standings.map(({ teamNumber }) => teamNumber)).toEqual([1, 2, 3])
    expect(standings[0]).toMatchObject({ points: 20, completedCount: 2, currentCompleted: true, currentPoints: 10 })
    expect(standings[1]).toMatchObject({ points: 20, completedCount: 1, currentCompleted: false, currentPoints: null })
    expect(standings[2]).toMatchObject({ points: 0, completedCount: 0, currentRoundNo: null })
  })

  it('does not treat an old card result as a newly drawn card completion', () => {
    const standings = buildMissionStandings(2, {
      'team:1': { cardId: 'different', roundNo: 1, drawnAt: '' },
    }, completed)
    expect(standings.find(({ teamNumber }) => teamNumber === 1)?.currentCompleted).toBe(false)
  })
})
