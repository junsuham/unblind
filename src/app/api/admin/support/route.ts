import type { NextRequest } from 'next/server'
import { isAdminRequest } from '@/lib/adminAuth'
import { getRequestUser } from '@/lib/requestUser'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const statuses = new Set(['open', 'in_progress', 'resolved', 'closed'])
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: '관리자 권한이 없습니다.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id.trim() : ''
  const status =
    typeof body?.status === 'string' && statuses.has(body.status)
      ? body.status
      : null
  const note =
    typeof body?.note === 'string' ? body.note.trim().slice(0, 1000) : ''

  if (!uuidPattern.test(id) || !status) {
    return Response.json({ error: '문의 처리 정보를 확인해주세요.' }, { status: 400 })
  }

  if (note.length < 3) {
    return Response.json({ error: '처리 메모를 3자 이상 입력해주세요.' }, { status: 400 })
  }

  const adminUser = await getRequestUser(request)
  const { error } = await supabaseAdmin.rpc('update_support_request', {
    p_id: id,
    p_status: status,
    p_resolution_note: note,
    p_admin_email: adminUser?.email ?? 'admin-session',
  })

  if (error) {
    console.error('Support request update failed:', error.message)
    return Response.json(
      { error: '문의 상태를 변경하지 못했습니다. 새로고침 후 다시 시도해주세요.' },
      { status: 500 },
    )
  }

  return Response.json({ ok: true })
}
