'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AdminHeader,
  AdminNotice,
  AdminPageShell,
} from '../components/AdminIOS'

export default function AdminLoginPage() {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setIsSubmitting(true)
    setErrorMessage('')

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    })

    setIsSubmitting(false)

    if (!response.ok) {
      const result = await response.json().catch(() => null)
      setErrorMessage(result?.error ?? '로그인에 실패했습니다.')
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <AdminPageShell>
        <AdminHeader
          title="관리자 로그인"
          description="신고 처리, 참여자 승인, 게시글 관리를 위한 운영자 화면입니다."
        />

        <Link
          href="/login?next=/admin"
          className="admin-ios-card mb-4 flex min-h-[52px] w-full items-center justify-center rounded-[16px] px-5 text-[17px] font-semibold text-[var(--admin-text)] active:opacity-70"
        >
          Google 관리자 계정으로 로그인
        </Link>

        <form
          onSubmit={handleSubmit}
          className="admin-ios-card rounded-[22px] p-5 text-[var(--admin-text)]"
        >
          <label className="mb-2 block text-[15px] font-semibold text-[var(--admin-text)]">
            관리자 비밀번호
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-[52px] w-full rounded-[16px] border border-[var(--admin-border)] bg-[var(--admin-card-secondary)] px-4 text-[17px] text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)]"
            placeholder="ADMIN_PASSWORD"
          />

          {errorMessage && (
            <div className="mt-4 rounded-[18px] border border-[var(--admin-danger-soft)] bg-[var(--admin-danger-soft)] p-4 text-[15px] leading-[21px] text-[var(--admin-danger)]">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 flex min-h-[52px] w-full items-center justify-center rounded-[16px] bg-[var(--admin-accent)] px-5 text-[17px] font-semibold text-white active:opacity-70 disabled:opacity-40"
          >
            {isSubmitting ? '로그인 중...' : '관리자 로그인'}
          </button>
        </form>

        <div className="mt-5">
          <AdminNotice title="운영자 주의" tone="warning">
            관리자 화면에서는 작성자와 신고자 정보를 확인할 수 있습니다.
            신고 대응과 안전 운영 목적에 한해 사용해주세요.
          </AdminNotice>
        </div>
    </AdminPageShell>
  )
}
