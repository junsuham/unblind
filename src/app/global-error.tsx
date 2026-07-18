'use client'

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, background: '#fc5230', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
        <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <section style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: 26 }}>앱을 다시 불러올게요</h1>
            <p style={{ margin: '12px 0 24px', fontSize: 15, lineHeight: 1.6, opacity: 0.82 }}>
              일시적인 연결 오류가 발생했습니다. 작성 중인 내용이 없다면 아래 버튼을 눌러주세요.
            </p>
            <button
              type="button"
              onClick={unstable_retry}
              style={{ width: '100%', minHeight: 52, border: 0, borderRadius: 16, background: '#fff', color: '#fc5230', fontSize: 17, fontWeight: 700 }}
            >
              다시 시도
            </button>
          </section>
        </main>
      </body>
    </html>
  )
}
