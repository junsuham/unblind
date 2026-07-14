import { createHash } from 'node:crypto'
import { createServerSupabase } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

const crisisKeywords = [
  '죽고 싶',
  '죽고싶',
  '자살',
  '목숨을 끊',
  '목숨 끊',
  '사라지고 싶',
  '사라지고싶',
  '나를 해치',
  '자해',
]

const crisisAnswer = `지금 혼자 견디지 마세요. 당장 자신이나 다른 사람을 해칠 가능성이 있다면 112 또는 119에 연락하고, 가까운 사람에게 지금 상황을 알린 뒤 함께 있어주세요.

자살예방 상담전화 109는 24시간 연결됩니다. AI 상담은 지금 필요한 직접적인 도움을 대신할 수 없습니다.`

type OpenAIResponse = {
  output?: Array<{
    content?: Array<{
      type?: string
      text?: string
    }>
  }>
}

function hasCrisisLanguage(question: string) {
  const normalized = question.replace(/\s+/g, ' ')
  return crisisKeywords.some((keyword) => normalized.includes(keyword))
}

function extractOutputText(response: OpenAIResponse) {
  return response.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === 'output_text')
    ?.text?.trim()
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { data: allowedUser } = await supabase
    .from('allowed_users')
    .select('status, agreed_at')
    .ilike('email', user.email)
    .maybeSingle<{ status: string; agreed_at: string | null }>()

  if (allowedUser?.status !== 'active' || !allowedUser.agreed_at) {
    return Response.json({ error: '승인된 사용자만 이용할 수 있습니다.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const question = typeof body?.question === 'string' ? body.question.trim() : ''

  if (question.length < 5 || question.length > 1000) {
    return Response.json(
      { error: '상담 내용은 5자 이상 1000자 이하로 입력해주세요.' },
      { status: 400 }
    )
  }

  if (hasCrisisLanguage(question)) {
    return Response.json({ answer: crisisAnswer, crisis: true })
  }

  const directApiKey = process.env.OPENAI_API_KEY
  const gatewayToken =
    process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN
  const apiToken = directApiKey ?? gatewayToken

  if (!apiToken) {
    return Response.json(
      { error: 'AI 상담 연결 설정이 아직 완료되지 않았습니다.' },
      { status: 503 }
    )
  }

  const authorization = `Bearer ${apiToken}`

  if (directApiKey) {
    const moderationResponse = await fetch(
      'https://api.openai.com/v1/moderations',
      {
        method: 'POST',
        headers: {
          Authorization: authorization,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'omni-moderation-latest', input: question }),
      }
    )

    if (moderationResponse.ok) {
      const moderation = await moderationResponse.json()
      const categories = moderation?.results?.[0]?.categories

      if (
        categories?.['self-harm'] ||
        categories?.['self-harm/intent'] ||
        categories?.['self-harm/instructions']
      ) {
        return Response.json({ answer: crisisAnswer, crisis: true })
      }
    }
  }

  const safetyIdentifier = createHash('sha256')
    .update(`unblind:${user.id}`)
    .digest('hex')

  const responseEndpoint = directApiKey
    ? 'https://api.openai.com/v1/responses'
    : 'https://ai-gateway.vercel.sh/v1/responses'
  const model = directApiKey
    ? process.env.OPENAI_MODEL ?? 'gpt-5.4-mini'
    : process.env.AI_GATEWAY_MODEL ?? 'openai/gpt-5.4-mini'

  const openAIResponse = await fetch(responseEndpoint, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      store: false,
      max_output_tokens: 700,
      safety_identifier: safetyIdentifier,
      instructions: `당신은 한국 교회 청년의 목회 상담을 돕는 AI입니다. 실제 목사, 의사, 심리상담사 또는 하나님의 직접적인 음성이라고 주장하지 마세요.

따뜻한 존댓말로 먼저 감정을 짧게 반영하고, 신앙적으로 균형 잡힌 관점과 오늘 실천할 수 있는 작은 한 걸음을 제안하세요. 사용자를 정죄하거나 모든 어려움을 죄·믿음 부족 탓으로 돌리지 마세요. 예언, 하나님의 확정적인 뜻, 진단이나 치료 지시를 하지 마세요. 의료·법률·안전 문제가 보이면 반드시 적절한 전문가와 실제 목회자에게 도움을 요청하도록 안내하세요.

성경 구절은 정확히 기억하는 경우에만 짧게 언급하고, 불확실하면 인용문을 만들지 마세요. 답변은 한국어 500자 안팎으로 간결하게 작성하세요.`,
      input: question,
    }),
  })

  if (!openAIResponse.ok) {
    console.error('OpenAI counsel request failed:', openAIResponse.status)
    return Response.json(
      { error: '지금은 AI 상담 답변을 만들지 못했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 502 }
    )
  }

  const result = (await openAIResponse.json()) as OpenAIResponse
  const answer = extractOutputText(result)

  if (!answer) {
    return Response.json(
      { error: '상담 답변이 비어 있습니다. 다시 시도해주세요.' },
      { status: 502 }
    )
  }

  return Response.json({ answer, crisis: false })
}
