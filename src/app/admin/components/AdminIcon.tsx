export type AdminIconName =
  | 'home'
  | 'users'
  | 'alert'
  | 'search'
  | 'chart'
  | 'post'
  | 'comment'
  | 'gift'
  | 'music'
  | 'shield'
  | 'check'
  | 'clock'
  | 'activity'
  | 'support'

type AdminIconProps = {
  name: AdminIconName
  className?: string
}

export function AdminIcon({ name, className = 'h-6 w-6' }: AdminIconProps) {
  const commonProps = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (name === 'home') {
    return (
      <svg {...commonProps}>
        <path d="m3.5 10.5 8.5-7 8.5 7" />
        <path d="M5.5 9.2V21h13V9.2" />
        <path d="M9.5 21v-6.5h5V21" />
      </svg>
    )
  }

  if (name === 'users') {
    return (
      <svg {...commonProps}>
        <path d="M16 20v-1.6a4.4 4.4 0 0 0-4.4-4.4H6.4A4.4 4.4 0 0 0 2 18.4V20" />
        <circle cx="9" cy="7" r="4" />
        <path d="M16.5 4.2a4 4 0 0 1 0 7.6" />
        <path d="M22 20v-1.6a4.4 4.4 0 0 0-3.3-4.3" />
      </svg>
    )
  }

  if (name === 'alert') {
    return (
      <svg {...commonProps}>
        <path d="M10.3 3.7 2.2 18a2 2 0 0 0 1.8 3h16a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4.5" />
        <path d="M12 17.2h.01" />
      </svg>
    )
  }

  if (name === 'search') {
    return (
      <svg {...commonProps}>
        <circle cx="10.8" cy="10.8" r="7.3" />
        <path d="m16.2 16.2 4.3 4.3" />
      </svg>
    )
  }

  if (name === 'chart') {
    return (
      <svg {...commonProps}>
        <path d="M4 20V10h4v10" />
        <path d="M10 20V4h4v16" />
        <path d="M16 20v-7h4v7" />
      </svg>
    )
  }

  if (name === 'post') {
    return (
      <svg {...commonProps}>
        <rect x="4" y="3" width="16" height="18" rx="3" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    )
  }

  if (name === 'comment') {
    return (
      <svg {...commonProps}>
        <path d="M20.5 11.4a8 8 0 0 1-8.4 8.1 9.3 9.3 0 0 1-3.6-.8L3.5 20l1.4-4.4a8 8 0 1 1 15.6-4.2Z" />
      </svg>
    )
  }

  if (name === 'gift') {
    return (
      <svg {...commonProps}>
        <path d="M3 9h18v12H3zM2 5h20v4H2zM12 5v16" />
        <path d="M12 5H8.2a2.2 2.2 0 1 1 2.2-2.2C10.4 4.4 12 5 12 5ZM12 5h3.8A2.2 2.2 0 1 0 13.6 2.8C13.6 4.4 12 5 12 5Z" />
      </svg>
    )
  }

  if (name === 'music') {
    return (
      <svg {...commonProps}>
        <path d="M9 18V5l11-2v13" />
        <ellipse cx="6.5" cy="18" rx="2.5" ry="2" />
        <ellipse cx="17.5" cy="16" rx="2.5" ry="2" />
      </svg>
    )
  }

  if (name === 'shield') {
    return (
      <svg {...commonProps}>
        <path d="M12 22s8-3.8 8-10.5V5l-8-3-8 3v6.5C4 18.2 12 22 12 22Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </svg>
    )
  }

  if (name === 'check') {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.6 2.7L16.5 9" />
      </svg>
    )
  }

  if (name === 'clock') {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.4 2" />
      </svg>
    )
  }

  if (name === 'support') {
    return (
      <svg {...commonProps}>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m4.5 7 7.5 6 7.5-6" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <path d="M3 12h4l2.2-6 4.1 12 2.2-6H21" />
    </svg>
  )
}
