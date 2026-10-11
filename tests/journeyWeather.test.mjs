import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateEndpointJourney } from '../src/utils/journeyRisk.js'
import { checkJourneyWeather } from '../src/services/journeyWeatherService.js'

// Synthetic endpoint conditions, never used by the running application.
const now = new Date('2026-10-11T00:00:00Z')
const forecast = (values) => ({ timezone: 'Australia/Melbourne', hourly: values.map(([time, apparentTemperature, uvIndex = 2]) => ({ time: `2026-10-11T${time}`, apparentTemperature, uvIndex })) })

test('higher endpoint risk determines the assessment and recommendation considers both', () => {
  const origin = forecast([['13:00', 25], ['17:00', 25], ['20:00', 29]])
  const end = forecast([['13:00', 43], ['17:00', 39], ['20:00', 30]])
  const result = calculateEndpointJourney(origin, end, '13:30', now)
  assert.equal(result.risk, 'very-hot')
  assert.equal(result.recommendedTime, '20:00')
  assert.equal(result.selected.endpoints[0].apparentTemperature, 25)
  assert.equal(result.selected.endpoints[1].apparentTemperature, 43)
})

test('missing endpoint data cannot become an optimistic single-endpoint assessment', () => {
  const origin = forecast([['13:00', 25]])
  for (const end of [null, forecast([]), forecast([['13:00', null]]), { ...origin, timezone: 'Australia/Perth' }]) {
    assert.equal(calculateEndpointJourney(origin, end, '13:30', now), null)
  }
})

function apiForecast(temperature, timezone) {
  return {
    timezone,
    current: { time: '2026-10-11T13:00', temperature_2m: temperature },
    hourly: { time: ['2026-10-11T13:00'], temperature_2m: [temperature], apparent_temperature: [temperature], relative_humidity_2m: [50], uv_index: [2], weather_code: [0] },
    daily: { time: [] },
  }
}
const start = { provider: 'geoapify', placeId: 'fixture-origin', displayName: 'Fixture origin', latitude: -31.9, longitude: 115.8 }
const destination = { ...start, placeId: 'fixture-destination', displayName: 'Fixture destination', latitude: -37.8, longitude: 145 }

test('weather requests use selected coordinates and align destination to origin timezone', async (context) => {
  const urls = []
  context.mock.method(globalThis, 'fetch', async (url) => {
    urls.push(new URL(url))
    return Response.json(apiForecast(urls.length === 1 ? 25 : 39, 'Australia/Perth'))
  })
  const result = await checkJourneyWeather({ start, destination, time: '13:30', now })
  assert.equal(urls.length, 2)
  assert.equal(urls[0].searchParams.get('latitude'), '-31.9')
  assert.equal(urls[0].searchParams.get('longitude'), '115.8')
  assert.equal(urls[1].searchParams.get('latitude'), '-37.8')
  assert.equal(urls[1].searchParams.get('longitude'), '145')
  assert.equal(urls[1].searchParams.get('timezone'), 'Australia/Perth')
  assert.equal(result.timezone, 'Australia/Perth')
  assert.equal(result.journey.risk, 'hot')
})

test('unselected locations block weather fetch; endpoint failures never fall back to Hawthorn', async (context) => {
  let count = 0
  context.mock.method(globalThis, 'fetch', async () => {
    count++
    return count === 1 ? Response.json(apiForecast(25, 'Australia/Melbourne')) : new Response(null, { status: 503 })
  })
  await assert.rejects(checkJourneyWeather({ start: null, destination, time: '13:30', now }))
  assert.equal(count, 0)
  await assert.rejects(checkJourneyWeather({ start, destination, time: '13:30', now }))
  assert.equal(count, 2)
})
