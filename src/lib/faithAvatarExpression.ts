import { faithMoodOptions, type FaithMood } from './dailyFaith'

// This order is shared with the build-time atlas generator. All six frames load
// together, so tapping a private mood does not request a mood-specific URL.
export const faithExpressionFrames = ['neutral', 'peaceful', 'grateful', 'tired', 'anxious', 'lonely'] as const
export const faithExpressionFrameWidth = 192
export const faithExpressionFrameHeight = 224

export function getFaithExpression(mood: FaithMood | null) {
  const frame = mood ? Math.max(0, faithExpressionFrames.indexOf(mood)) : 0
  return {
    frame,
    mood: faithExpressionFrames[frame],
    label: frame ? faithMoodOptions.find((option) => option.value === mood)?.label : undefined,
  }
}

export function faithExpressionAtlasSrc(avatarId: string) {
  return `/avatars/bible-expressions-v1/${avatarId}.webp`
}
