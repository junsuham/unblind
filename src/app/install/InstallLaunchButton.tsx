'use client'

import { OPEN_INSTALL_EVENT } from '@/app/components/PwaLifecycle'

export function InstallLaunchButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_INSTALL_EVENT))}
      className="mt-5 min-h-[56px] w-full rounded-[18px] bg-[var(--ub-surface-card-strong)] px-5 text-[17px] font-bold text-[var(--ub-color-brand)] shadow-[var(--ub-shadow-card)] active:scale-[0.99]"
    >
      앱 설치 시작
    </button>
  )
}
