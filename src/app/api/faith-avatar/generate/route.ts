import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import {
  AvatarGenerationError,
  generateFaithAvatar,
  MAX_PHOTO_BYTES,
  prepareAvatarPhoto,
  readAvatarStyle,
  readBoundedImageBody,
} from '@/lib/faithAvatarGeneration'
import { consumeRequestRateLimit } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const maxDuration = 200

const MAX_FORM_BYTES = MAX_PHOTO_BYTES + 16 * 1024
const DAY_SECONDS = 24 * 60 * 60
const NO_STORE = 'private, no-store, max-age=0'

function json(body: object, status = 200, retryAfter?: number) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': NO_STORE,
      ...(retryAfter !== undefined ? { 'Retry-After': String(retryAfter) } : {}),
    },
  })
}

export async function GET(request: Request) {
  if (!process.env.OPENAI_API_KEY?.trim()) return json({ available: false })
  try {
    return json({ available: Boolean(await getCommunityRequestUser(request)) })
  } catch {
    return json({ available: false }, 503)
  }
}

export async function POST(request: Request) {
  // This paid, consent-gated upload is intentionally restricted to same-origin browser clients.
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return json({ error: '요청 출처를 확인하지 못했어요. 앱을 새로 열고 다시 시도해주세요.' }, 403)
  }

  try {
    const user = await getCommunityRequestUser(request)
    if (!user) return json({ error: '이미지를 생성하려면 로그인과 가입 절차를 완료해주세요.' }, 401)

    const apiKey = process.env.OPENAI_API_KEY?.trim()
    if (!apiKey) return json({ error: '사진으로 캐릭터 만들기는 아직 사용할 수 없어요.' }, 503)

    const contentType = request.headers.get('content-type')
    if (!contentType?.toLowerCase().startsWith('multipart/form-data;')) {
      return json({ error: '사진 파일을 선택해주세요.' }, 400)
    }
    const tooLarge = new AvatarGenerationError('사진은 2MB 이하로 올려주세요.', 413)
    if (Number(request.headers.get('content-length')) > MAX_FORM_BYTES) throw tooLarge

    const upload = await consumeRequestRateLimit(request, {
      bucket: 'faith-avatar-upload', identity: user.id, limit: 8, windowSeconds: 60,
    })
    if (upload.unavailable) {
      return json({ error: '생성 요청을 확인하는 중이에요. 잠시 후 다시 시도해주세요.' }, 503, upload.retryAfter)
    }
    if (!upload.allowed) {
      return json({ error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.' }, 429, upload.retryAfter)
    }

    const raw = await readBoundedImageBody(request.body, MAX_FORM_BYTES, tooLarge)
    const form = await new Response(new Uint8Array(raw), { headers: { 'Content-Type': contentType } })
      .formData().catch(() => null)
    if (!form) return json({ error: '사진을 읽을 수 없어요. 파일을 다시 선택해주세요.' }, 400)
    if (form.get('consent') !== 'accepted') {
      return json({ error: '사진 전송 및 이미지 생성에 동의해야 사용할 수 있어요.' }, 400)
    }
    const file = form.get('photo')
    if (!(file instanceof File)) return json({ error: '사진 파일을 선택해주세요.' }, 400)
    const styling = readAvatarStyle(form)
    const photo = await prepareAvatarPhoto(file)

    for (const quota of [
      { bucket: 'faith-avatar-account-day', identity: user.id, limit: 2, windowSeconds: DAY_SECONDS, message: '계정의 오늘 생성 횟수(2회)를 모두 사용했어요.' },
      { bucket: 'faith-avatar-app-minute', identity: 'app', limit: 2, windowSeconds: 60, message: '이미지 생성 요청이 몰렸어요. 잠시 후 다시 시도해주세요.' },
      { bucket: 'faith-avatar-app-day', identity: 'app', limit: 24, windowSeconds: DAY_SECONDS, message: '앱의 오늘 이미지 생성 한도를 모두 사용했어요.' },
    ]) {
      const { message, ...options } = quota
      const limit = await consumeRequestRateLimit(request, options)
      if (limit.unavailable) {
        return json({ error: '생성 요청을 확인하는 중이에요. 잠시 후 다시 시도해주세요.' }, 503, limit.retryAfter)
      }
      if (!limit.allowed) return json({ error: message }, 429, limit.retryAfter)
    }

    // The original and results are not written to disk/database by this route.
    const generated = await generateFaithAvatar(photo, styling, apiKey, request.signal)
    return json(generated)
  } catch (error) {
    if (error instanceof AvatarGenerationError) return json({ error: error.message }, error.status)
    return json({ error: '이미지를 생성하지 못했어요. 잠시 후 다시 시도해주세요.' }, 503)
  }
}
