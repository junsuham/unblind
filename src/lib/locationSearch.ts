import 'server-only'

export type LocationSearchResult = {
  id: string
  name: string
  address: string
}

type NominatimPlace = {
  osm_type: 'node' | 'way' | 'relation'
  osm_id: number
  name?: string
  display_name: string
}

let lastRequestAt = 0
const cache = new Map<string, LocationSearchResult[]>()

export async function searchLocations(query: string) {
  const normalized = query.trim().slice(0, 60)
  if (normalized.length < 2) return []

  const cacheKey = normalized.toLocaleLowerCase('ko-KR')
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const waitTime = Math.max(0, 1050 - (Date.now() - lastRequestAt))
  if (waitTime) await new Promise((resolve) => setTimeout(resolve, waitTime))

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', `${normalized}, 대한민국`)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('countrycodes', 'kr')
  url.searchParams.set('limit', '8')
  url.searchParams.set('accept-language', 'ko')

  lastRequestAt = Date.now()
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Unblind/1.0 (https://unblind-omega.vercel.app)',
      Referer: 'https://unblind-omega.vercel.app',
    },
    cache: 'no-store',
  })

  if (!response.ok) throw new Error('지역 검색 서비스에 연결하지 못했습니다.')

  const payload = (await response.json()) as NominatimPlace[]
  const results = Array.from(
    new Map(payload.map((place) => {
      const id = `${place.osm_type}-${place.osm_id}`
      const result: LocationSearchResult = {
        id,
        name: place.name || place.display_name.split(',')[0].trim(),
        address: place.display_name,
      }
      return [id, result]
    })).values()
  )

  cache.set(cacheKey, results)
  return results
}
