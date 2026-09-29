'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { PasskeyListItem } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const DRAFT_STORAGE_KEY = 'unblind-post-draft-v1'
const INVITE_TEXT = '익명으로 기도와 고민을 나누는 언블라인드에 초대합니다. https://unbd.vercel.app'

type ContactRecord = { name?: string[]; email?: string[]; tel?: string[] }
type ContactsNavigator = Navigator & {
  contacts?: {
    getProperties: () => Promise<string[]>
    select: (properties: string[], options: { multiple: boolean }) => Promise<ContactRecord[]>
  }
}
type FilePickerWindow = Window & {
  showOpenFilePicker?: (options?: object) => Promise<Array<{ getFile: () => Promise<File> }>>
  showSaveFilePicker?: (options?: object) => Promise<{
    createWritable: () => Promise<{ write: (contents: Blob | string) => Promise<void>; close: () => Promise<void> }>
  }>
}

function capabilityLabel(available: boolean) {
  return available ? '사용 가능' : '이 기기에서는 대체 방식 사용'
}

export default function DeviceIntegrationSettings() {
  const importInputRef = useRef<HTMLInputElement>(null)
  const [passkeys, setPasskeys] = useState<PasskeyListItem[]>([])
  const [passkeySupported, setPasskeySupported] = useState(false)
  const [contactsSupported, setContactsSupported] = useState(false)
  const [fileAccessSupported, setFileAccessSupported] = useState(false)
  const [shareSupported, setShareSupported] = useState(false)
  const [pending, setPending] = useState('')
  const [message, setMessage] = useState('')
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPasskeySupported(Boolean(window.PublicKeyCredential && window.isSecureContext))
      setContactsSupported(Boolean((navigator as ContactsNavigator).contacts && window.isSecureContext))
      setFileAccessSupported(Boolean((window as FilePickerWindow).showOpenFilePicker && (window as FilePickerWindow).showSaveFilePicker))
      setShareSupported(typeof navigator.share === 'function')
    }, 0)

    void supabase.auth.passkey.list().then(({ data }) => setPasskeys(data ?? [])).catch(() => undefined)
    return () => window.clearTimeout(timer)
  }, [])

  async function registerPasskey() {
    setPending('passkey')
    setMessage('')
    try {
      const { error } = await supabase.auth.registerPasskey()
      if (error) {
        setMessage(error.code === 'passkey_disabled'
          ? '패스키 서버 설정이 아직 활성화되지 않았습니다.'
          : 'Face ID·지문 등록을 완료하지 못했습니다.')
      } else {
        const { data } = await supabase.auth.passkey.list()
        setPasskeys(data ?? [])
        setMessage('이 기기의 패스키를 등록했습니다. 다음 로그인부터 사용할 수 있습니다.')
      }
    } catch {
      setMessage('Face ID·지문 등록을 완료하지 못했습니다.')
    } finally {
      setPending('')
    }
  }

  async function removePasskey(passkeyId: string) {
    setPending(passkeyId)
    const { error } = await supabase.auth.passkey.delete({ passkeyId })
    if (error) setMessage('패스키를 삭제하지 못했습니다.')
    else {
      setPasskeys((current) => current.filter((item) => item.id !== passkeyId))
      setMessage('패스키를 삭제했습니다.')
    }
    setPending('')
  }

  async function shareApp() {
    if (!navigator.share) {
      try {
        await navigator.clipboard.writeText('https://unbd.vercel.app')
        setMessage('초대 링크를 복사했습니다.')
      } catch {
        setMessage('초대 링크를 복사하지 못했습니다. https://unbd.vercel.app')
      }
      return
    }
    try {
      await navigator.share({ title: '언블라인드', text: INVITE_TEXT, url: 'https://unbd.vercel.app' })
    } catch {
      // Closing the native share sheet is not an error that needs a warning.
    }
  }

  async function inviteFromContacts() {
    const contacts = (navigator as ContactsNavigator).contacts
    if (!contacts) {
      await shareApp()
      return
    }
    setPending('contacts')
    try {
      const supported = await contacts.getProperties()
      const properties = ['name', 'email', 'tel'].filter((property) => supported.includes(property))
      const selected = await contacts.select(properties, { multiple: false })
      if (selected.length && navigator.share) {
        const name = selected[0].name?.[0]
        await navigator.share({ title: '언블라인드 초대', text: name ? `${name}님, ${INVITE_TEXT}` : INVITE_TEXT })
      }
      setMessage('연락처 정보는 언블라인드 서버에 저장되지 않습니다.')
    } catch {
      setMessage('연락처 선택을 취소했거나 이 기기에서 사용할 수 없습니다.')
    } finally {
      setPending('')
    }
  }

  function findCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage('이 기기에서는 현재 위치를 사용할 수 없습니다.')
      return
    }
    setPending('location')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ latitude: coords.latitude, longitude: coords.longitude })
        setMessage('현재 위치를 확인했습니다. 위치는 서버에 저장되지 않습니다.')
        setPending('')
      },
      () => {
        setMessage('위치 권한이 없거나 현재 위치를 확인하지 못했습니다.')
        setPending('')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }

  function getDraftText() {
    const stored = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    return stored ?? JSON.stringify({ board: '', title: '', content: '', urgentPrayer: false, savedAt: Date.now() }, null, 2)
  }

  async function exportDraft() {
    setPending('export')
    try {
      const text = getDraftText()
      const picker = (window as FilePickerWindow).showSaveFilePicker
      if (picker) {
        const handle = await picker({ suggestedName: 'unblind-draft.json', types: [{ description: '언블라인드 초안', accept: { 'application/json': ['.json'] } }] })
        const writable = await handle.createWritable()
        await writable.write(text)
        await writable.close()
      } else {
        const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'unblind-draft.json'
        anchor.click()
        URL.revokeObjectURL(url)
      }
      setMessage('작성 초안을 기기에 저장했습니다.')
    } catch {
      setMessage('파일 저장을 취소했거나 완료하지 못했습니다.')
    } finally {
      setPending('')
    }
  }

  async function importDraftFile(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as Record<string, unknown>
      if (typeof parsed.title !== 'string' || typeof parsed.content !== 'string') throw new Error('invalid draft')
      const safeDraft = {
        board: ['prayer', 'faith', 'daily'].includes(String(parsed.board)) ? parsed.board : '',
        title: parsed.title.slice(0, 80),
        content: parsed.content.slice(0, 2000),
        urgentPrayer: parsed.urgentPrayer === true,
        savedAt: Date.now(),
      }
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(safeDraft))
      setMessage('초안을 불러왔습니다. 글쓰기에서 이어서 작성할 수 있습니다.')
    } catch {
      setMessage('언블라인드 초안 파일을 확인하지 못했습니다.')
    }
  }

  async function openDraft() {
    const picker = (window as FilePickerWindow).showOpenFilePicker
    if (!picker) {
      importInputRef.current?.click()
      return
    }
    setPending('import')
    try {
      const [handle] = await picker({ multiple: false, types: [{ description: '언블라인드 초안', accept: { 'application/json': ['.json'] } }] })
      if (handle) await importDraftFile(await handle.getFile())
    } catch {
      setMessage('파일 열기를 취소했거나 완료하지 못했습니다.')
    } finally {
      setPending('')
    }
  }

  return (
    <section className="overflow-hidden rounded-[20px] bg-[var(--ub-surface-card-strong)] shadow-sm">
      <div className="px-4 pb-3 pt-4">
        <h2 className="text-[17px] font-bold">기기 연동</h2>
        <p className="mt-1 text-[12px] leading-[18px] text-[var(--ub-text-secondary)]">지원되는 기능만 표시되며 민감한 연락처·위치는 서버에 저장하지 않습니다.</p>
      </div>

      <div className="border-t border-[var(--ub-separator)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-[14px] font-semibold">Face ID·지문 패스키</p><p className="mt-1 text-[11px] text-[var(--ub-text-secondary)]">{capabilityLabel(passkeySupported)} · 등록 {passkeys.length}개</p></div>
          <button type="button" onClick={registerPasskey} disabled={!passkeySupported || Boolean(pending)} className="min-h-11 rounded-full bg-[var(--ub-color-brand)] px-3 text-[12px] font-bold text-white disabled:opacity-40">{pending === 'passkey' ? '등록 중…' : '패스키 추가'}</button>
        </div>
        {passkeys.map((passkey) => <div key={passkey.id} className="mt-2 flex min-h-11 items-center justify-between rounded-[13px] bg-[var(--ub-surface-muted)] px-3"><span className="truncate text-[12px] text-[var(--ub-text-secondary)]">{passkey.friendly_name || '등록된 패스키'}</span><button type="button" disabled={pending === passkey.id} onClick={() => void removePasskey(passkey.id)} className="min-h-11 px-2 text-[12px] font-semibold text-[var(--ub-danger-text)]">삭제</button></div>)}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-[var(--ub-separator)] p-4">
        <button type="button" onClick={() => void shareApp()} className="min-h-[52px] rounded-[15px] bg-[var(--ub-surface-muted)] px-3 text-[13px] font-semibold">{shareSupported ? 'OS 공유하기' : '초대 링크 복사'}</button>
        <button type="button" onClick={() => void inviteFromContacts()} disabled={pending === 'contacts'} className="min-h-[52px] rounded-[15px] bg-[var(--ub-surface-muted)] px-3 text-[13px] font-semibold">{contactsSupported ? '연락처에서 초대' : '초대문 공유'}</button>
        <button type="button" onClick={findCurrentLocation} disabled={pending === 'location'} className="min-h-[52px] rounded-[15px] bg-[var(--ub-surface-muted)] px-3 text-[13px] font-semibold">{pending === 'location' ? '위치 확인 중…' : '현재 위치 확인'}</button>
        {location ? <a href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=16/${location.latitude}/${location.longitude}`} target="_blank" rel="noopener noreferrer" className="flex min-h-[52px] items-center justify-center rounded-[15px] bg-[var(--ub-surface-brand-soft)] px-3 text-[13px] font-semibold text-[var(--ub-color-brand)]">지도에서 보기</a> : <Link href="/notifications" className="flex min-h-[52px] items-center justify-center rounded-[15px] bg-[var(--ub-surface-muted)] px-3 text-[13px] font-semibold">푸시 알림 관리</Link>}
      </div>

      <div className="border-t border-[var(--ub-separator)] p-4">
        <div className="flex items-center justify-between gap-3"><div><p className="text-[14px] font-semibold">글쓰기 초안 파일</p><p className="mt-1 text-[11px] text-[var(--ub-text-secondary)]">{capabilityLabel(fileAccessSupported)}</p></div><div className="flex gap-1"><button type="button" onClick={() => void openDraft()} disabled={Boolean(pending)} className="min-h-11 rounded-full bg-[var(--ub-surface-muted)] px-3 text-[12px] font-semibold">열기</button><button type="button" onClick={() => void exportDraft()} disabled={Boolean(pending)} className="min-h-11 rounded-full bg-[var(--ub-surface-brand-soft)] px-3 text-[12px] font-semibold text-[var(--ub-color-brand)]">저장</button></div></div>
        <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importDraftFile(file); event.target.value = '' }} />
      </div>

      {message && <p role="status" className="border-t border-[var(--ub-separator)] px-4 py-3 text-[12px] leading-[18px] text-[var(--ub-color-brand)]">{message}</p>}
    </section>
  )
}
