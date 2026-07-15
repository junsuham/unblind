import type { ReactNode, SVGProps } from 'react'

export type SystemIconName =
  | 'calendar'
  | 'eye'
  | 'gift'
  | 'heart'
  | 'leaf'
  | 'message'
  | 'music'
  | 'people'
  | 'play'
  | 'prayer'
  | 'sparkles'
  | 'sun'

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
  gift: (
    <>
      <path d="M3 10h18v11H3V10ZM12 10v11M2 6h20v4H2V6Z" />
      <path d="M12 6H8.5A2.5 2.5 0 1 1 11 3.5V6ZM12 6h3.5A2.5 2.5 0 1 0 13 3.5V6Z" />
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
  music: (
    <path d="M9 18V5l10-2v13M9 9l10-2M6.5 21C4.6 21 3 19.9 3 18.5S4.6 16 6.5 16 10 17.1 10 18.5 8.4 21 6.5 21ZM16.5 19c-1.9 0-3.5-1.1-3.5-2.5s1.6-2.5 3.5-2.5 3.5 1.1 3.5 2.5-1.6 2.5-3.5 2.5Z" />
  ),
  people: (
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
  ),
  play: (
    <path d="m9 7 8 5-8 5V7Z" />
  ),
  prayer: (
    <>
      <path d="M8.4 20.5 4.8 17a3.3 3.3 0 0 1-.8-3.4l2-6.1c.3-.9 1.2-1.4 2-1 .7.3 1.1 1 .9 1.8L8 12" />
      <path d="m9.1 15-1.5-2.2a1.5 1.5 0 0 1 .3-2.1c.6-.4 1.5-.3 2 .3l2.1 2.7 2.1-2.7c.5-.6 1.4-.7 2-.3.6.5.8 1.4.3 2.1L14.9 15" />
      <path d="m15.6 20.5 3.6-3.5a3.3 3.3 0 0 0 .8-3.4l-2-6.1c-.3-.9-1.2-1.4-2-1-.7.3-1.1 1-.9 1.8l.9 3.7M12 13.7v7" />
    </>
  ),
  sparkles: (
    <path d="m12 3-1.2 3.8a6 6 0 0 1-4 4L3 12l3.8 1.2a6 6 0 0 1 4 4L12 21l1.2-3.8a6 6 0 0 1 4-4L21 12l-3.8-1.2a6 6 0 0 1-4-4L12 3Z" />
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
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
