'use client'

import type { ModerationIssue } from '@/lib/moderation'

type SafetyIssueListProps = {
  issues: ModerationIssue[]
}

export default function SafetyIssueList({ issues }: SafetyIssueListProps) {
  if (issues.length === 0) {
    return null
  }

  return (
    <div className="mt-3 space-y-2">
      {issues.map((issue) => {
        const isBlock = issue.level === 'block'
        const isDanger = issue.level === 'danger'

        const className =
          isBlock || isDanger
            ? 'rounded-[18px] border border-[#FF3B30]/20 bg-[#FF3B30]/10 p-4 text-[15px] leading-[21px] text-[#7A1A16]'
            : 'rounded-[18px] border border-[#FF9500]/25 bg-[#FF9500]/12 p-4 text-[15px] leading-[21px] text-[#5C3B00]'

        return (
          <div key={issue.code} className={className}>
            <p className="font-semibold">
              {isBlock
                ? '제출 불가 · '
                : isDanger
                  ? '주의 필요 · '
                  : '확인 필요 · '}
              {issue.title}
            </p>

            <p className="mt-1">{issue.description}</p>
          </div>
        )
      })}
    </div>
  )
}
