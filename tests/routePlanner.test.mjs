import test from 'node:test'
import assert from 'node:assert/strict'
import { nextDeparture, localStamp } from '../src/utils/journeyTiming.js'
import { assessRoute, recommendRoutes } from '../src/utils/routeWeatherRisk.js'
import { computeJourneyRoutes, normaliseRoute, handleJourneyRoutes } from '../server/journeyRoutes.js'

const base = Date.parse('2026-10-11T02:00:00Z') // 13:00 Melbourne
const forecast = (temps, uv = 2) => ({ timezone: 'Australia/Melbourne', hourly: temps.map((apparentTemperature, i) => ({ epoch: base + i * 3600000, apparentTemperature, uvIndex: uv })) })
const route = (offset = 0, durationMinutes = 30, outdoorMinutes = 10) => ({ departure: base + offset * 60000, arrival: base + (offset + durationMinutes) * 60000, durationMinutes, outdoorMinutes, services: [], warnings: [] })

test('arrival weather and mid-journey peaks are included, using interpolation', () => {
  const result = assessRoute(forecast([25, 25, 25]), forecast([25, 43, 30]), route(0, 90))
  assert.equal(result.endpoints[1].apparentTemperature, 36.5)
  assert.equal(result.apparentTemperature, 43)
  assert.equal(result.risk, 'very-hot')
})
test('requires complete forecast coverage through arrival', () => {
  assert.equal(assessRoute(forecast([25]), forecast([25]), route()), null)
  assert.equal(assessRoute(forecast([25, 25]), forecast([25, null]), route()), null)
  assert.equal(assessRoute(forecast([25, 25]), forecast([25, 25]), { error: 'noRoute' }), null)
})
test('earliest meaningful improvement beats waiting indefinitely for coolest conditions', () => {
  const weather = forecast([39, 35, 30, 25])
  const result = recommendRoutes(weather, weather, [route(), route(60), route(120)], 'TRANSIT')
  assert.equal(result.recommendedTime, '14:00')
  assert.equal(result.reason, 'risk')
})
test('tiny improvement and significantly longer trips do not justify delay', () => {
  const weather = forecast([30, 29.8, 29.6, 29.4])
  assert.equal(recommendRoutes(weather, weather, [route(), route(60)], 'WALK').reason, 'same')
  const cooler = forecast([39, 30, 30, 30])
  assert.equal(recommendRoutes(cooler, cooler, [route(), route(60, 60)], 'TRANSIT').reason, 'same')
})
test('transit outdoor time affects selection without inventing a cooling adjustment', () => {
  const weather = forecast([30, 30, 30, 30])
  const result = recommendRoutes(weather, weather, [route(0, 40, 25), route(60, 40, 10)], 'TRANSIT')
  assert.equal(result.reason, 'outdoors')
  assert.equal(result.selected.apparentTemperature, result.recommended.apparentTemperature)
})
test('unavailable alternatives are counted, unavailable chosen departure blocks advice', () => {
  const weather = forecast([30, 30, 30])
  const result = recommendRoutes(weather, weather, [route(), { error: 'noRoute' }], 'TRANSIT')
  assert.equal(result.assessedCount, 1)
  assert.equal(result.requestedCount, 2)
  assert.equal(recommendRoutes(weather, weather, [{ error: 'noRoute' }, route(60)], 'TRANSIT'), null)
})
test('higher UV cannot be recommended just because it is cooler', () => {
  const weather = forecast([39, 30, 25])
  weather.hourly[1].uvIndex = 11
  assert.equal(recommendRoutes(weather, weather, [route(0, 0), route(60, 0)], 'WALK').reason, 'same')
})
test('location timezone, tomorrow, DST gaps and repeated times are handled', () => {
  assert.equal(nextDeparture('13:30', 'Australia/Melbourne', new Date('2026-10-11T00:00:00Z')), base + 1800000)
  assert.equal(localStamp(nextDeparture('09:00', 'Australia/Melbourne', new Date(base)), 'Australia/Melbourne'), '2026-10-12T09:00')
  assert.throws(() => nextDeparture('02:30', 'Australia/Melbourne', new Date('2026-10-03T15:00:00Z')), /invalidTime/)
  assert.equal(nextDeparture('02:30', 'Australia/Melbourne', new Date('2026-04-04T15:45:00Z')), Date.parse('2026-04-04T16:30:00Z'))
})
const request = { start: { latitude: -37.8, longitude: 145 }, destination: { latitude: -37.9, longitude: 145.1 }, mode: 'TRANSIT', departure: base, offsets: [0, 60, 120] }
const apiRoute = { mode: 'transit', time: 1800, distance: 1000, legs: [{ steps: [{ time: 300, instruction: { type: 'StartAt', text: 'Walk to the station.' } }, { time: 1200, instruction: { type: 'Transit', text: 'Take the fixture train.' } }] }] }
test('Geoapify duration stays an estimate without fabricated transit waiting or timetable data', () => {
  const result = normaliseRoute(apiRoute, base, 'TRANSIT')
  assert.equal(result.durationMinutes, 30)
  assert.equal(result.outdoorMinutes, null)
  assert.equal(result.arrival, base + 1800000)
  assert.deepEqual(result.services, [])
  assert.equal(result.instructions[1], 'Take the fixture train.')
})
test('one Geoapify request serves all weather candidates without exposing the key', async () => {
  const calls = []
  const result = await computeJourneyRoutes(request, { apiKey: 'synthetic-test-key', now: base, origin: 'http://localhost:5173', fetcher: async (url, options) => {
    const params = new URL(url).searchParams
    calls.push(url)
    assert.equal(params.get('apiKey'), 'synthetic-test-key')
    assert.equal(params.get('mode'), 'transit')
    assert.equal(params.get('waypoints'), '-37.8,145|-37.9,145.1')
    assert.equal(params.get('departureTime'), null)
    assert.equal(options.headers.Origin, 'http://localhost:5173')
    return Response.json({ results: [apiRoute] })
  } })
  assert.equal(calls.length, 1)
  assert.equal(result.body.results.length, 3)
  assert.equal(result.body.results[2].arrival, base + 150 * 60000)
  assert.ok(!JSON.stringify(result).includes('synthetic-test-key'))
})
test('missing transit, mode substitutions, empty and malformed routes do not fabricate journeys', () => {
  for (const data of [{ ...apiRoute, mode: 'walk' }, { ...apiRoute, time: null }, { ...apiRoute, time: -1 }, { ...apiRoute, legs: [] }]) {
    assert.equal(normaliseRoute(data, base, 'TRANSIT'), null)
  }
})
for (const [status, error] of [[429, 'rateLimit'], [403, 'credentials'], [400, 'noRoute'], [500, 'unavailable']]) {
  test(`Geoapify HTTP ${status} stays unavailable without provider-error/key leakage`, async () => {
    const result = await computeJourneyRoutes(request, { apiKey: 'test', now: base, fetcher: async () => new Response(null, { status }) })
    assert.equal(result.body.results[0].error, error)
  })
}
test('proxy rejects arbitrary parameters before spending requests and distinguishes missing configuration', async () => {
  let calls = 0
  const options = { now: base, fetcher: async () => { calls++; throw new Error() } }
  for (const change of [{ mode: 'FLY' }, { offsets: [0, 0] }, { offsets: [0, 500] }, { departure: NaN }, { start: { latitude: 70, longitude: 0 } }]) {
    assert.equal((await computeJourneyRoutes({ ...request, ...change }, options)).status, 400)
  }
  assert.equal((await computeJourneyRoutes(request, options)).body.error, 'configuration')
  assert.equal(calls, 0)
})
test('HTTP handler rejects non-POST and cross-site requests', async () => {
  for (const [method, site, expected] of [['GET', 'same-origin', 405], ['POST', 'cross-site', 403]]) {
    const res = { setHeader() {}, end() {} }
    await handleJourneyRoutes({ method, headers: { 'sec-fetch-site': site } }, res, {})
    assert.equal(res.statusCode, expected)
  }
})

test('driving uses approximated traffic and walking has full outdoor duration', async () => {
  const result = await computeJourneyRoutes({ ...request, mode: 'DRIVE', offsets: [0] }, { apiKey: 'test', now: base, fetcher: async (url) => {
    assert.equal(new URL(url).searchParams.get('traffic'), 'approximated')
    return Response.json({ results: [{ mode: 'drive', time: 2400, distance: 9000 }] })
  } })
  assert.equal(result.body.results[0].durationMinutes, 40)
  assert.equal(result.body.results[0].outdoorMinutes, null)
  assert.equal(normaliseRoute({ mode: 'walk', time: 1800, distance: 1500 }, base, 'WALK').outdoorMinutes, 30)
})

test('a hotter option is not recommended on a lower UV category alone', () => {
  const weather = forecast([25, 31, 31], 2)
  weather.hourly[0].uvIndex = 11
  assert.equal(recommendRoutes(weather, weather, [route(0, 0), route(60, 0)], 'TRANSIT').reason, 'same')
})
