'use client'

import { useEffect, useState } from 'react'

function decodeBase64Url(value: string) {
  const padded = `${value}${'='.repeat((4 - value.length % 4) % 4)}`.replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(padded)
  return Uint8Array.from(raw, (character) => character.charCodeAt(0))
}

export default function WebPushControl() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const available = Boolean(publicKey && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)
    const detectionTimer = window.setTimeout(() => setSupported(available), 0)
    if (!available) return () => window.clearTimeout(detectionTimer)

    void navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setEnabled(Boolean(subscription)))
      .catch(() => undefined)
    return () => window.clearTimeout(detectionTimer)
  }, [publicKey])

  async function toggle() {
    if (!supported || !publicKey || pending) return
    setPending(true)
    setMessage('')

    try {
      const registration = await navigator.serviceWorker.ready
      const current = await registration.pushManager.getSubscription()

      if (current) {
        const response = await fetch('/api/push/web', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: current.endpoint }),
        })
        if (!response.ok) throw new Error('알림을 해제하지 못했습니다.')
        await current.unsubscribe()
        setEnabled(false)
        setMessage('이 기기의 푸시 알림을 껐습니다.')
        return
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') throw new Error('iPhone 설정에서 언블라인드 알림을 허용해주세요.')

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeBase64Url(publicKey),
      })
      const response = await fetch('/api/push/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        await subscription.unsubscribe()
        throw new Error(result?.error ?? '알림을 등록하지 못했습니다.')
      }

      setEnabled(true)
      setMessage('이 기기의 푸시 알림을 켰습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '알림 설정을 변경하지 못했습니다.')
    } finally {
      setPending(false)
    }
  }

  if (!supported) return null

  return (
    <div className="mb-3 flex min-h-[52px] items-center justify-between gap-3 rounded-[18px] bg-[var(--ub-surface-card-strong)] px-4 py-3 text-[var(--ub-text-primary)] shadow-sm">
      <div className="min-w-0">
        <p className="text-[14px] font-bold">이 기기 푸시 알림</p>
        <p className="mt-0.5 text-[11px] text-[var(--ub-text-secondary)]" role="status">{message || (enabled ? '새 댓글과 소식을 바로 받습니다.' : '홈 화면에 설치한 앱에서 사용할 수 있습니다.')}</p>
      </div>
      <button type="button" onClick={toggle} disabled={pending} className={`min-h-9 shrink-0 rounded-full px-3 text-[12px] font-bold ${enabled ? 'bg-[var(--ub-surface-muted)] text-[var(--ub-text-secondary)]' : 'bg-[var(--ub-color-brand)] text-white'} disabled:opacity-55`}>
        {pending ? '처리 중…' : enabled ? '끄기' : '켜기'}
      </button>
    </div>
  )
}
