import Image from 'next/image'
import { emoji3DAssets, type Emoji3DName } from '@/lib/emoji3d'

type Emoji3DProps = {
  name: Emoji3DName
  size?: number
  className?: string
  decorative?: boolean
}

export function Emoji3D({
  name,
  size = 22,
  className = '',
  decorative = true,
}: Emoji3DProps) {
  const asset = emoji3DAssets[name]

  return (
    <Image
      src={asset.src}
      alt={decorative ? '' : asset.label}
      aria-hidden={decorative || undefined}
      width={size}
      height={size}
      unoptimized
      className={`inline-block shrink-0 object-contain ${className}`}
    />
  )
}
