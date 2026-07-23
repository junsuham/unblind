'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Preferences = { push_enabled: boolean; comments_enabled: boolean; reactions_enabled: boolean; manitto_enabled: boolean; system_enabled: boolean; quiet_start: string | null; quiet_end: string | null }
type Block = { blocked_user_id: string; created_at: string }
type Report = { id: string; status: string; created_at: string; resolution_note: string | null }

const labels: { key: keyof Pick<Preferences, 'push_enabled' | 'comments_enabled' | 'reactions_enabled' | 'manitto_enabled' | 'system_enabled'>; label: string }[] = [
  { key: 'push_enabled', label: '휴대폰 푸시 알림' }, { key: 'comments_enabled', label: '댓글과 답글' }, { key: 'reactions_enabled', label: '공감과 기도' }, { key: 'manitto_enabled', label: '마니또 소식' }, { key: 'system_enabled', label: '운영 안내' },
]

export default function AccountSettings() {
  const router = useRouter()
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [message, setMessage] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetch('/api/account/settings').then((response) => response.json()).then((result) => { setPreferences(result.preferences); setBlocks(result.blocks ?? []); setReports(result.reports ?? []) }).catch(() => setMessage('계정 설정을 불러오지 못했습니다.')) }, [])

  async function save() {
    if (!preferences) return
    const response = await fetch('/api/account/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(preferences) })
    const result = await response.json().catch(() => null)
    setMessage(response.ok ? '알림 설정을 저장했습니다.' : result?.error ?? '저장하지 못했습니다.')
  }

  async function unblock(blockedUserId: string) {
    const response = await fetch('/api/safety/blocks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blockedUserId }) })
    if (response.ok) setBlocks((current) => current.filter((item) => item.blocked_user_id !== blockedUserId))
  }

  async function deleteAccount() {
    if (confirmation !== '탈퇴' || !window.confirm('계정을 영구적으로 삭제할까요?')) return
    setDeleting(true)
    const response = await fetch('/api/account', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmation }) })
    const result = await response.json().catch(() => null)
    if (!response.ok) { setMessage(result?.error ?? '계정을 삭제하지 못했습니다.'); setDeleting(false); return }
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (!preferences) return <p className="rounded-[18px] bg-[var(--ub-surface-card-strong)] p-8 text-center text-[14px] text-[var(--ub-text-secondary)]">설정을 불러오는 중…</p>
  return <div className="space-y-5 text-[var(--ub-text-primary)]">
    <section className="overflow-hidden rounded-[20px] bg-[var(--ub-surface-card-strong)] shadow-sm"><h2 className="px-4 pt-4 text-[17px] font-bold">알림 설정</h2>{labels.map((item) => <label key={item.key} className="flex min-h-[52px] items-center justify-between border-b border-[var(--ub-separator)] px-4 last:border-b-0"><span className="text-[14px]">{item.label}</span><input type="checkbox" checked={preferences[item.key]} onChange={(event) => setPreferences({ ...preferences, [item.key]: event.target.checked })} className="h-5 w-5 accent-[var(--ub-color-brand)]" /></label>)}<div className="flex items-center gap-2 p-4"><input value={preferences.quiet_start?.slice(0, 5) ?? ''} onChange={(event) => setPreferences({ ...preferences, quiet_start: event.target.value || null })} placeholder="22:00" className="min-h-11 min-w-0 flex-1 rounded-[14px] bg-[var(--ub-surface-muted)] px-3 text-center" /><span>~</span><input value={preferences.quiet_end?.slice(0, 5) ?? ''} onChange={(event) => setPreferences({ ...preferences, quiet_end: event.target.value || null })} placeholder="08:00" className="min-h-11 min-w-0 flex-1 rounded-[14px] bg-[var(--ub-surface-muted)] px-3 text-center" /></div><button onClick={save} className="m-4 mt-0 min-h-12 w-[calc(100%-2rem)] rounded-[16px] bg-[var(--ub-color-brand)] font-bold text-white">설정 저장</button></section>
    <section className="rounded-[20px] bg-[var(--ub-surface-card-strong)] p-4 shadow-sm"><h2 className="text-[17px] font-bold">차단한 사용자 · {blocks.length}</h2>{blocks.map((item, index) => <div key={item.blocked_user_id} className="mt-3 flex items-center justify-between border-t border-[var(--ub-separator)] pt-3"><span className="text-[13px] text-[var(--ub-text-secondary)]">차단한 사용자 {blocks.length - index}</span><button onClick={() => unblock(item.blocked_user_id)} className="text-[13px] font-semibold text-[var(--ub-color-brand)]">차단 해제</button></div>)}{!blocks.length && <p className="mt-2 text-[13px] text-[var(--ub-text-secondary)]">차단한 사용자가 없습니다.</p>}</section>
    <section className="rounded-[20px] bg-[var(--ub-surface-card-strong)] p-4 shadow-sm"><h2 className="text-[17px] font-bold">내 신고 처리 현황</h2>{reports.slice(0, 5).map((item) => <div key={item.id} className="mt-3 border-t border-[var(--ub-separator)] pt-3 text-[13px]"><b>{item.status === 'pending' ? '확인 중' : item.status === 'reviewed' ? '처리 완료' : '문제 없음'}</b><p className="mt-1 text-[var(--ub-text-secondary)]">{new Date(item.created_at).toLocaleDateString('ko-KR')}{item.resolution_note ? ` · ${item.resolution_note}` : ''}</p></div>)}{!reports.length && <p className="mt-2 text-[13px] text-[var(--ub-text-secondary)]">접수한 신고가 없습니다.</p>}</section>
    <section className="overflow-hidden rounded-[20px] bg-[var(--ub-surface-card-strong)] shadow-sm">{[['community','커뮤니티 운영정책'],['privacy','개인정보처리방침'],['terms','이용약관']].map(([type,label]) => <Link key={type} href={`/policies/${type}`} className="flex min-h-[52px] items-center justify-between border-b border-[var(--ub-separator)] px-4 text-[14px] font-semibold text-[var(--ub-color-brand)] last:border-b-0">{label}<span>›</span></Link>)}</section>
    <section className="rounded-[20px] bg-[var(--ub-surface-card-strong)] p-4 shadow-sm"><h2 className="text-[17px] font-bold text-[var(--ub-danger-text)]">계정 삭제</h2><p className="mt-2 text-[13px] leading-5 text-[var(--ub-text-secondary)]">로그인과 프로필 정보는 삭제되고, 작성한 글과 댓글은 작성자를 알 수 없는 상태로 남습니다.</p><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="탈퇴 입력" className="mt-3 min-h-12 w-full rounded-[14px] bg-[var(--ub-surface-muted)] px-4" /><button disabled={deleting || confirmation !== '탈퇴'} onClick={deleteAccount} className="mt-2 min-h-12 w-full rounded-[14px] bg-[var(--ub-danger-soft)] font-bold text-[var(--ub-danger-text)] disabled:opacity-40">{deleting ? '삭제 중…' : '계정 영구 삭제'}</button></section>
    {message && <p className="rounded-[16px] bg-[var(--ub-surface-card)] p-4 text-[13px] text-[var(--ub-color-brand)]">{message}</p>}
  </div>
}
