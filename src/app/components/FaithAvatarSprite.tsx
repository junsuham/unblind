import Image from 'next/image'
import { DEFAULT_PIXEL_SPRITE, type GeneratedPixelAvatar } from '@/lib/pixelAvatar'

export function FaithAvatarSprite({
  avatar, name, className, size,
}: {
  avatar: GeneratedPixelAvatar | null
  name: string
  className: string
  size: number
}) {
  return (
    <Image
      src={avatar?.sprite ?? DEFAULT_PIXEL_SPRITE}
      alt={`${name}의 도트 캐릭터`}
      className={className}
      width={size}
      height={size}
      data-generated={Boolean(avatar)}
      unoptimized
    />
  )
}
