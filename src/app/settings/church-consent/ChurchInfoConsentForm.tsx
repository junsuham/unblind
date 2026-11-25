'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CHURCH_INFO_CONSENT_VERSION } from '@/lib/agreement'

export function ChurchInfoConsentForm() {
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!accepted || saving) return
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/profile/church-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted, version: CHURCH_INFO_CONSENT_VERSION }),
      })
      if (!response.ok) {
        const result = await response.json().catch(() => null)
        setError(result?.error ?? '동의를 저장하지 못했습니다.')
        setSaving(false)
        return
      }
      router.replace('/activity')
      router.refresh()
    } catch {
      setError('서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="mt-4">
      <label className="flex min-h-12 items-start gap-3 rounded-[14px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] p-3 text-[13px] font-semibold">
        <input type="checkbox" checked={accepted} disabled={saving} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--ub-color-brand)]" />
        종교·교회 정보 수집 및 이용에 동의합니다.
      </label>
      {error && <p role="alert" className="mt-3 text-[13px] text-[var(--ub-danger-text)]">{error}</p>}
      <button type="submit" disabled={!accepted || saving} className="mt-3 min-h-12 w-full rounded-[14px] bg-[var(--ub-color-brand)] px-4 text-[14px] font-semibold text-white disabled:opacity-45">
        {saving ? '저장 중…' : '동의 저장'}
      </button>
    </form>
  )
}
