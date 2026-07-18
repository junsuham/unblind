import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/requestUser'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { guardMutation } from '@/lib/mutationGuard'

const BUCKET = 'post-images'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export const runtime = 'nodejs'

let bucketReady: Promise<void> | null = null

function ensureBucket() {
  if (bucketReady) return bucketReady

  bucketReady = (async () => {
    const { data } = await supabaseAdmin.storage.getBucket(BUCKET)
    if (data) return

    const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: Array.from(ALLOWED_TYPES),
    })

    if (error && !error.message.toLowerCase().includes('already exists')) {
      throw error
    }
  })().catch((error) => {
    bucketReady = null
    throw error
  })

  return bucketReady
}

async function getEligibleUser(request: Request) {
  const user = await getRequestUser(request)
  if (!user?.email) return null

  const { data: allowedUser } = await supabaseAdmin
    .from('allowed_users')
    .select('status, agreed_at')
    .ilike('email', user.email)
    .maybeSingle<{ status: 'active' | 'blocked'; agreed_at: string | null }>()

  return allowedUser?.status === 'active' && allowedUser.agreed_at ? user : null
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > MAX_FILE_SIZE + 512 * 1024) {
    return NextResponse.json({ error: '이미지는 5MB 이하만 올릴 수 있습니다.' }, { status: 413 })
  }

  const user = await getEligibleUser(request)
  if (!user) {
    return NextResponse.json({ error: '이미지를 올릴 권한이 없습니다.' }, { status: 403 })
  }

  const blocked = await guardMutation(request, {
    bucket: 'post-image-upload',
    identity: user.id,
    limit: 15,
    windowSeconds: 10 * 60,
  })
  if (blocked) return blocked

  const formData = await request.formData().catch(() => null)
  const file = formData?.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: '이미지 파일을 선택해주세요.' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'JPG, PNG, WEBP 이미지만 올릴 수 있습니다.' }, { status: 400 })
  }
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: '이미지는 5MB 이하만 올릴 수 있습니다.' }, { status: 400 })
  }

  try {
    await ensureBucket()
  } catch (error) {
    console.error('Post image bucket preparation failed:', error)
    return NextResponse.json({ error: '이미지 저장 공간을 준비하지 못했습니다.' }, { status: 500 })
  }

  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const storagePath = `${user.id}/${randomUUID()}.${extension}`
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    })

  if (error) {
    console.error('Post image upload failed:', error)
    return NextResponse.json({ error: '이미지를 올리지 못했습니다.' }, { status: 500 })
  }

  return NextResponse.json({
    attachment: {
      type: 'image',
      label: '',
      storagePath,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    },
  })
}

export async function DELETE(request: Request) {
  const user = await getEligibleUser(request)
  if (!user) {
    return NextResponse.json({ error: '이미지를 삭제할 권한이 없습니다.' }, { status: 403 })
  }

  const blocked = await guardMutation(request, {
    bucket: 'post-image-delete',
    identity: user.id,
    limit: 30,
    windowSeconds: 10 * 60,
  })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  const storagePath = typeof body?.storagePath === 'string' ? body.storagePath : ''

  if (!storagePath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: '잘못된 이미지 경로입니다.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([storagePath])
  if (error) {
    return NextResponse.json({ error: '이미지를 삭제하지 못했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
