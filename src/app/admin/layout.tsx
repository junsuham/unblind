import Link from 'next/link'

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen bg-[#ff4b00]">
      <header className="sticky top-0 z-50 bg-[#ff4b00] pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex min-h-[58px] max-w-[430px] items-center justify-center px-4">
          <Link
            href="/"
            aria-label="언블라인드 홈으로 이동"
            className="flex min-h-11 items-center justify-center active:scale-[0.99]"
          >
            <img
              src="/unblind-logo.png"
              alt="UNBLIND"
              className="block h-auto w-[210px]"
            />
          </Link>
        </div>
      </header>

      {children}
    </div>
  )
}
