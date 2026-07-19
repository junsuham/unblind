import Link from 'next/link'
import {
  BUILDER_HOME_MODEL,
  BUILDER_HOME_PREVIEW_PATH,
  isBuilderConfigured,
} from '@/lib/builder'
import {
  BuilderHomeSection,
  type BuilderSearchParams,
} from '@/app/components/builder/BuilderHomeSection'

export const dynamic = 'force-dynamic'

type BuilderPreviewPageProps = {
  searchParams: Promise<BuilderSearchParams>
}

export default async function BuilderPreviewPage({
  searchParams,
}: BuilderPreviewPageProps) {
  const params = await searchParams

  return (
    <main className="min-h-dvh bg-[var(--ub-app-background)] px-4 py-8 text-[var(--ub-text-primary)]">
      <div className="mx-auto max-w-[430px]">
        <header className="mb-5 rounded-[22px] bg-[var(--ub-surface-card-strong)] px-5 py-4 shadow-[var(--ub-shadow-soft)]">
          <p className="text-[9px] font-bold tracking-[0.08em] text-[var(--ub-text-tertiary)]">
            BUILDER.IO PREVIEW
          </p>
          <h1 className="mt-1 text-[20px] font-extrabold">홈 편집 영역</h1>
          <p className="mt-1 text-[13px] leading-[20px] text-[var(--ub-text-secondary)]">
            이 영역만 홈 화면에 삽입되며 로그인, 게시글, 상단·하단바는 영향을 받지 않습니다.
          </p>
        </header>

        {isBuilderConfigured() ? (
          <BuilderHomeSection searchParams={params} />
        ) : (
          <section className="rounded-[22px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-card-strong)] p-5 shadow-[var(--ub-shadow-soft)]">
            <h2 className="text-[17px] font-bold">Builder 연결 키가 필요합니다</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-[13px] leading-[20px] text-[var(--ub-text-secondary)]">
              <li>Builder에서 Section 모델을 만듭니다: {BUILDER_HOME_MODEL}</li>
              <li>Preview URL을 {BUILDER_HOME_PREVIEW_PATH}로 설정합니다.</li>
              <li>NEXT_PUBLIC_BUILDER_API_KEY를 Vercel에 등록합니다.</li>
            </ol>
            <Link
              href="https://builder.io/content"
              className="mt-4 inline-flex min-h-10 items-center rounded-full bg-[var(--ub-color-brand)] px-4 text-[13px] font-bold text-white"
            >
              Builder.io 열기
            </Link>
          </section>
        )}
      </div>
    </main>
  )
}
