import { randomInt } from 'node:crypto'
import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import { guardMutation } from '@/lib/mutationGuard'
import { getRequestIdentity } from '@/lib/rateLimitKey'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { issueMissionGuestToken, verifyMissionGuestToken } from '@/lib/recreationMissionToken'
import { missionDecks, type MissionCategory, type MissionMode } from '@/app/recreation/mission/missionCards'
import { buildMissionStandings, isMissionPoints, type MissionBoardResult } from '@/app/recreation/mission/missionBoard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const GUEST_TOKEN_HEADER = 'x-mission-guest-token'

type RoomRow = {
  id: string
  host_user_id: string
  mode: MissionMode
  team_count: number
  category: MissionCategory
  current_card_id: string | null
  assignments: Record<string, { cardId: string; roundNo: number; drawnAt: string }>
  used_card_ids: string[]
  round_no: number
  drawn_at: string | null
  expires_at: string
}

async function loadRoom(id: string): Promise<RoomRow | null> {
  if (!uuidPattern.test(id)) return null
  const { data, error } = await supabaseAdmin
    .from('recreation_mission_rooms')
    .select('id, host_user_id, mode, team_count, category, current_card_id, assignments, used_card_ids, round_no, drawn_at, expires_at')
    .eq('id', id)
    .maybeSingle<RoomRow>()
  if (error || !data || Date.parse(data.expires_at) <= Date.now()) return null
  return data
}

export async function GET(request: Request, context: RouteContext<'/api/recreation/mission/[id]'>) {
  const { id } = await context.params
  const room = await loadRoom(id)
  if (!room) return Response.json({ error: '종료되었거나 존재하지 않는 모임입니다.' }, { status: 404 })

  const [participantResponse, boardResponse] = await Promise.all([
    supabaseAdmin
      .from('recreation_mission_participants')
      .select('id', { head: true, count: 'exact' })
      .eq('room_id', id),
    room.mode === 'team'
      ? supabaseAdmin
        .from('recreation_mission_board_results')
        .select('round_no, team_number, card_id, points, completed_at')
        .eq('room_id', id)
        .order('round_no', { ascending: true })
        .limit(200)
      : Promise.resolve({ data: [], error: null }),
  ])
  const { count, error: countError } = participantResponse
  if (countError) return Response.json({ error: '참여 인원을 확인하지 못했습니다.' }, { status: 500 })
  const boardUnavailable = boardResponse.error?.code === '42P01' || boardResponse.error?.code === 'PGRST205'
  if (boardResponse.error && !boardUnavailable) {
    console.error('Mission board read failed:', boardResponse.error.message)
    return Response.json({ error: '미션보드를 불러오지 못했습니다.' }, { status: 503 })
  }

  const publicState = {
    room: {
      id: room.id,
      mode: room.mode,
      teamCount: room.team_count,
      category: room.category,
      roundNo: room.round_no,
      expiresAt: room.expires_at,
    },
    participantCount: count ?? 0,
    board: room.mode === 'team' ? {
      available: !boardUnavailable,
      standings: buildMissionStandings(room.team_count, room.assignments ?? {}, (boardResponse.data ?? []) as MissionBoardResult[]),
    } : null,
  }
  const responseHeaders = { 'Cache-Control': 'no-store' }

  const guestToken = request.headers.get(GUEST_TOKEN_HEADER)
  if (guestToken) {
    const participantId = verifyMissionGuestToken(guestToken, id)
    if (!participantId) return Response.json({ code: 'INVALID_PARTICIPANT_TOKEN', error: '입장 정보가 만료되었습니다. 다시 입장해주세요.' }, { status: 401, headers: responseHeaders })
    const { data: participant, error } = await supabaseAdmin
      .from('recreation_mission_participants')
      .select('id, name, team_number')
      .eq('room_id', id)
      .eq('id', participantId)
      .maybeSingle()
    if (error || !participant) return Response.json({ code: 'INVALID_PARTICIPANT_TOKEN', error: '입장 정보를 찾지 못했습니다. 다시 입장해주세요.' }, { status: 401, headers: responseHeaders })
    const targetKey = room.mode === 'team' ? `team:${participant.team_number}` : `person:${participant.id}`
    const assigned = room.assignments?.[targetKey]
    return Response.json({
      ...publicState,
      participant: { name: participant.name, team_number: participant.team_number },
      assignment: assigned ? {
        card: missionDecks[room.category].find((card) => card.id === assigned.cardId) ?? null,
        roundNo: assigned.roundNo,
        drawnAt: assigned.drawnAt,
      } : null,
    }, { headers: responseHeaders })
  }

  // Only the organizer UI asks for the complete roster. A signed-in guest
  // should not incur an auth lookup on every public room refresh.
  if (new URL(request.url).searchParams.get('host') !== '1') {
    return Response.json(publicState, { headers: responseHeaders })
  }
  const user = await getCommunityRequestUser(request)
  if (user?.id !== room.host_user_id) {
    return Response.json({ error: '진행자 권한이 필요합니다.' }, { status: 403, headers: responseHeaders })
  }

  const { data: participants, error } = await supabaseAdmin
    .from('recreation_mission_participants')
    .select('id, name, team_number, joined_at')
    .eq('room_id', id)
    .order('joined_at', { ascending: true })
    .limit(100)
  if (error) return Response.json({ error: '참여자 목록을 불러오지 못했습니다.' }, { status: 500 })
  const assignments = Object.fromEntries(
    Object.entries(room.assignments ?? {}).map(([target, assignment]) => [target, {
      card: missionDecks[room.category].find((card) => card.id === assignment.cardId) ?? null,
      roundNo: assignment.roundNo,
      drawnAt: assignment.drawnAt,
    }]),
  )
  return Response.json({
    ...publicState,
    room: { ...publicState.room, assignments },
    participants: participants ?? [],
  }, { headers: responseHeaders })
}

export async function POST(request: Request, context: RouteContext<'/api/recreation/mission/[id]'>) {
  const { id } = await context.params
  const room = await loadRoom(id)
  if (!room) return Response.json({ error: '종료되었거나 존재하지 않는 모임입니다.' }, { status: 404 })

  const body = await request.json().catch(() => null)
  if (body?.action === 'join') {
    if (!process.env.SUPABASE_SECRET_KEY) return Response.json({ error: '입장 인증을 준비하는 중입니다.' }, { status: 503 })
    const blocked = await guardMutation(request, {
      bucket: 'recreation-mission-join',
      identity: `${id}:${getRequestIdentity(request)}`,
      // A whole group can enter from a single venue Wi-Fi connection.
      // Keep this above the room's 80-person cap to avoid rejecting guests.
      limit: 100,
      windowSeconds: 600,
    })
    if (blocked) return blocked
    const submittedName = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : ''
    const name = submittedName || (room.mode === 'team' ? `참가자 ${randomInt(100, 1000)}` : '')
    const teamNumber = Number(body.teamNumber)
    if (!name || name.length > 24) return Response.json({ error: '이름은 1~24자로 입력해주세요.' }, { status: 400 })
    if (room.mode === 'team' && (!Number.isInteger(teamNumber) || teamNumber < 1 || teamNumber > room.team_count)) {
      return Response.json({ error: '참여할 팀을 선택해주세요.' }, { status: 400 })
    }
    const { count, error: countError } = await supabaseAdmin
      .from('recreation_mission_participants')
      .select('id', { head: true, count: 'exact' })
      .eq('room_id', id)
    if (countError) return Response.json({ error: '참여 인원을 확인하지 못했습니다.' }, { status: 500 })
    if ((count ?? 0) >= 80) return Response.json({ error: '이 모임은 최대 80명까지 참여할 수 있습니다.' }, { status: 409 })

    const { data, error } = await supabaseAdmin
      .from('recreation_mission_participants')
      .insert({ room_id: id, name, team_number: room.mode === 'team' ? teamNumber : null })
      .select('id, name, team_number')
      .single()
    if (error || !data) return Response.json({ error: '모임에 입장하지 못했습니다.' }, { status: 500 })
    const token = issueMissionGuestToken(id, data.id, room.expires_at)
    if (!token) return Response.json({ error: '입장 인증을 준비하는 중입니다.' }, { status: 503 })
    return Response.json({ token, participant: { name: data.name, team_number: data.team_number } }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  }

  if (body?.action === 'draw') {
    const user = await getCommunityRequestUser(request)
    if (!user || user.id !== room.host_user_id) {
      return Response.json({ error: '진행자만 다음 미션을 뽑을 수 있습니다.' }, { status: 403 })
    }
    const blocked = await guardMutation(request, {
      bucket: 'recreation-mission-draw', identity: user.id, limit: 20, windowSeconds: 60,
    })
    if (blocked) return blocked
    if (room.round_no >= 200) return Response.json({ error: '이 모임에서 뽑을 수 있는 미션 수를 모두 사용했습니다. 새 모임을 만들어주세요.' }, { status: 409 })
    const targetKey = typeof body.targetKey === 'string' ? body.targetKey : ''
    if (room.mode === 'team') {
      const targetTeam = Number(targetKey.replace(/^team:/, ''))
      if (targetKey !== `team:${targetTeam}` || !Number.isInteger(targetTeam) || targetTeam < 1 || targetTeam > room.team_count) {
        return Response.json({ error: '미션을 받을 팀을 선택해주세요.' }, { status: 400 })
      }
      const { count, error: teamError } = await supabaseAdmin
        .from('recreation_mission_participants')
        .select('id', { head: true, count: 'exact' })
        .eq('room_id', id)
        .eq('team_number', targetTeam)
      if (teamError || !count) return Response.json({ error: '해당 팀에 참가자가 아직 없습니다.' }, { status: 400 })
    } else {
      const participantId = targetKey.startsWith('person:') ? targetKey.slice(7) : ''
      if (!uuidPattern.test(participantId)) return Response.json({ error: '미션을 받을 참가자를 선택해주세요.' }, { status: 400 })
      const { count, error: participantError } = await supabaseAdmin
        .from('recreation_mission_participants')
        .select('id', { head: true, count: 'exact' })
        .eq('room_id', id)
        .eq('id', participantId)
      if (participantError || count !== 1) return Response.json({ error: '참가자를 찾지 못했습니다.' }, { status: 400 })
    }
    const deck = missionDecks[room.category]
    const unused = deck.filter((card) => !room.used_card_ids.includes(card.id))
    const pool = unused.length ? unused : deck.filter((card) => card.id !== room.current_card_id)
    const card = pool[randomInt(pool.length)]
    const nextUsedIds = unused.length ? [...room.used_card_ids, card.id] : [card.id]
    const drawnAt = new Date().toISOString()
    const assignments = {
      ...(room.assignments ?? {}),
      [targetKey]: { cardId: card.id, roundNo: room.round_no + 1, drawnAt },
    }
    const { data, error } = await supabaseAdmin
      .from('recreation_mission_rooms')
      .update({ current_card_id: card.id, assignments, used_card_ids: nextUsedIds, round_no: room.round_no + 1, drawn_at: drawnAt })
      .eq('id', id)
      .eq('round_no', room.round_no)
      .select('round_no')
      .maybeSingle()
    if (error) return Response.json({ error: '미션을 뽑지 못했습니다.' }, { status: 500 })
    if (!data) return Response.json({ error: '다른 미션이 이미 뽑혔습니다. 화면을 새로고침해주세요.' }, { status: 409 })
    return Response.json({ card, targetKey, roundNo: data.round_no })
  }

  if (body?.action === 'complete' || body?.action === 'score' || body?.action === 'reopen') {
    const user = await getCommunityRequestUser(request)
    if (!user || user.id !== room.host_user_id) {
      return Response.json({ error: '진행자만 미션 완료와 점수를 변경할 수 있습니다.' }, { status: 403 })
    }
    if (room.mode !== 'team') return Response.json({ error: '미션보드는 팀전에서 사용할 수 있습니다.' }, { status: 400 })
    const blocked = await guardMutation(request, {
      bucket: 'recreation-mission-board', identity: user.id, limit: 30, windowSeconds: 60,
    })
    if (blocked) return blocked

    const teamNumber = Number(body.teamNumber)
    const roundNo = Number(body.roundNo)
    if (!Number.isInteger(teamNumber) || teamNumber < 1 || teamNumber > room.team_count) {
      return Response.json({ error: '팀을 다시 선택해주세요.' }, { status: 400 })
    }
    const assignment = room.assignments?.[`team:${teamNumber}`]
    if (!assignment || !Number.isInteger(roundNo) || roundNo !== assignment.roundNo) {
      return Response.json({ error: '미션이 변경되었습니다. 화면을 새로고침해주세요.' }, { status: 409 })
    }

    if (body.action === 'complete') {
      if (!isMissionPoints(body.points)) return Response.json({ error: '점수는 0~100점의 정수로 입력해주세요.' }, { status: 400 })
      const { error } = await supabaseAdmin.from('recreation_mission_board_results').insert({
        room_id: id,
        round_no: roundNo,
        team_number: teamNumber,
        card_id: assignment.cardId,
        points: body.points,
        completed_by: user.id,
      })
      if (error?.code === '23505') return Response.json({ error: '이미 완료 처리된 미션입니다. 화면을 새로고침해주세요.' }, { status: 409 })
      if (error) {
        console.error('Mission completion failed:', error.message)
        return Response.json({ error: '완료 처리를 저장하지 못했습니다.' }, { status: 503 })
      }
      return Response.json({ ok: true })
    }

    if (!isMissionPoints(body.expectedPoints)) {
      return Response.json({ error: '현재 점수를 다시 확인해주세요.' }, { status: 400 })
    }
    if (body.action === 'score') {
      if (!isMissionPoints(body.points)) return Response.json({ error: '점수는 0~100점의 정수로 입력해주세요.' }, { status: 400 })
      const { data, error } = await supabaseAdmin.from('recreation_mission_board_results')
        .update({ points: body.points })
        .eq('room_id', id)
        .eq('round_no', roundNo)
        .eq('team_number', teamNumber)
        .eq('card_id', assignment.cardId)
        .eq('points', body.expectedPoints)
        .select('round_no').maybeSingle()
      if (error) return Response.json({ error: '점수를 저장하지 못했습니다.' }, { status: 503 })
      if (!data) return Response.json({ error: '점수가 이미 변경되었습니다. 화면을 새로고침해주세요.' }, { status: 409 })
      return Response.json({ ok: true })
    }

    const { data, error } = await supabaseAdmin.from('recreation_mission_board_results')
      .delete()
      .eq('room_id', id)
      .eq('round_no', roundNo)
      .eq('team_number', teamNumber)
      .eq('card_id', assignment.cardId)
      .eq('points', body.expectedPoints)
      .select('round_no').maybeSingle()
    if (error) return Response.json({ error: '완료 취소를 저장하지 못했습니다.' }, { status: 503 })
    if (!data) return Response.json({ error: '완료 상태가 이미 변경되었습니다. 화면을 새로고침해주세요.' }, { status: 409 })
    return Response.json({ ok: true })
  }

  return Response.json({ error: '지원하지 않는 요청입니다.' }, { status: 400 })
}
