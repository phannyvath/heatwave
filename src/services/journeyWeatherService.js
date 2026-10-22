import { fetchForecast, normaliseForecast } from './weatherService.js'
import { isSelectedPlace } from './placesService.js'
import { nextDeparture, localStamp } from '../utils/journeyTiming.js'
import { recommendRoutes } from '../utils/routeWeatherRisk.js'

export async function checkJourneyWeather({ start, destination, time, method = 'TRANSIT', signal, now = new Date() }) {
  if (!isSelectedPlace(start) || !isSelectedPlace(destination)) throw new Error('Select both journey locations')
  const origin = normaliseForecast(await fetchForecast({ ...start, signal, timeformat: 'unixtime' }))
  const departure = nextDeparture(time, origin.timezone, now)
  const stamp = localStamp(departure, origin.timezone)
  const offsets = [0, 60, 120].filter((offset) => {
    if (!offset) return true
    const candidate = localStamp(departure + offset * 60000, origin.timezone)
    return candidate.slice(0, 10) === stamp.slice(0, 10) && candidate.slice(11) < '21:00'
  })
  const [endData, response] = await Promise.all([
    fetchForecast({ ...destination, signal, timezone: origin.timezone, timeformat: 'unixtime' }),
    fetch('/api/journey-routes', { method: 'POST', signal, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start: { latitude: start.latitude, longitude: start.longitude }, destination: { latitude: destination.latitude, longitude: destination.longitude }, mode: method, departure, offsets }) }),
  ])
  const end = normaliseForecast(endData)
  let routing
  try { routing = await response.json() } catch { throw new Error('routesUnavailable') }
  if (!response.ok || !Array.isArray(routing.results)) throw new Error(routing.error === 'configuration' ? 'routesConfiguration' : 'routesUnavailable')
  if (routing.results[0]?.error) throw new Error(routing.results[0].error === 'noRoute' ? 'noRoute' : 'routesUnavailable')
  return {
    journey: recommendRoutes(origin, end, routing.results, method),
    timezone: origin.timezone, provider: origin.provider, fetchedAt: end.fetchedAt,
  }
}
