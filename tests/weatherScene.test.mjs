import test from 'node:test'
import assert from 'node:assert/strict'
import { getForecastDaylight, getWeatherScene, getWeatherSceneKind } from '../src/utils/weatherScene.js'
import { getHeatStatus } from '../src/utils/heatRisk.js'
import { makePreviewForecast } from '../src/dev/weatherFixtures.js'

test('all supported WMO codes select the appropriate atmosphere', () => {
  const groups = {
    clear: [0, 1], 'partly-cloudy': [2], overcast: [3], fog: [45, 48], storm: [95, 96, 97, 99],
    rain: [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82],
    snow: [71, 73, 75, 77, 85, 86], neutral: [undefined, null, NaN, -1, 100, '0'],
  }
  for (const [kind, codes] of Object.entries(groups)) {
    for (const code of codes) assert.equal(getWeatherSceneKind(code), kind, String(code))
  }
})

test('provider daylight wins; old cache sunrise/sunset works independent of browser timezone', () => {
  const forecast = makePreviewForecast('clear')
  forecast.current.isDay = false
  assert.equal(getForecastDaylight(forecast), false)
  delete forecast.current.isDay
  for (const [time, expected] of [['06:44', false], ['06:45', true], ['19:29', true], ['19:30', false], ['23:00', false]]) {
    forecast.current.time = `2026-10-08T${time}`
    assert.equal(getForecastDaylight(forecast), expected)
  }
  forecast.current.time = '2026-10-09T12:00'
  assert.equal(getForecastDaylight(forecast), true)
  forecast.daily = []
  assert.equal(getForecastDaylight(forecast), null)
  assert.equal(getForecastDaylight(null), null)
})

test('heat styling follows existing dashboard classification and does not override rain or night', () => {
  for (const state of ['clear', 'hot', 'hot-night', 'rain-night']) {
    const forecast = makePreviewForecast(state)
    const status = getHeatStatus({ forecast, climate: null })
    const scene = getWeatherScene(forecast, status)
    assert.equal(scene.hot, state.includes('hot'))
    assert.equal(scene.night, state.includes('night'))
    assert.equal(scene.kind, state.includes('rain') ? 'rain' : 'clear')
  }
  assert.equal(getWeatherScene(makePreviewForecast('rain'), { priority: 4 }).kind, 'rain')
  assert.equal(getWeatherScene(makePreviewForecast(), { priority: 2 }).hot, false)
})

test('unavailable, unrecognised, and missing day/night data cannot imply current conditions', () => {
  const neutral = { kind: 'neutral', night: false, hot: false, artwork: null }
  assert.deepEqual(getWeatherScene(null), neutral)
  assert.deepEqual(getWeatherScene(makePreviewForecast('neutral'), { priority: 4 }), neutral)
  assert.deepEqual(getWeatherScene(makePreviewForecast('hot-night'), { priority: 4 }, true), neutral)
  const forecast = makePreviewForecast()
  delete forecast.current.isDay
  forecast.daily = []
  assert.deepEqual(getWeatherScene(forecast), neutral)
})


test('each primary condition selects a distinct asset and documented combinations stay accurate', () => {
  const expected = { clear: 'sunny', 'partly-cloudy': 'partly-cloudy', overcast: 'overcast', rain: 'rainy', storm: 'thunderstorm', fog: 'foggy', night: 'clear-night', 'cloudy-night': 'cloudy-night', 'rain-night': 'rainy-night', hot: 'hot', 'hot-night': 'hot-night', snow: 'snow' }
  for (const [state, artwork] of Object.entries(expected)) {
    const forecast = makePreviewForecast(state)
    assert.equal(getWeatherScene(forecast, getHeatStatus({ forecast, climate: null })).artwork, artwork)
  }
  assert.equal(new Set(Object.values(expected)).size, 12)
  for (const state of ['fog-night', 'snow-night']) assert.equal(getWeatherScene(makePreviewForecast(state)).artwork, 'cloudy-night')
  assert.equal(getWeatherScene(makePreviewForecast('storm-night')).artwork, 'thunderstorm')
  for (const [state, artwork] of Object.entries({ rain: 'rainy', storm: 'thunderstorm', fog: 'foggy', snow: 'snow', overcast: 'overcast' })) {
    assert.equal(getWeatherScene(makePreviewForecast(state), { priority: 4 }).artwork, artwork)
  }
})
