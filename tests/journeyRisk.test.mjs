import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateJourney } from '../src/utils/journeyRisk.js'

// Synthetic fixtures used only in tests, never displayed as live weather.
const now = new Date('2026-10-11T00:00:00Z') // 11 AM Melbourne
const hour = (time, apparentTemperature, uvIndex = 3) => ({ time: `2026-10-11T${time}`, apparentTemperature, uvIndex })
const forecast = { timezone: 'Australia/Melbourne', hourly: [hour('13:00', 39, 11), hour('17:00', 33), hour('20:00', 28), hour('21:00', 20)] }

test('risk uses weather and one later recommendation excludes overnight departures', () => {
  const result = calculateJourney(forecast, '13:30', now)
  assert.equal(result.risk, 'hot')
  assert.equal(result.recommendedTime, '20:00')
  const applied = calculateJourney(forecast, result.recommendedTime, now)
  assert.equal(applied.risk, 'comfortable')
  assert.equal(applied.recommendedTime, '20:00')
})

test('same departure time can produce every risk level from actual hourly conditions', () => {
  for (const [temperature, uv, risk] of [[25, 2, 'comfortable'], [32, 3, 'warm'], [38, 3, 'hot'], [42, 3, 'very-hot'], [25, 11, 'hot']]) {
    assert.equal(calculateJourney({ ...forecast, hourly: [hour('13:00', temperature, uv)] }, '13:30', now).risk, risk)
  }
})

test('never fabricates a risk for missing or invalid weather', () => {
  for (const data of [null, { ...forecast, hourly: [] }, { ...forecast, hourly: [hour('13:00', null)] }, { ...forecast, hourly: [hour('13:00', 25, null)] }]) {
    assert.equal(calculateJourney(data, '13:30', now), null)
  }
  assert.equal(calculateJourney(forecast, '25:30', now), null)
})

test('past wall times roll to tomorrow using location timezone, independent of browser', () => {
  const data = { ...forecast, hourly: [{ time: '2026-10-12T09:00', apparentTemperature: 25, uvIndex: 2 }] }
  const result = calculateJourney(data, '09:30', now)
  assert.equal(result.date, '2026-10-12')
  assert.equal(result.recommendedTime, '09:30')
  assert.equal(calculateJourney(forecast, '09:30', now), null)
})

test('retains chosen minutes when later weather offers no improvement', () => {
  const data = { ...forecast, hourly: [hour('13:00', 26), hour('14:00', 26), hour('15:00', 28)] }
  assert.equal(calculateJourney(data, '13:30', now).recommendedTime, '13:30')
})

test('does not recommend lower temperature with a higher heat-risk category', () => {
  const data = { ...forecast, hourly: [hour('13:00', 30, 2), hour('14:00', 25, 11)] }
  assert.equal(calculateJourney(data, '13:30', now).recommendedTime, '13:30')
})
