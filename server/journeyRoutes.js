const ENDPOINT = 'https://api.geoapify.com/v1/routing'
const MODES = { TRANSIT: 'transit', WALK: 'walk', BICYCLE: 'bicycle', DRIVE: 'drive' }
const point = (p) => p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && p.latitude >= -44 && p.latitude <= -9 && p.longitude >= 112 && p.longitude <= 154

export function normaliseRoute(route, departure, mode) {
  const duration = route.time
  if (!Number.isFinite(duration) || duration <= 0 || duration > 86400 || !Number.isFinite(route.distance) || route.distance < 0 || route.mode !== MODES[mode]) return null
  const steps = route.legs?.flatMap((leg) => leg.steps || []) || []
  // A transit request that only returns a walk is not evidence of transit coverage.
  if (mode === 'TRANSIT' && !steps.some((step) => ['Transit', 'TransitTransfer', 'TransitRemainOn'].includes(step.instruction?.type))) return null
  return {
    provider: 'Geoapify', departure, arrival: departure + duration * 1000,
    durationMinutes: Math.ceil(duration / 60), distanceMeters: route.distance,
    walkingMinutes: mode === 'WALK' ? Math.ceil(duration / 60) : null,
    outdoorMinutes: ['WALK', 'BICYCLE'].includes(mode) ? Math.ceil(duration / 60) : null,
    // Geoapify's documented endpoint has no requested departure-time parameter.
    // Do not invent timetable services, traffic predictions or transit wait times.
    services: [], warnings: [],
    instructions: steps.map((step) => step.instruction?.text).filter((text) => typeof text === 'string'),
  }
}

export async function computeJourneyRoutes(body, { apiKey, fetcher = fetch, now = Date.now(), origin } = {}) {
  const { start, destination, mode, departure, offsets } = body || {}
  if (!point(start) || !point(destination) || !Object.hasOwn(MODES, mode) || !Number.isFinite(departure) || departure < now - 60000 || departure > now + 3 * 86400000 || !Array.isArray(offsets) || !offsets.length || offsets.length > 3 || offsets[0] !== 0 || new Set(offsets).size !== offsets.length || offsets.some((v) => ![0, 60, 120].includes(v))) {
    return { status: 400, body: { error: 'invalidRequest' } }
  }
  if (!apiKey?.trim()) return { status: 503, body: { error: 'configuration' } }
  // One route estimate is reused across weather windows, saving free credits.
  const params = new URLSearchParams({
    waypoints: `${start.latitude},${start.longitude}|${destination.latitude},${destination.longitude}`,
    mode: MODES[mode], format: 'json', units: 'metric', details: 'instruction_details', apiKey: apiKey.trim(),
    ...(mode === 'DRIVE' ? { traffic: 'approximated' } : {}),
  })
  let route
  let error
  try {
    const response = await fetcher(`${ENDPOINT}?${params}`, {
      signal: AbortSignal.timeout(12000),
      headers: origin ? { Origin: origin, Referer: `${origin}/` } : {},
    })
    if (!response.ok) error = response.status === 429 ? 'rateLimit' : [401, 403].includes(response.status) ? 'credentials' : response.status === 400 ? 'noRoute' : 'unavailable'
    else {
      const data = await response.json()
      route = data.results?.[0] && normaliseRoute(data.results[0], departure, mode)
      if (!route) error = 'noRoute'
    }
  } catch { error = 'unavailable' } // Never log credential-bearing URLs or errors.
  return { status: 200, body: { results: offsets.map((offset) => error
    ? { departure: departure + offset * 60000, error }
    : { ...route, departure: route.departure + offset * 60000, arrival: route.arrival + offset * 60000 }) } }
}

export async function handleJourneyRoutes(req, res, options) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); res.statusCode = 405; res.end(JSON.stringify({ error: 'method' })); return }
  if (req.headers['sec-fetch-site'] === 'cross-site') { res.statusCode = 403; res.end(JSON.stringify({ error: 'forbidden' })); return }
  try {
    let body = req.body
    if (!body) {
      let raw = ''
      for await (const chunk of req) {
        raw += chunk
        if (raw.length > 4096) { res.statusCode = 413; res.end(JSON.stringify({ error: 'invalidRequest' })); return }
      }
      body = JSON.parse(raw)
    } else if (typeof body === 'string') body = JSON.parse(body)
    let origin
    try {
      const candidate = new URL(req.headers.origin)
      if (candidate.host === req.headers.host && ['http:', 'https:'].includes(candidate.protocol)) origin = candidate.origin
    } catch { /* Non-browser callers can use an independently restricted server key. */ }
    const result = await computeJourneyRoutes(body, { ...options, origin })
    res.statusCode = result.status
    res.end(JSON.stringify(result.body))
  } catch { res.statusCode = 400; res.end(JSON.stringify({ error: 'invalidRequest' })) }
}
