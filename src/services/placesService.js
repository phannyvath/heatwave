const ENDPOINT = 'https://api.geoapify.com/v1/geocode/autocomplete'
export const MIN_PLACE_QUERY_LENGTH = 1

export class PlacesError extends Error {
  constructor(code) {
    super(code)
    this.name = 'PlacesError'
    this.code = code
  }
}

export function isSelectedPlace(place) {
  return Boolean(place?.provider === 'geoapify' && place.placeId && place.displayName &&
    Number.isFinite(place.latitude) && Math.abs(place.latitude) <= 90 &&
    Number.isFinite(place.longitude) && Math.abs(place.longitude) <= 180)
}

export function normalisePlaces(data) {
  if (!Array.isArray(data?.results)) throw new PlacesError('unavailable')
  const seen = new Set()
  return data.results.filter((place) => {
    if (!place || place.country_code?.toLowerCase() !== 'au' || !place.place_id || !place.formatted ||
      !Number.isFinite(place.lat) || !Number.isFinite(place.lon) || Math.abs(place.lat) > 90 || Math.abs(place.lon) > 180 || seen.has(place.place_id)) return false
    seen.add(place.place_id)
    return true
  }).map((place) => ({
    provider: 'geoapify', placeId: place.place_id,
    displayName: place.formatted,
    name: place.name || place.address_line1 || place.formatted,
    address: place.address_line2 || place.formatted,
    latitude: place.lat, longitude: place.lon,
    state: place.state_code || place.state || '',
    timezone: place.timezone?.name || null,
  }))
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted()
    const finish = () => { signal?.removeEventListener('abort', abort); resolve() }
    const timer = setTimeout(finish, ms)
    const abort = () => { clearTimeout(timer); reject(signal.reason) }
    signal?.addEventListener('abort', abort, { once: true })
  })
}

// One queue/cache shared by both inputs. Starts at most four requests per second
// per browser, below Geoapify's published free-tier five requests/second limit.
export function createPlacesClient({ apiKey, fetcher = globalThis.fetch } = {}) {
  apiKey = apiKey?.trim()
  let queue = Promise.resolve()
  let nextRequestAt = 0
  let blockedUntil = 0
  const cache = new Map()
  return async function search(query, { signal } = {}) {
    const text = query.trim()
    signal?.throwIfAborted()
    if (text.length < MIN_PLACE_QUERY_LENGTH) return []
    if (!apiKey) throw new PlacesError('configuration')
    const cached = cache.get(text.toLowerCase())
    if (cached && cached.expires > Date.now()) return cached.results
    const task = queue.catch(() => {}).then(async () => {
      signal?.throwIfAborted()
      if (Date.now() < blockedUntil) throw new PlacesError('rateLimit')
      await delay(Math.max(0, nextRequestAt - Date.now()), signal)
      signal?.throwIfAborted()
      nextRequestAt = Date.now() + 250
      const params = new URLSearchParams({
        text, apiKey, format: 'json', limit: '8', lang: 'en',
        filter: 'countrycode:au', bias: 'proximity:144.9631,-37.8136',
      })
      const controller = new AbortController()
      const abort = () => controller.abort(signal.reason)
      signal?.addEventListener('abort', abort, { once: true })
      const timeout = setTimeout(() => controller.abort(), 10000)
      try {
        const response = await fetcher(`${ENDPOINT}?${params}`, { signal: controller.signal })
        if (response.status === 429) {
          const retry = response.headers.get('Retry-After')
          const seconds = Number(retry)
          const wait = retry && Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retry) - Date.now()
          blockedUntil = Date.now() + Math.max(1000, Number.isFinite(wait) ? wait : 60000)
          throw new PlacesError('rateLimit')
        }
        if (response.status === 401 || response.status === 403) throw new PlacesError('credentials')
        if (!response.ok) throw new PlacesError('unavailable')
        const results = normalisePlaces(await response.json())
        signal?.throwIfAborted()
        if (cache.size >= 100) cache.delete(cache.keys().next().value)
        cache.set(text.toLowerCase(), { results, expires: Date.now() + 5 * 60 * 1000 })
        return results
      } catch (error) {
        signal?.throwIfAborted()
        throw error instanceof PlacesError ? error : new PlacesError('unavailable')
      } finally {
        clearTimeout(timeout)
        signal?.removeEventListener('abort', abort)
      }
    })
    queue = task.catch(() => {})
    return task
  }
}

export const searchJourneyPlaces = createPlacesClient({ apiKey: import.meta.env?.VITE_GEOAPIFY_API_KEY?.trim() })
