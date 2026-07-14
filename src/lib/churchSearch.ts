import 'server-only'

export type ChurchSearchResult = {
  id: string
  name: string
  address: string
  roadAddress: string
  phone: string
  placeUrl: string
}

type NominatimPlace = {
  osm_type: 'node' | 'way' | 'relation'
  osm_id: number
  name?: string
  display_name: string
  category: string
  type: string
}

let lastRequestAt = 0
const resultCache = new Map<string, ChurchSearchResult[]>()

function getOsmPathType(type: NominatimPlace['osm_type']) {
  return type === 'node' ? 'node' : type === 'way' ? 'way' : 'relation'
}

function isChurchPlace(place: NominatimPlace) {
  return (
    place.type === 'place_of_worship' ||
    place.type === 'church' ||
    place.category === 'religion'
  )
}

async function searchNominatim(searchTerm: string) {
  const waitTime = Math.max(0, 1050 - (Date.now() - lastRequestAt))

  if (waitTime > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitTime))
  }

  const searchUrl = new URL('https://nominatim.openstreetmap.org/search')
  searchUrl.searchParams.set('q', searchTerm)
  searchUrl.searchParams.set('format', 'jsonv2')
  searchUrl.searchParams.set('countrycodes', 'kr')
  searchUrl.searchParams.set('limit', '10')
  searchUrl.searchParams.set('accept-language', 'ko')

  lastRequestAt = Date.now()

  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Unblind/1.0 (https://unblind-omega.vercel.app)',
      Referer: 'https://unblind-omega.vercel.app',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('교회 검색 서비스에 연결하지 못했습니다.')
  }

  return ((await response.json()) as NominatimPlace[]).filter(isChurchPlace)
}

export async function searchChurches(query: string) {
  const normalizedQuery = query.trim().slice(0, 50)

  if (normalizedQuery.length < 2) {
    return []
  }

  const cacheKey = normalizedQuery.toLocaleLowerCase('ko-KR')
  const cached = resultCache.get(cacheKey)

  if (cached) return cached

  const primarySearchTerm = normalizedQuery.includes('교회')
    ? normalizedQuery
    : `${normalizedQuery}교회`
  let payload = await searchNominatim(primarySearchTerm)

  if (payload.length === 0 && !normalizedQuery.includes('교회')) {
    payload = await searchNominatim(`${normalizedQuery} 교회`)
  }

  const results = payload
    .map<ChurchSearchResult>((place) => {
      const osmType = getOsmPathType(place.osm_type)

      return {
        id: `${osmType}-${place.osm_id}`,
        name: place.name || place.display_name.split(',')[0],
        address: place.display_name,
        roadAddress: place.display_name,
        phone: '',
        placeUrl: `https://www.openstreetmap.org/${osmType}/${place.osm_id}`,
      }
    })

  resultCache.set(cacheKey, results)
  return results
}
