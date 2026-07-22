import type { ReactNode, SVGProps } from 'react'

export type SystemIconName =
  | 'bell'
  | 'bookmark'
  | 'calendar'
  | 'close'
  | 'disc'
  | 'dice'
  | 'eye'
  | 'external'
  | 'flag'
  | 'gift'
  | 'heart'
  | 'home'
  | 'leaf'
  | 'logout'
  | 'message'
  | 'music'
  | 'next'
  | 'pause'
  | 'people'
  | 'person'
  | 'play'
  | 'previous'
  | 'prayer'
  | 'search'
  | 'settings'
  | 'shuffle'
  | 'compose'
  | 'sparkles'
  | 'speaker'
  | 'sun'
  | 'timer'
  | 'trophy'

type SystemIconProps = SVGProps<SVGSVGElement> & {
  name: SystemIconName
  size?: number
  filled?: boolean
}

const paths: Record<SystemIconName, ReactNode> = {
  bell: (
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
  ),
  bookmark: (
    <path d="M6 3h12v18l-6-4-6 4V3Z" />
  ),
  calendar: (
    <path d="M7 2v3M17 2v3M3.5 9h17M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z" />
  ),
  close: (
    <path d="m6 6 12 12M18 6 6 18" />
  ),
  disc: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M12 3a9 9 0 0 1 9 9M3 12a9 9 0 0 1 9-9" opacity=".45" />
    </>
  ),
  dice: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="16" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" />
    </>
  ),
  flag: (
    <path d="M5 21V4m0 1h11l-1.5 3L16 11H5" />
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
  home: (
    <path d="M3.5 10.3 12 3.7l8.5 6.6v9.2a1.5 1.5 0 0 1-1.5 1.5h-4.4v-6.5H9.4V21H5a1.5 1.5 0 0 1-1.5-1.5v-9.2Z" />
  ),
  leaf: (
    <path d="M20.6 3.4C12 3.7 5.4 6.2 4 11.8c-1 4.2 2 7.3 5.7 6.8M4.8 20c3.1-5.6 7.5-9.3 13.3-11.2M10 18.5c5.8.7 10.6-3.5 10.6-15.1" />
  ),
  logout: (
    <>
      <path d="M10 4H5v16h5" />
      <path d="M8 12h11M15 8l4 4-4 4" />
    </>
  ),
  message: (
    <path d="M21 14a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v7Z" />
  ),
  music: (
    <path d="M9 18V5l10-2v13M9 9l10-2M6.5 21C4.6 21 3 19.9 3 18.5S4.6 16 6.5 16 10 17.1 10 18.5 8.4 21 6.5 21ZM16.5 19c-1.9 0-3.5-1.1-3.5-2.5s1.6-2.5 3.5-2.5 3.5 1.1 3.5 2.5-1.6 2.5-3.5 2.5Z" />
  ),
  next: (
    <>
      <path d="m5 6 8 6-8 6V6ZM13 6l8 6-8 6V6Z" />
      <path d="M21 6v12" />
    </>
  ),
  pause: (
    <path d="M8 5v14M16 5v14" />
  ),
  people: (
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
  ),
  person: (
    <>
      <circle cx="12" cy="7.5" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  play: (
    <path d="m9 7 8 5-8 5V7Z" />
  ),
  previous: (
    <>
      <path d="m19 6-8 6 8 6V6ZM11 6l-8 6 8 6V6Z" />
      <path d="M3 6v12" />
    </>
  ),
  prayer: (
    <>
      <path d="M10.8 21H7.3a3.4 3.4 0 0 1-3-1.9l-1.5-3a2.8 2.8 0 0 1 .3-3l3.6-4.8a1.5 1.5 0 0 1 2.1-.3c.6.5.8 1.3.4 2l-1.6 2.8 2.2-7.2a1.7 1.7 0 0 1 2.1-1.1c.8.3 1.2 1.1 1 1.9L10.8 21Z" />
      <path d="M13.2 21h3.5a3.4 3.4 0 0 0 3-1.9l1.5-3a2.8 2.8 0 0 0-.3-3l-3.6-4.8a1.5 1.5 0 0 0-2.1-.3c-.6.5-.8 1.3-.4 2l1.6 2.8-2.2-7.2a1.7 1.7 0 0 0-2.1-1.1c-.8.3-1.2 1.1-1 1.9l2.1 14.6Z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  shuffle: (
    <>
      <path d="M16 3h5v5M4 6h3.5c4.5 0 5 12 9.5 12h4" />
      <path d="m18 15 3 3-3 3M4 18h3.5c1.5 0 2.6-1.3 3.6-3.1M13.4 8.8C14.4 7.1 15.5 6 17 6h4" />
    </>
  ),
  compose: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  sparkles: (
    <path d="m12 3-1.2 3.8a6 6 0 0 1-4 4L3 12l3.8 1.2a6 6 0 0 1 4 4L12 21l1.2-3.8a6 6 0 0 1 4-4L21 12l-3.8-1.2a6 6 0 0 1-4-4L12 3Z" />
  ),
  speaker: (
    <>
      <path d="M4 10v4h4l5 4V6l-5 4H4Z" />
      <path d="M17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M9 2h6M12 5V2M18.2 6.8 20 5M12 13l3-3" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM12 13v5M8 21h8M9 18h6" />
      <path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4" />
    </>
  ),
}

export function SystemIcon({
  name,
  size = 24,
  filled = false,
  className,
  ...props
}: SystemIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
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
