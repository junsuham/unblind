'use client'

import { FormEvent, useState } from 'react'

export default function ManittoSettingsForm({ settings }: { settings: { is_active: boolean; starts_on: string | null; ends_on: string | null; reveal_enabled: boolean } }) {
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/admin/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'manitto', isActive: form.get('isActive') === 'on', startsOn: form.get('startsOn'), endsOn: form.get('endsOn'), revealEnabled: form.get('revealEnabled') === 'on' }) })
    const result = await response.json()
    setMessage(response.ok ? '설정을 저장했습니다.' : result.error)
  }
  return <form onSubmit={submit} className="space-y-4 rounded-[22px] bg-[var(--ub-surface-card-strong)] p-5 text-[var(--ub-text-primary)]"><label className="flex items-center justify-between"><span>운영 활성화</span><input type="checkbox" name="isActive" defaultChecked={settings.is_active} /></label><label className="block text-[13px]">시작일<input type="date" name="startsOn" defaultValue={settings.starts_on ?? ''} className="mt-1 min-h-11 w-full rounded-[12px] bg-[var(--ub-surface-muted)] px-3" /></label><label className="block text-[13px]">종료일<input type="date" name="endsOn" defaultValue={settings.ends_on ?? ''} className="mt-1 min-h-11 w-full rounded-[12px] bg-[var(--ub-surface-muted)] px-3" /></label><label className="flex items-center justify-between"><span>종료 후 공개 허용</span><input type="checkbox" name="revealEnabled" defaultChecked={settings.reveal_enabled} /></label><button className="min-h-12 w-full rounded-[14px] bg-[var(--ub-color-brand)] font-semibold text-white">저장</button>{message && <p className="text-[13px] text-[var(--ub-color-brand)]">{message}</p>}</form>
}
