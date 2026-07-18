type AppRouteLoadingProps = {
  compact?: boolean
}

export function AppRouteLoading({ compact = false }: AppRouteLoadingProps) {
  return (
    <main
      className="ub-app-surface min-h-[100dvh] overflow-hidden px-4 pb-[72px] pt-[calc(env(safe-area-inset-top)+12px)] text-white"
      aria-label="화면 불러오는 중"
      aria-busy="true"
    >
      <div className="mx-auto max-w-[430px]">
        <header className="flex min-h-[56px] items-center justify-between">
          <span className="ub-loading-shimmer block h-10 w-10 rounded-[13px]" />
          <div className="flex gap-2">
            <span className="ub-loading-shimmer block h-10 w-10 rounded-full" />
            <span className="ub-loading-shimmer block h-10 w-10 rounded-full" />
          </div>
        </header>

        <section className="mt-5 space-y-3">
          {!compact && <span className="ub-loading-shimmer block h-3 w-20 rounded-full" />}
          <div className="ub-loading-shimmer h-[112px] rounded-[24px]" />
          <div className="flex gap-2">
            <span className="ub-loading-shimmer h-8 flex-1 rounded-[12px]" />
            <span className="ub-loading-shimmer h-8 flex-1 rounded-[12px]" />
          </div>
          <div className="ub-loading-shimmer h-[184px] rounded-[26px]" />
          <div className="ub-loading-shimmer h-[150px] rounded-[26px] opacity-70" />
        </section>
      </div>
    </main>
  )
}
