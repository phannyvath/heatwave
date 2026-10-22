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
  const times = Array.from({ length: 48 }, (_, i) => Date.parse('2026-10-11T00:00:00Z') / 1000 + i * 3600)
  const values = (value) => times.map(() => value)
  return {
    timezone,
    current: { time: times[0], temperature_2m: temperature },
    hourly: { time: times, temperature_2m: values(temperature), apparent_temperature: values(temperature), relative_humidity_2m: values(50), uv_index: values(2), weather_code: values(0) },
    daily: { time: [] },
  }
}
const start = { provider: 'geoapify', placeId: 'fixture-origin', displayName: 'Fixture origin', latitude: -31.9, longitude: 115.8 }
const destination = { ...start, placeId: 'fixture-destination', displayName: 'Fixture destination', latitude: -37.8, longitude: 145 }

test('weather requests use selected coordinates and align destination to origin timezone', async (context) => {
  const urls = []
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url === '/api/journey-routes') {
      const { departure, mode, offsets } = JSON.parse(options.body)
      assert.equal(mode, 'TRANSIT')
      return Response.json({ results: offsets.map((offset) => ({ departure: departure + offset * 60000, arrival: departure + (offset + 30) * 60000, durationMinutes: 30, outdoorMinutes: 10, services: [], warnings: [] })) })
    }
    urls.push(new URL(url))
    return Response.json(apiForecast(urls.length === 1 ? 25 : 39, 'Australia/Perth'))
  })
  const result = await checkJourneyWeather({ start, destination, time: '13:30', now })
  assert.equal(urls.length, 2)
  assert.equal(urls[0].searchParams.get('timeformat'), 'unixtime')
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
  assert.equal(count, 3)
})

for (const [status, body, message] of [[503, { error: 'configuration' }, 'routesConfiguration'], [200, { results: [{ error: 'noRoute' }] }, 'noRoute'], [200, { results: [{ error: 'credentials' }] }, 'routesUnavailable']]) {
  test(`routing failure ${message} never yields a forecast-only recommendation`, async (context) => {
    context.mock.method(globalThis, 'fetch', async (url) => url === '/api/journey-routes' ? Response.json(body, { status }) : Response.json(apiForecast(25, 'Australia/Melbourne')))
    await assert.rejects(checkJourneyWeather({ start, destination, time: '13:30', now }), new RegExp(message))
  })
}

test('late departures exclude next-day and after-9pm alternatives', async (context) => {
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url !== '/api/journey-routes') return Response.json(apiForecast(25, 'Australia/Melbourne'))
    const { departure, offsets, mode } = JSON.parse(options.body)
    assert.deepEqual(offsets, [0])
    assert.equal(mode, 'WALK')
    return Response.json({ results: [{ departure, arrival: departure + 1800000, durationMinutes: 30, outdoorMinutes: 30, services: [], warnings: [] }] })
  })
  const result = await checkJourneyWeather({ start, destination, time: '20:30', method: 'WALK', now })
  assert.equal(result.journey.recommendedTime, '20:30')
  assert.equal(result.journey.requestedCount, 1)
})
