import { createHash } from 'node:crypto'
import { isAdminUser } from '@/lib/adminRole'
import { getRequestUser } from '@/lib/requestUser'
import { getVerifiedSocialAge } from '@/lib/socialAge'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const user = await getRequestUser(request)

  if (!user) {
    return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const verifiedAge = getVerifiedSocialAge(user)
  const admin = await isAdminUser(user)

  return Response.json({
    isAdmin: admin,
    ageVerified: Boolean(verifiedAge),
    referenceAge: verifiedAge?.referenceAge ?? null,
  })
}

export async function DELETE(request: Request) {
  const user = await getRequestUser(request)

  if (!user?.email) {
    return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (body?.confirmation !== '탈퇴') {
    return Response.json(
      { error: '계정 삭제 확인 문구를 다시 입력해주세요.' },
      { status: 400 }
    )
  }

  if (await isAdminUser(user)) {
    return Response.json(
      { error: '관리자 계정은 다른 관리자를 지정한 뒤 삭제할 수 있습니다.' },
      { status: 400 }
    )
  }

  const normalizedEmail = user.email.trim().toLowerCase()
  const emailHash = createHash('sha256').update(normalizedEmail).digest('hex')
  const { data: audit, error: auditError } = await supabaseAdmin
    .from('account_deletion_audit')
    .insert({ user_id: user.id, email_hash: emailHash })
    .select('id')
    .single<{ id: string }>()

  if (auditError) {
    return Response.json(
      { error: '계정 삭제 요청을 기록하지 못했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }

  const cleanupOperations = [
    supabaseAdmin.from('posts').update({ author_user_id: null }).eq('author_user_id', user.id),
    supabaseAdmin.from('comments').update({ author_user_id: null }).eq('author_user_id', user.id),
    supabaseAdmin.from('reports').update({ reporter_user_id: null, reporter_email: null }).eq('reporter_user_id', user.id),
    supabaseAdmin.from('post_author_links').delete().eq('user_id', user.id),
    supabaseAdmin.from('comment_author_links').delete().eq('user_id', user.id),
    supabaseAdmin.from('reactions').delete().eq('actor_key', user.id),
    supabaseAdmin.from('allowed_users').delete().ilike('email', normalizedEmail),
  ]

  const cleanupResults = await Promise.all(cleanupOperations)
  const cleanupError = cleanupResults.find((result) => result.error)?.error

  if (cleanupError) {
    await supabaseAdmin
      .from('account_deletion_audit')
      .update({ result: `cleanup_failed:${cleanupError.code ?? 'unknown'}` })
      .eq('id', audit.id)

    return Response.json(
      { error: '계정 데이터를 정리하지 못했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

  if (deleteError) {
    await supabaseAdmin
      .from('account_deletion_audit')
      .update({ result: `auth_delete_failed:${deleteError.status ?? 'unknown'}` })
      .eq('id', audit.id)

    return Response.json(
      { error: '로그인 계정을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }

  await supabaseAdmin
    .from('account_deletion_audit')
    .update({ result: 'completed', completed_at: new Date().toISOString() })
    .eq('id', audit.id)

  return Response.json({ ok: true })
}
