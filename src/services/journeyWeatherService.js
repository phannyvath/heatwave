import { fetchForecast, normaliseForecast } from './weatherService.js'
import { isSelectedPlace } from './placesService.js'
import { calculateEndpointJourney } from '../utils/journeyRisk.js'

export async function checkJourneyWeather({ start, destination, time, signal, now = new Date() }) {
  if (!isSelectedPlace(start) || !isSelectedPlace(destination)) throw new Error('Select both journey locations')
  const origin = normaliseForecast(await fetchForecast({ ...start, signal }))
  // Use the origin's timezone for both requests. The destination is assessed at
  // the same instant as departure, not at an invented arrival time.
  const end = normaliseForecast(await fetchForecast({ ...destination, signal, timezone: origin.timezone }))
  return {
    journey: calculateEndpointJourney(origin, end, time, now),
    timezone: origin.timezone,
    provider: origin.provider,
    fetchedAt: end.fetchedAt,
  }
}
