import Image from 'next/image'
import type { FaithMood } from '@/lib/dailyFaith'
import {
  faithExpressionAtlasSrc,
  faithExpressionFrameHeight,
  faithExpressionFrameWidth,
  faithExpressionFrames,
  getFaithExpression,
} from '@/lib/faithAvatarExpression'
import type { BibleAvatarPreset } from '@/lib/pixelAvatar'

export function FaithAvatarSprite({
  avatar, name, className, size, mood,
}: {
  avatar: BibleAvatarPreset
  name: string
  className: string
  size: number
  mood?: FaithMood | null
}) {
  const alt = `${name}의 도트 캐릭터: ${avatar.name}`

  // The prayer room and other public-facing surfaces omit mood and keep the
  // original portrait. Only the private home check-in uses the atlas.
  if (mood !== undefined) {
    const expression = getFaithExpression(mood)
    return (
      <svg
        className={className}
        role="img"
        aria-label={expression.label ? `${alt} · ${expression.label}` : alt}
        data-expression={expression.mood}
        viewBox={`0 0 ${faithExpressionFrameWidth} ${faithExpressionFrameHeight}`}
        width={size}
        height={size}
      >
        <svg width={faithExpressionFrameWidth} height={faithExpressionFrameHeight} overflow="hidden">
          <image
            href={faithExpressionAtlasSrc(avatar.id)}
            x={-expression.frame * faithExpressionFrameWidth}
            width={faithExpressionFrameWidth * faithExpressionFrames.length}
            height={faithExpressionFrameHeight}
            preserveAspectRatio="none"
            style={{ imageRendering: 'pixelated' }}
          />
        </svg>
      </svg>
    )
  }

  return (
    <Image
      src={avatar.src}
      alt={alt}
      className={className}
      width={size}
      height={size}
      unoptimized
    />
  )
}
