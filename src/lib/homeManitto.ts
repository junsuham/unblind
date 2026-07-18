export type HomeManittoState = {
  joined: boolean
  isActive: boolean
  participantCount: number
  recipientNickname: string | null
}

export type HomeManittoPhase =
  | 'inactive'
  | 'ready'
  | 'waiting'
  | 'matched'

export function getHomeManittoPhase(
  state: HomeManittoState,
): HomeManittoPhase {
  if (!state.isActive) return 'inactive'
  if (state.recipientNickname) return 'matched'
  if (state.joined) return 'waiting'
  return 'ready'
}

