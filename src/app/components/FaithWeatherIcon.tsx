import type { FaithWeather } from '@/lib/dailyFaith'

function Sun({ transform }: { transform?: string }) {
  return (
    <g transform={transform}>
      <path fill="#9b542a" d="M14 1h4v4h-4zM14 19h4v4h-4zM4 10h4v4H4zM24 10h4v4h-4zM6 3h3v2h2v3H8V6H6zM23 3h3v3h-2v2h-3V5h2zM8 16h3v3H9v2H6v-3h2zM21 16h3v2h2v3h-3v-2h-2z" />
      <path fill="#f9bd59" d="M15 2h2v2h-2zM15 20h2v2h-2zM5 11h2v2H5zM25 11h2v2h-2zM7 4h2v2H7zM23 4h2v2h-2zM7 18h2v2H7zM23 18h2v2h-2z" />
      <path fill="#9b542a" d="M13 5h6v1h2v2h2v8h-2v2h-2v1h-6v-1h-2v-2H9V8h2V6h2z" />
      <path fill="#ef9e43" d="M13 6h6v1h2v2h1v6h-1v2h-2v1h-6v-1h-2v-2h-1V9h1V7h2z" />
      <path fill="#ffdc77" d="M13 7h5v1h2v2h1v3h-1v2h-2v1h-5v-1h-2v-5h1V8h1z" />
      <path fill="#fff3ac" d="M13 8h4v1h-3v1h-2V9h1z" />
    </g>
  )
}

function Cloud({ shadow = false, transform }: { shadow?: boolean; transform?: string }) {
  return (
    <g transform={transform}>
      <path fill="#465568" d="M12 5h8v1h2v2h2v2h3v2h2v5h-2v2H7v-1H5v-2H3v-4h2v-2h4V8h1V6h2z" />
      <path fill={shadow ? '#8c9dad' : '#a7bfca'} d="M12 6h8v1h2v2h1v2h4v2h1v3h-1v2H7v-1H5v-2H4v-2h2v-2h4V9h1V7h1z" />
      <path fill={shadow ? '#c4cdd4' : '#e0eef0'} d="M13 7h6v1h2v2h1v2h4v1h1v2h-4v1H7v-1H5v-2h2v-1h4v-2h1V8h1z" />
      <path fill={shadow ? '#e3e8ed' : '#fffaf0'} d="M13 8h5v1h-4v1h-2V9h1zM7 13h3v1H7z" />
    </g>
  )
}

export function FaithWeatherIcon({ weather }: { weather: FaithWeather | null }) {
  return (
    <svg viewBox="0 0 32 24" width="30" height="23" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
      {weather === 'sunny' ? (
        <Sun />
      ) : weather === 'cloudy' ? (
        <Cloud shadow />
      ) : weather === 'rainy' ? (
        <>
          <Cloud shadow transform="translate(0 -3)" />
          <path fill="#41657e" d="M9 17h2v2h-1v2H8v-2h1zM16 18h2v2h-1v3h-2v-3h1zM23 17h2v2h-1v2h-2v-2h1z" />
          <path fill="#75b3d1" d="M9 18h1v2H9zM16 19h1v3h-1zM23 18h1v2h-1z" />
        </>
      ) : (
        <>
          <Sun transform="translate(-1 0) scale(.78)" />
          <Cloud transform="translate(5 3) scale(.88)" />
        </>
      )}
    </svg>
  )
}
