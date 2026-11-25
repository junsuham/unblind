import type { BibleAvatarSceneId } from '@/lib/bibleAvatarScenes'
import type { FaithWeather } from '@/lib/dailyFaith'
import styles from './FaithAvatarWeather.module.css'

const nightScenes: ReadonlySet<BibleAvatarSceneId> = new Set(['bethlehem', 'gethsemane'])
const shoreScenes: ReadonlySet<BibleAvatarSceneId> = new Set(['galilee', 'beatitudes', 'jordan', 'red-sea'])

const farRain = 'M-4 7l-2 6m12-2l-2 6m15-7l-2 7m14-10l-2 6m15-7l-2 8m14-5l-2 7m15-8l-2 6m14-3l-2 7m14-10l-2 7m14-1l-2 8m15-11l-2 8m14-11l-2 7m14-1l-2 7m15-12l-2 7M1 31l-2 7m17-5l-2 6m16-9l-2 8m16-5l-2 7m14-12l-2 8m16-6l-2 7m15-5l-2 7m15-12l-2 7m14-4l-2 7m15-7l-2 8m14-12l-2 6m16-4l-2 8m14-6l-2 7M-2 61l-2 6m18-9l-2 6m15-3l-2 6m15-11l-2 6m16-2l-2 7m15-8l-2 6m14-9l-2 6m15-2l-2 6m14-8l-2 7m16-10l-2 7m16-2l-2 7m15-9l-2 8m15-8l-2 7'
const nearRain = 'M4 1l-3 12m20 7l-3 12m19-24l-3 12m22-7l-3 11m21-16l-3 12m22 1l-3 12m21-25l-3 12m20-6l-3 12m22-16l-3 12m17-2l-3 12M-4 45l-3 12m20-15l-3 12m22-2l-3 12m22-25l-3 12m20-1l-3 11m21-20l-3 12m22-7l-3 12m21-19l-3 12m21-1l-3 12m21-24l-3 13M2 75l-3 12m20-17l-3 12m22-7l-3 12m22-15l-3 12m20-9l-3 12m22-18l-3 12m22-7l-3 12m21-17l-3 12m22-6l-3 12m18-17l-3 12'

function PixelCloud({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 76 28" shapeRendering="crispEdges" focusable="false">
      <path className={styles.cloudShadow} d="M2 24h4v-5h7v-5h6v-4h9V6h8V3h11v3h8v4h6v5h6v4h7v5h-7v3H8v-3Z" />
      <path className={styles.cloudMid} d="M1 21h5v-5h8v-5h8V7h8V3h8V1h9v3h7v4h7v5h6v4h8v6h-9v3H8v-3H1Z" />
      <path className={styles.cloudLight} d="M1 21h6v-5h7v-5h8V7h8V3h8V1h9v3h7v4h7v5h6v4h8v4H65v-3h-9v-3h-9v3h-9v-2h-9v4h-9v3H8v-2Z" />
      <path className={styles.cloudEdge} d="M24 7h6V3h8V1h9v3h-8v3h-6v4h-9v3h-7v-3h7Zm21-3h5v3h-5Zm10 5h6v4h-6Zm-45 9h6v3h-6Z" />
    </svg>
  )
}

/** Decorative stage effects; they never move or replace the selected location. */
export function FaithAvatarWeather({
  weather,
  sceneId,
}: {
  weather: FaithWeather | null
  sceneId: BibleAvatarSceneId
}) {
  return (
    <div
      className={styles.weather}
      data-weather={weather ?? 'unset'}
      data-night={nightScenes.has(sceneId)}
      data-water={shoreScenes.has(sceneId)}
      aria-hidden="true"
    >
      <div className={styles.sunGlow} />
      <div className={styles.skyShade} />
      <div className={styles.rainShade} />
      <svg className={styles.sunRays} viewBox="0 0 160 90" preserveAspectRatio="none" focusable="false">
        <path d="M145-9 102 54 112 53 155-9ZM158-7 126 54 134 53 168-7ZM134-7 74 44 83 43 144-7Z" fill="#ffe7a2" />
        <path d="M152-8 109 53 112 53 155-8ZM164-8 130 54 134 53 168-8Z" fill="#fff7cb" />
      </svg>
      <div className={styles.clouds}>
        <PixelCloud className={styles.distantCloud} />
        <PixelCloud className={styles.nearCloud} />
        <PixelCloud className={styles.lowCloud} />
      </div>
      <svg className={styles.glints} viewBox="0 0 160 90" preserveAspectRatio="none" focusable="false" shapeRendering="crispEdges">
        <path d="M91 42h10m7 2h14m-35 3h14m4 1h22m-35 4h18m5 2h14m-39 3h14m4 2h24m-47 4h18" stroke="#ffedb4" strokeWidth="1" />
        <path d="M99 44h7m6 3h7m-16 7h7m8 3h8m-23 5h11" stroke="#fff7db" strokeWidth="0.8" />
      </svg>
      <svg className={styles.rainFar} viewBox="0 0 160 90" preserveAspectRatio="none" focusable="false">
        <path d={farRain} stroke="#c4deff" strokeWidth="0.75" vectorEffect="non-scaling-stroke" fill="none" />
      </svg>
      <svg className={styles.rainNear} viewBox="0 0 160 90" preserveAspectRatio="none" focusable="false">
        <path d={nearRain} stroke="#e6f4ff" strokeWidth="1.4" vectorEffect="non-scaling-stroke" fill="none" />
      </svg>
      <svg className={styles.ripples} viewBox="0 0 160 90" preserveAspectRatio="none" shapeRendering="crispEdges" focusable="false">
        <path className={styles.groundRipples} d="M23 74h4m-7 2h3m2 1h4m0-2h4m16 0h4m-6 2h8m94-4h4m-6 2h8m-32 0h4m-7 2h3m2 1h4m0-2h4m-57 0h4" stroke="#e3f1ff" strokeWidth="0.8" fill="none" />
        <path className={styles.waterRipples} d="M34 49h4m-7 2h3m2 1h4m0-2h4m22 0h4m-7 2h3m2 1h4m0-2h4m37-6h4m-7 2h3m2 1h4m0-2h4m-18 13h4m-7 2h3m2 1h4m0-2h4" stroke="#d7efff" strokeWidth="0.85" fill="none" />
      </svg>
    </div>
  )
}
