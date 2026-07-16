export default function AdminLoading() {
  return (
    <main className="admin-ios-surface min-h-screen px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-6">
      <section className="mx-auto max-w-[520px] animate-pulse">
        <div className="mb-8">
          <div className="h-4 w-24 rounded-full bg-[var(--admin-card-secondary)]" />
          <div className="mt-3 h-9 w-48 rounded-[12px] bg-[var(--admin-card)]" />
          <div className="mt-3 h-5 w-full max-w-sm rounded-full bg-[var(--admin-card-secondary)]" />
        </div>

        <div className="admin-ios-card mb-7 h-[54px] rounded-[16px]" />

        <div className="mb-7">
          <div className="mb-2 ml-4 h-4 w-20 rounded-full bg-[var(--admin-card-secondary)]" />
          <div className="admin-ios-card overflow-hidden rounded-[22px]">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="flex min-h-[76px] items-center gap-3 border-b border-[var(--admin-separator)] px-4 last:border-0"
              >
                <div className="h-11 w-11 rounded-[14px] bg-[var(--admin-accent-soft)]" />
                <div className="flex-1">
                  <div className="h-4 w-32 rounded-full bg-[var(--admin-card-secondary)]" />
                  <div className="mt-2 h-3 w-52 max-w-full rounded-full bg-[var(--admin-card-secondary)]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="admin-ios-card h-[92px] rounded-[20px]"
            />
          ))}
        </div>
      </section>
    </main>
  )
}
