import test from 'node:test'
import assert from 'node:assert/strict'
import { recommendDeparture } from '../src/utils/departureForecast.js'
import { calculateHeatRisk } from '../src/utils/calculateHeatRisk.js'
const base = Date.parse('2030-01-01T23:00:00Z')
const forecast = values => ({ timezone: 'UTC', hourly: { time: values.map((_, i) => (base + i * 3600000) / 1000), temperature_2m: values, apparent_temperature: values } })
for (const temperature of [25, 32, 37.9, 38, 42]) {
  test(`reuses existing category at ${temperature}°C`, () => {
    const result = recommendDeparture(forecast([temperature, 30, 20]), base + 1830000, 12)
    assert.equal(result.selected.category, calculateHeatRisk({ apparentTemperature: temperature }))
    assert.equal(result.selected.departure, base + 1830000)
    assert.equal(result.selected.epoch, base)
    if (temperature < 38) assert.equal(result.recommended.departure, base + 1830000)
  })
}
test('earliest mild interval after departure wins, including next-day dates', () => {
  const result = recommendDeparture(forecast([43, 39, 34, 22]), base + 1830000, 8)
  assert.equal(result.kind, 'cooler')
  assert.equal(result.recommended.departure, base + 7200000)
  assert.equal(result.recommended.arrival, base + 7200000 + 480000)
})
test('no mild period chooses coolest upcoming, even when still hot', () => {
  const result = recommendDeparture(forecast([43, 41, 39, 40]), base + 1800000, 4)
  assert.equal(result.kind, 'no-mild')
  assert.equal(result.recommended.apparentTemperature, 39)
  assert.equal(result.recommended.category, 'hot')
})
test('missing selected data and gaps are not interpolated or invented', () => {
  assert.throws(() => recommendDeparture(forecast([null, 30]), base + 1800000, 12), /No forecast/)
  assert.throws(() => recommendDeparture(forecast([30]), base + 3600000, 12), /No forecast/)
  assert.throws(() => recommendDeparture({}, base, 12), /unavailable/)
  const data = forecast([43, null, 30])
  assert.equal(recommendDeparture(data, base + 1800000, 12).missingPeriods, 1)
})
test('no later data retains selected time honestly', () => {
  assert.equal(recommendDeparture(forecast([43]), base + 1800000, 12).kind, 'no-upcoming')
})
