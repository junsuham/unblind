export type MissionBoardResult = {
  round_no: number
  team_number: number
  card_id: string
  points: number
  completed_at: string
}

export type MissionBoardAssignment = { cardId: string; roundNo: number; drawnAt: string }

export type MissionStanding = {
  teamNumber: number
  points: number
  completedCount: number
  currentRoundNo: number | null
  currentCompleted: boolean
  currentPoints: number | null
}

export function isMissionPoints(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100
}

export function buildMissionStandings(
  teamCount: number,
  assignments: Record<string, MissionBoardAssignment>,
  results: MissionBoardResult[],
): MissionStanding[] {
  const standings = Array.from({ length: teamCount }, (_, index) => {
    const teamNumber = index + 1
    const assignment = assignments[`team:${teamNumber}`]
    const teamResults = results.filter((result) => result.team_number === teamNumber)
    const currentResult = assignment
      ? teamResults.find((result) => result.round_no === assignment.roundNo && result.card_id === assignment.cardId)
      : undefined

    return {
      teamNumber,
      points: teamResults.reduce((total, result) => total + result.points, 0),
      completedCount: teamResults.length,
      currentRoundNo: assignment?.roundNo ?? null,
      currentCompleted: Boolean(currentResult),
      currentPoints: currentResult?.points ?? null,
    }
  })

  return standings.sort((a, b) => b.points - a.points || b.completedCount - a.completedCount || a.teamNumber - b.teamNumber)
}
