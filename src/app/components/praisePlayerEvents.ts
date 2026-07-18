export const OPEN_PRAISE_PLAYER_EVENT = 'unblind:open-praise-player'

export type PraisePlayerTrack = {
  id: string
  title: string
  artist: string
}

export type OpenPraisePlayerDetail = {
  tracks: PraisePlayerTrack[]
}
