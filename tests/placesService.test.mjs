import test from 'node:test'
import assert from 'node:assert/strict'
import { createPlacesClient, isSelectedPlace, normalisePlaces } from '../src/services/placesService.js'

// Synthetic API-shaped fixtures: test-only, not a live location catalogue.
const place = { country_code: 'au', place_id: 'fixture-place', formatted: 'Fixture campus, VIC, Australia', name: 'Fixture campus', address_line2: 'VIC, Australia', lat: -37.8, lon: 145, timezone: { name: 'Australia/Melbourne' } }
const success = () => Response.json({ results: [place] })

test('stores provider identity, full display name and coordinates; rejects invalid/non-Australian matches', () => {
  const values = normalisePlaces({ results: [place, place, { ...place, place_id: 'overseas', country_code: 'gb' }, { ...place, place_id: 'missing', lat: null }] })
  assert.equal(values.length, 1)
  assert.equal(values[0].placeId, place.place_id)
  assert.equal(values[0].displayName, place.formatted)
  assert.equal(values[0].latitude, place.lat)
  assert.equal(values[0].longitude, place.lon)
  assert.equal(values[0].address, place.address_line2)
  assert.ok(isSelectedPlace(values[0]))
  assert.equal(isSelectedPlace(null), false)
  assert.equal(isSelectedPlace({ ...values[0], placeId: '' }), false)
})

test('one-character search uses Australian filter and Melbourne bias without excluding amenities', async () => {
  let calls = 0
  const search = createPlacesClient({ apiKey: 'test-only', fetcher: async (url) => {
    calls++
    const params = new URL(url).searchParams
    assert.equal(params.get('text'), 'H')
    assert.equal(params.get('filter'), 'countrycode:au')
    assert.equal(params.get('bias'), 'proximity:144.9631,-37.8136')
    assert.equal(params.has('type'), false)
    return success()
  } })
  assert.deepEqual(await search(' '), [])
  assert.equal((await search('H')).length, 1)
  await search('h')
  assert.equal(calls, 1, 'normalised query is cached')
})

test('missing API key fails explicitly, without a fake fallback', async () => {
  const search = createPlacesClient({ fetcher: () => assert.fail('must not fetch') })
  await assert.rejects(search('Hawthorn'), { code: 'configuration' })
})

test('aborts in-flight searches and recovers the queue for the next query', async () => {
  const controller = new AbortController()
  let started
  const ready = new Promise((resolve) => { started = resolve })
  let calls = 0
  const search = createPlacesClient({ apiKey: 'test-only', fetcher: async (_url, { signal }) => {
    if (++calls > 1) return success()
    started()
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }))
  } })
  const first = search('H', { signal: controller.signal })
  const rejected = assert.rejects(first, { name: 'AbortError' })
  await ready
  controller.abort()
  await rejected
  assert.equal((await search('Ha')).length, 1)
})

test('cancelled queued requests never reach the API', async () => {
  const controller = new AbortController()
  controller.abort()
  const search = createPlacesClient({ apiKey: 'test-only', fetcher: () => assert.fail('must not fetch') })
  await assert.rejects(search('H', { signal: controller.signal }), { name: 'AbortError' })
})

test('shared queue spaces network starts at least 250 ms apart', async () => {
  const starts = []
  const search = createPlacesClient({ apiKey: 'test-only', fetcher: async () => { starts.push(Date.now()); return success() } })
  await Promise.all([search('A'), search('B'), search('C')])
  assert.equal(starts.length, 3)
  assert.ok(starts[1] - starts[0] >= 245)
  assert.ok(starts[2] - starts[1] >= 245)
})

test('429 Retry-After prevents subsequent requests during cooldown', async () => {
  let calls = 0
  const search = createPlacesClient({ apiKey: 'test-only', fetcher: async () => {
    calls++
    return new Response(null, { status: 429, headers: { 'Retry-After': '60' } })
  } })
  await assert.rejects(search('A'), { code: 'rateLimit' })
  await assert.rejects(search('B'), { code: 'rateLimit' })
  assert.equal(calls, 1)
})

test('empty, denied, malformed and failed responses stay distinct from real matches', async () => {
  assert.deepEqual(await createPlacesClient({ apiKey: 'test-only', fetcher: async () => Response.json({ results: [] }) })('A'), [])
  for (const fetcher of [async () => Response.json({}), async () => { throw new Error('offline') }]) {
    await assert.rejects(createPlacesClient({ apiKey: 'test-only', fetcher })('A'), { code: 'unavailable' })
  }
})


test('invalid credentials are classified without exposing a key or provider error body', async () => {
  for (const status of [401, 403]) {
    const search = createPlacesClient({ apiKey: 'test-only', fetcher: async () => new Response('private provider details', { status }) })
    await assert.rejects(search('haw'), { code: 'credentials', message: 'credentials' })
  }
})

test('whitespace-only configuration does not send a request', async () => {
  const search = createPlacesClient({ apiKey: '  ', fetcher: () => assert.fail('must not fetch') })
  await assert.rejects(search('haw'), { code: 'configuration' })
})
