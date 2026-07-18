type StandaloneViewportMetrics = {
  isStandalone: boolean
  safeAreaBottom: number
  screenHeight: number
  viewportHeight: number
}

export function getStandaloneBottomCompensation({
  isStandalone,
  safeAreaBottom,
  screenHeight,
  viewportHeight,
}: StandaloneViewportMetrics) {
  if (!isStandalone) return 0
  if (![safeAreaBottom, screenHeight, viewportHeight].every(Number.isFinite)) {
    return 0
  }

  const excludedViewportHeight = Math.max(0, screenHeight - viewportHeight)
  const safeBottom = Math.max(0, safeAreaBottom)

  return Math.round(Math.min(safeBottom, excludedViewportHeight))
}
