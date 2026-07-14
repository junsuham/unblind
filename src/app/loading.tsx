import {
  AppShell,
  GlassCard,
  PageHeader,
} from '@/app/components/ui/AppShell'

export default function LoadingPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="언블라인드"
        title="잠시만요"
        description="공간을 불러오고 있습니다."
      />

      <GlassCard>
        <div className="space-y-4">
          <div className="h-4 w-24 animate-pulse rounded-full bg-[var(--ub-surface-pressed)]" />
          <div className="h-6 w-3/4 animate-pulse rounded-full bg-[var(--ub-surface-pressed)]" />
          <div className="h-4 w-full animate-pulse rounded-full bg-[var(--ub-surface-pressed)]" />
          <div className="h-4 w-5/6 animate-pulse rounded-full bg-[var(--ub-surface-pressed)]" />
        </div>
      </GlassCard>

      <div className="mt-4 overflow-hidden rounded-[22px] bg-[var(--ub-surface-card-strong)] shadow-[var(--ub-shadow-soft)]">
        <div className="min-h-[64px] border-b border-[var(--ub-separator)] px-4 py-4">
          <div className="h-5 w-2/3 animate-pulse rounded-full bg-[var(--ub-surface-pressed)]" />
          <div className="mt-2 h-4 w-full animate-pulse rounded-full bg-[var(--ub-surface-pressed)]" />
        </div>

        <div className="min-h-[64px] px-4 py-4">
          <div className="h-5 w-1/2 animate-pulse rounded-full bg-[var(--ub-surface-pressed)]" />
          <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-[var(--ub-surface-pressed)]" />
        </div>
      </div>
    </AppShell>
  )
}
