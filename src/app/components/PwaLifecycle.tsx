'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Emoji3D } from '@/app/components/ui/Emoji3D'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type DevicePlatform = 'ios' | 'android' | 'other'
type InstallState = 'ready' | 'installing' | 'dismissed' | 'installed'
type UpdateState = 'ready' | 'applying' | 'failed'

const DISMISS_KEY = 'unblind-pwa-install-dismissed-at'
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000
export const OPEN_INSTALL_EVENT = 'unblind:open-install'

function isStandalone() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  )
}

function getPlatform(): DevicePlatform {
  const agent = navigator.userAgent.toLowerCase()
  const ios =
    /iphone|ipad|ipod/.test(agent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  if (ios) return 'ios'
  if (/android/.test(agent)) return 'android'
  return 'other'
}

function wasRecentlyDismissed() {
  try {
    const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0)
    return Date.now() - dismissedAt < DISMISS_FOR_MS
  } catch {
    return false
  }
}

function platformLabel(platform: DevicePlatform) {
  if (platform === 'ios') return 'iPhone용'
  if (platform === 'android') return 'Android용'
  return '웹 앱'
}

function getWorkerVersion(worker: ServiceWorker | null) {
  if (!worker) return Promise.resolve<string | null>(null)

  return new Promise<string | null>((resolve) => {
    const channel = new MessageChannel()
    const timer = window.setTimeout(() => resolve(null), 700)

    channel.port1.onmessage = (event: MessageEvent<{ version?: unknown }>) => {
      window.clearTimeout(timer)
      const version = event.data?.version
      resolve(typeof version === 'string' ? version : null)
    }

    try {
      worker.postMessage({ type: 'GET_VERSION' }, [channel.port2])
    } catch {
      window.clearTimeout(timer)
      resolve(null)
    }
  })
}

export function PwaLifecycle() {
  const pathname = usePathname()
  const [platform, setPlatform] = useState<DevicePlatform>('other')
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [offerVisible, setOfferVisible] = useState(false)
  const [flowOpen, setFlowOpen] = useState(false)
  const [installState, setInstallState] = useState<InstallState>('ready')
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [updateState, setUpdateState] = useState<UpdateState>('ready')
  const reloadOnControllerChange = useRef(false)
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const updateReloadTimer = useRef<number | null>(null)
  const pathnameRef = useRef(pathname)
  const lastUpdateCheck = useRef(0)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const revealUpdateIfNeeded = async (
      registration: ServiceWorkerRegistration,
      worker: ServiceWorker,
    ) => {
      if (!navigator.serviceWorker.controller || registration.waiting !== worker || worker.state !== 'installed') {
        return
      }

      const [activeVersion, waitingVersion] = await Promise.all([
        getWorkerVersion(registration.active),
        getWorkerVersion(worker),
      ])

      if (registration.waiting !== worker || worker.state !== 'installed') return
      if (activeVersion && waitingVersion && activeVersion === waitingVersion) {
        setWaitingWorker(null)
        return
      }

      setUpdateState('ready')
      setWaitingWorker(worker)
    }

    const handleControllerChange = () => {
      setWaitingWorker(null)
      setUpdateState('ready')
      const safeToReload = pathnameRef.current === '/' || pathnameRef.current === '/login'
      if (!reloadOnControllerChange.current && !safeToReload) return
      reloadOnControllerChange.current = false
      if (updateReloadTimer.current !== null) {
        window.clearTimeout(updateReloadTimer.current)
        updateReloadTimer.current = null
      }
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    const requestUpdateCheck = () => {
      const registration = registrationRef.current
      const now = Date.now()
      if (!registration || now - lastUpdateCheck.current < 5 * 60 * 1000) return
      lastUpdateCheck.current = now
      void registration.update().catch(() => undefined)
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestUpdateCheck()
    }
    const handlePageShow = () => requestUpdateCheck()
    const handleOnline = () => requestUpdateCheck()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('online', handleOnline)

    void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then((registration) => {
      registrationRef.current = registration
      lastUpdateCheck.current = Date.now()
      if (registration.waiting) {
        void revealUpdateIfNeeded(registration, registration.waiting)
      }

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        if (!worker) return

        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            void revealUpdateIfNeeded(registration, worker)
          } else if (worker.state === 'activated' || worker.state === 'redundant') {
            setWaitingWorker((current) => current === worker ? null : current)
          }
        })
      })

      void registration.update()
    }).catch(() => {
      // Installation remains optional when a browser blocks service workers.
    })

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('online', handleOnline)
      if (updateReloadTimer.current !== null) window.clearTimeout(updateReloadTimer.current)
    }
  }, [])

  useEffect(() => {
    const currentPlatform = getPlatform()
    const installed = isStandalone()

    const detectionTimer = window.setTimeout(() => {
      setPlatform(currentPlatform)
      if (installed) setInstallState('installed')
    }, 0)

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
      if (!installed && !wasRecentlyDismissed()) setOfferVisible(true)
    }

    const handleInstalled = () => {
      setInstallState('installed')
      setInstallPrompt(null)
      setOfferVisible(false)
      setFlowOpen(true)
    }

    const handleOpenInstall = () => {
      setFlowOpen(true)
      setOfferVisible(false)
    }

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    window.addEventListener(OPEN_INSTALL_EVENT, handleOpenInstall)

    const offerTimer = window.setTimeout(() => {
      if (!installed && currentPlatform === 'ios' && !wasRecentlyDismissed()) {
        setOfferVisible(true)
      }
    }, 900)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      window.removeEventListener(OPEN_INSTALL_EVENT, handleOpenInstall)
      window.clearTimeout(detectionTimer)
      window.clearTimeout(offerTimer)
    }
  }, [])

  useEffect(() => {
    if (!flowOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFlowOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [flowOpen])

  function dismissInstallOffer() {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // Dismiss for this render even when persistent storage is unavailable.
    }
    setOfferVisible(false)
    setFlowOpen(false)
  }

  async function installOnAndroid() {
    if (!installPrompt) {
      setInstallState('dismissed')
      return
    }

    setInstallState('installing')
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    setInstallPrompt(null)

    if (choice.outcome === 'dismissed') {
      setInstallState('dismissed')
      return
    }

    setInstallState('installed')
  }

  async function applyUpdate() {
    if (updateState === 'applying') return

    setUpdateState('applying')
    reloadOnControllerChange.current = true

    try {
      const registration = registrationRef.current ?? await navigator.serviceWorker.getRegistration('/')
      const worker = registration?.waiting ?? waitingWorker

      // The worker may already have activated while the notice was visible.
      // Reloading is then sufficient and avoids leaving an inert update button.
      if (!worker || worker.state !== 'installed') {
        window.location.reload()
        return
      }

      worker.postMessage({ type: 'SKIP_WAITING' })

      // iOS standalone mode can occasionally miss controllerchange. Never leave
      // the user stuck on the update notice when that browser event is omitted.
      updateReloadTimer.current = window.setTimeout(() => {
        window.location.reload()
      }, 1800)
    } catch {
      reloadOnControllerChange.current = false
      setUpdateState('failed')
    }
  }

  if (pathname === '/login') return null

  if (waitingWorker) {
    return (
      <aside className="pointer-events-auto fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-[1000] mx-auto max-w-[430px] rounded-[22px] border border-[var(--ub-glass-border)] bg-[var(--ub-surface-card-strong)] p-4 text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-glass)]" role="status" aria-live="polite">
        <p className="ios-title">새 버전이 준비되었습니다</p>
        <p className="mt-1 ios-secondary">
          {updateState === 'failed' ? '업데이트 전환이 지연되었습니다. 다시 불러와 적용해주세요.' : '앱을 닫지 않고 바로 업데이트할 수 있습니다.'}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void applyUpdate()}
            disabled={updateState === 'applying'}
            className="pointer-events-auto min-h-11 flex-1 touch-manipulation rounded-[14px] bg-[var(--ub-color-brand)] px-4 text-[15px] font-semibold text-white disabled:opacity-70"
          >
            {updateState === 'applying' ? '업데이트 적용 중…' : updateState === 'failed' ? '다시 불러오기' : '업데이트'}
          </button>
          <button type="button" onClick={() => setWaitingWorker(null)} disabled={updateState === 'applying'} className="pointer-events-auto min-h-11 touch-manipulation rounded-[14px] px-4 text-[15px] font-semibold text-[var(--ub-text-secondary)] disabled:opacity-50">나중에</button>
        </div>
      </aside>
    )
  }

  return (
    <>
      {offerVisible && !flowOpen && (
        <aside className="pwa-install-offer fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-[100] mx-auto max-w-[430px] overflow-hidden rounded-[24px] border border-white/60 bg-[var(--ub-surface-card-strong)] p-4 text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-glass)]" aria-label="언블라인드 앱 설치">
          <div className="flex items-center gap-3">
            <Image src="/icons/icon-192-v2.png" alt="" width={56} height={56} className="h-14 w-14 rounded-[14px] shadow-sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="ios-title">언블라인드</p>
                <span className="rounded-full bg-[var(--ub-surface-brand-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--ub-color-brand)]">{platformLabel(platform)}</span>
              </div>
              <p className="mt-1 ios-secondary">홈 화면에서 앱처럼 빠르게 시작하세요.</p>
            </div>
            <button type="button" onClick={dismissInstallOffer} aria-label="설치 안내 닫기" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[24px] text-[var(--ub-text-tertiary)]">×</button>
          </div>
          <button type="button" onClick={() => { setFlowOpen(true); setOfferVisible(false) }} className="mt-3 min-h-[50px] w-full rounded-[15px] bg-[var(--ub-color-brand)] px-5 text-[16px] font-bold text-white shadow-sm active:scale-[0.99]">
            앱 설치
          </button>
        </aside>
      )}

      {flowOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/55 px-3 pt-[max(24px,env(safe-area-inset-top))] backdrop-blur-sm sm:items-center" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFlowOpen(false) }}>
          <section className="pwa-install-sheet relative w-full max-w-[430px] overflow-hidden rounded-t-[34px] bg-[var(--ub-surface-card-strong)] px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3 text-[var(--ub-text-primary)] shadow-2xl sm:rounded-[34px]" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--ub-separator)]" />
            <button type="button" onClick={() => setFlowOpen(false)} aria-label="설치 화면 닫기" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ub-surface-muted)] text-[23px] text-[var(--ub-text-secondary)]">×</button>

            <div className="text-center">
              <div className="pwa-install-icon mx-auto w-fit rounded-[24px] bg-white p-1 shadow-[0_14px_38px_rgba(0,0,0,0.16)]">
                <Image src="/icons/icon-192-v2.png" alt="언블라인드" width={88} height={88} className="h-[88px] w-[88px] rounded-[21px]" priority />
              </div>
              <span className="mt-4 inline-flex rounded-full bg-[var(--ub-surface-brand-soft)] px-3 py-1 text-[12px] font-bold text-[var(--ub-color-brand)]">{platformLabel(platform)} 무료 설치</span>
              <h2 id="pwa-install-title" className="mt-3 text-[27px] font-bold leading-[34px] tracking-[-0.5px]">언블라인드 설치</h2>
              <p className="mx-auto mt-2 max-w-[320px] ios-secondary">주소창 없이 전체 화면으로 열고, 홈 화면에서 한 번에 접속할 수 있습니다.</p>
            </div>

            {installState === 'installed' ? (
              <div className="mt-6 rounded-[20px] bg-[var(--ub-success-soft)] p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ub-success-soft)]"><Emoji3D name="check" size={34} /></div>
                <p className="mt-3 ios-title">설치가 완료되었습니다</p>
                <p className="mt-1 ios-secondary">홈 화면에서 언블라인드 아이콘을 눌러 시작하세요.</p>
              </div>
            ) : platform === 'ios' ? (
              <div className="mt-6">
                <ol className="space-y-2.5" aria-label="아이폰 설치 단계">
                  <InstallStep number="1" title="Safari 공유 버튼 누르기" description="화면 아래의 네모와 위쪽 화살표 모양입니다." accent>
                    <span className="pwa-share-cue flex h-10 w-10 items-center justify-center rounded-[12px] border-2 border-[var(--ub-color-brand)] text-[23px] font-bold text-[var(--ub-color-brand)]">⇧</span>
                  </InstallStep>
                  <InstallStep number="2" title="홈 화면에 추가 선택" description="공유 메뉴를 아래로 조금 내리면 보입니다." />
                  <InstallStep number="3" title="오른쪽 위 추가 누르기" description="이제 일반 앱과 같은 아이콘이 생성됩니다." />
                </ol>
                <div className="mt-4 rounded-[16px] bg-[var(--ub-surface-brand-soft)] px-4 py-3 text-center text-[14px] font-semibold leading-5 text-[var(--ub-color-brand)]">
                  Apple 정책상 마지막 추가 동작은 사용자가 직접 눌러야 합니다.
                </div>
              </div>
            ) : (
              <div className="mt-6">
                {installState === 'dismissed' ? (
                  <div className="rounded-[18px] bg-[var(--ub-surface-muted)] p-4 text-center">
                    <p className="ios-title">설치창을 다시 열어주세요</p>
                    <p className="mt-1 ios-secondary">페이지를 새로고침한 뒤 설치 버튼을 누르거나 Chrome 메뉴에서 앱 설치를 선택하세요.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <InstallBenefit icon="⌂" label="홈 화면 실행" />
                    <InstallBenefit icon="□" label="전체 화면" />
                    <InstallBenefit icon="↻" label="자동 업데이트" />
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 space-y-2">
              {installState === 'installed' ? (
                <button type="button" onClick={() => setFlowOpen(false)} className="min-h-[52px] w-full rounded-[16px] bg-[var(--ub-color-brand)] px-5 text-[17px] font-bold text-white">확인</button>
              ) : platform === 'ios' ? (
                <button type="button" onClick={() => setFlowOpen(false)} className="min-h-[52px] w-full rounded-[16px] bg-[var(--ub-color-brand)] px-5 text-[17px] font-bold text-white">설치 방법 확인했어요</button>
              ) : installState === 'dismissed' ? (
                <button type="button" onClick={() => window.location.reload()} className="min-h-[52px] w-full rounded-[16px] bg-[var(--ub-color-brand)] px-5 text-[17px] font-bold text-white">새로고침 후 다시 설치</button>
              ) : (
                <button type="button" onClick={installOnAndroid} disabled={installState === 'installing'} className="min-h-[52px] w-full rounded-[16px] bg-[var(--ub-color-brand)] px-5 text-[17px] font-bold text-white disabled:opacity-60">
                  {installState === 'installing' ? '설치창 여는 중…' : '기기에 설치'}
                </button>
              )}

              <Link href="/install" onClick={() => setFlowOpen(false)} className="flex min-h-11 items-center justify-center text-[14px] font-semibold text-[var(--ub-text-secondary)]">설치 도움말 보기</Link>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

function InstallStep({ number, title, description, accent = false, children }: { number: string; title: string; description: string; accent?: boolean; children?: React.ReactNode }) {
  return (
    <li className={`flex min-h-[72px] items-center gap-3 rounded-[18px] border p-3 text-left ${accent ? 'border-[var(--ub-color-brand)] bg-[var(--ub-surface-brand-soft)]' : 'border-[var(--ub-separator)] bg-[var(--ub-surface-muted)]'}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ub-color-brand)] text-[14px] font-bold text-white">{number}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold leading-5">{title}</p>
        <p className="mt-0.5 text-[13px] leading-[18px] text-[var(--ub-text-secondary)]">{description}</p>
      </div>
      {children}
    </li>
  )
}

function InstallBenefit({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="rounded-[18px] bg-[var(--ub-surface-muted)] px-2 py-4">
      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-[13px] bg-[var(--ub-surface-brand-soft)] text-[22px] font-bold text-[var(--ub-color-brand)]">{icon}</span>
      <p className="mt-2 text-[12px] font-semibold leading-4">{label}</p>
    </div>
  )
}
