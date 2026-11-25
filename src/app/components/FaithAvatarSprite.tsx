import Image from 'next/image'
import type { BibleAvatarPreset } from '@/lib/pixelAvatar'

export function FaithAvatarSprite({
  avatar, name, className, size,
}: {
  avatar: BibleAvatarPreset
  name: string
  className: string
  size: number
}) {
  return (
    <Image
      src={avatar.src}
      alt={`${name}의 도트 캐릭터: ${avatar.name}`}
      className={className}
      width={size}
      height={size}
      unoptimized
    />
  )
}
