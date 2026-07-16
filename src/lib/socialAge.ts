import 'server-only'

import type { User } from '@supabase/supabase-js'
import {
  getReferenceAge,
  isEligibleReferenceAge,
} from '@/lib/profile'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type SocialProvider = 'google'

type VerifiedAge = {
  birthDate: string
  referenceAge: number
  provider: SocialProvider
}

export class SocialAgeError extends Error {
  constructor(
    public code:
      | 'AGE_INFORMATION_REQUIRED'
      | 'AGE_RESTRICTED'
      | 'PROVIDER_MISMATCH'
      | 'PROVIDER_REQUEST_FAILED',
    message: string
  ) {
    super(message)
  }
}

function normalizeDate(year: number, month = 1, day = 1) {
  const value = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return getReferenceAge(value) === null ? null : value
}

async function getGoogleAge(providerToken: string): Promise<VerifiedAge> {
  const response = await fetch(
    'https://people.googleapis.com/v1/people/me?personFields=birthdays',
    { headers: { Authorization: `Bearer ${providerToken}` }, cache: 'no-store' }
  )

  if (!response.ok) {
    throw new SocialAgeError(
      'PROVIDER_REQUEST_FAILED',
      'Google 계정의 생년월일을 확인하지 못했습니다. 생년월일 권한에 동의한 뒤 다시 로그인해주세요.'
    )
  }

  const data = await response.json()
  const birthdays = Array.isArray(data?.birthdays) ? data.birthdays : []
  const birthday =
    birthdays.find((item: { metadata?: { primary?: boolean }; date?: { year?: number } }) =>
      item?.metadata?.primary && Number(item?.date?.year) > 0
    ) ??
    birthdays.find((item: { date?: { year?: number } }) => Number(item?.date?.year) > 0)
  const date = birthday?.date
  const birthDate = normalizeDate(Number(date?.year))
  const referenceAge = birthDate ? getReferenceAge(birthDate) : null

  if (!birthDate || referenceAge === null) {
    throw new SocialAgeError(
      'AGE_INFORMATION_REQUIRED',
      'Google 계정에서 출생 연도를 제공하지 않아 가입할 수 없습니다. Google 계정의 생년월일 정보를 확인해주세요.'
    )
  }

  return { birthDate, referenceAge, provider: 'google' }
}

export function getVerifiedSocialAge(user: User) {
  const birthDate = user.app_metadata?.social_birth_date
  const referenceAge = Number(user.app_metadata?.social_reference_age)
  const provider = user.app_metadata?.social_age_provider

  if (
    typeof birthDate !== 'string' ||
    !Number.isInteger(referenceAge) ||
    provider !== 'google'
  ) {
    return null
  }

  return { birthDate, referenceAge, provider } as VerifiedAge
}

export async function verifyAndStoreSocialAge(
  user: User,
  providerToken: string
) {
  const provider = user.app_metadata?.provider as SocialProvider | undefined

  if (provider !== 'google') {
    throw new SocialAgeError(
      'PROVIDER_MISMATCH',
      'Google 계정으로 다시 로그인해주세요.'
    )
  }

  const verified = await getGoogleAge(providerToken)

  if (!isEligibleReferenceAge(verified.referenceAge)) {
    throw new SocialAgeError(
      'AGE_RESTRICTED',
      '2026년도 기준 20세 이상 59세 이하만 가입할 수 있습니다.'
    )
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      social_birth_date: verified.birthDate,
      social_reference_age: verified.referenceAge,
      social_age_provider: verified.provider,
      social_age_verified_at: new Date().toISOString(),
    },
  })

  if (error) throw error

  return verified
}
