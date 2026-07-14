import type { ReactNode, SVGProps } from 'react'

export type SystemIconName =
  | 'calendar'
  | 'eye'
  | 'heart'
  | 'leaf'
  | 'message'
  | 'people'
  | 'pray'
  | 'sparkles'

type SystemIconProps = SVGProps<SVGSVGElement> & {
  name: SystemIconName
  size?: number
}

const paths: Record<SystemIconName, ReactNode> = {
  calendar: (
    <path d="M7 2v3M17 2v3M3.5 9h17M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z" />
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.8-7.7 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
  ),
  leaf: (
    <path d="M20.6 3.4C12 3.7 5.4 6.2 4 11.8c-1 4.2 2 7.3 5.7 6.8M4.8 20c3.1-5.6 7.5-9.3 13.3-11.2M10 18.5c5.8.7 10.6-3.5 10.6-15.1" />
  ),
  message: (
    <path d="M21 14a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v7Z" />
  ),
  people: (
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
  ),
  pray: (
    <path d="M8.2 21v-5.4l-2.4-2.7a2 2 0 0 1 .1-2.8l.3-.3 3.5 3.1V4.5a1.5 1.5 0 0 1 3 0v7.1l1.6-1.5a2 2 0 0 1 2.8.1l1.1 1.2a3 3 0 0 1 .8 2V21M8.2 17h10.7" />
  ),
  sparkles: (
    <path d="m12 3-1.2 3.8a6 6 0 0 1-4 4L3 12l3.8 1.2a6 6 0 0 1 4 4L12 21l1.2-3.8a6 6 0 0 1 4-4L21 12l-3.8-1.2a6 6 0 0 1-4-4L12 3Z" />
  ),
}

export function SystemIcon({
  name,
  size = 24,
  className,
  ...props
}: SystemIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
