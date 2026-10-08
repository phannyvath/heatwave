// Run with PLAYWRIGHT_PATH pointing to a locally installed Playwright package.
// All network fixtures are confined to this fresh browser context.
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { makePreviewForecast, previewStates } from '../src/dev/weatherFixtures.js'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')
const base = process.env.WEATHER_TEST_URL || 'http://127.0.0.1:5175'
const artifacts = process.env.WEATHER_TEST_ARTIFACTS || '/private/tmp/heatsafe-weather-checks'
await mkdir(artifacts, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const errors = []
const results = []
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Australia/Melbourne' })
  const page = await context.newPage()
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${base}/__dev/weather`)
  await page.locator('.weather-card').waitFor()
  await page.evaluate(() => document.fonts.ready)
  const assetURLs = new Set()
  const states = previewStates.filter(state => !['loading', 'error'].includes(state))
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const state of states) {
      await page.getByRole('combobox').selectOption(state)
      await page.waitForFunction((state) => document.querySelector('.weather-card').dataset.night === String(state.includes('night')), state)
      if (state !== 'neutral') {
        await page.waitForFunction(() => document.querySelector('.weather-scene').dataset.ready === 'true')
        const image = page.locator('.weather-scene__layer').last().locator('img')
        assert.ok(await image.evaluate(el => el.complete && el.naturalWidth > 0), `image loaded ${state}`)
        assert.equal(await image.evaluate(el => getComputedStyle(el).filter), 'none')
        const src = await image.getAttribute('src')
        assert.ok(src.includes('/weather/'))
        assetURLs.add(src)
        const active = page.locator('.weather-scene__layer').last()
        const rain = ['rain', 'rain-night'].includes(state)
        const storm = ['storm', 'storm-night'].includes(state)
        const snow = ['snow', 'snow-night'].includes(state)
        assert.equal(await active.locator('.weather-scene__precipitation i').count(), storm ? 38 : rain || snow ? 24 : 0)
        assert.equal(await active.locator('.weather-scene__fog').count(), ['fog', 'fog-night'].includes(state) ? 1 : 0)
        assert.equal(await active.locator('.weather-scene__stars i').count(), ['night', 'hot-night'].includes(state) ? 18 : 0)
        assert.equal(await active.locator('.weather-scene__shimmer').count(), state.includes('hot') ? 1 : 0)
      }
      assert.equal(await page.locator('.weather-card__metric').count(), 6)
      assert.equal(await page.locator('.weather-scene').getAttribute('aria-hidden'), 'true')
      assert.equal(await page.locator('.weather-scene').evaluate((el) => getComputedStyle(el).pointerEvents), 'none')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
      assert.equal(overflow, false, `overflow ${width} ${state}`)
      const clipped = await page.locator('.weather-card__metric').evaluateAll((els) => els.some((el) => el.scrollWidth > el.clientWidth + 1))
      assert.equal(clipped, false, `metric clipping ${width} ${state}`)
      const animations = await page.locator('.weather-scene').evaluate((el) => el.getAnimations({ subtree: true }).length)
      assert.equal(animations > 0, state !== 'neutral', `animation ${state}`)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      assert.equal(await page.locator('.weather-card').evaluate((el) => el.getAnimations({ subtree: true }).length), 0, `reduced motion ${state}`)
      if ([390, 1440].includes(width) && state !== 'neutral') {
        await page.locator('.weather-card').screenshot({ path: `${artifacts}/preview-${width}-${state}.png` })
      }
      await page.emulateMedia({ reducedMotion: 'no-preference' })
    }
  }
  assert.equal(assetURLs.size, 12, 'twelve distinct illustration files selected')
  results.push('64 viewport/weather combinations: six metrics, no horizontal overflow or clipped metrics, decorative accessibility, motion and static fallback')
  await page.getByRole('combobox').selectOption('clear')
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  assert.equal(await page.getByRole('button', { name: 'Refresh', exact: true }).isDisabled(), true)
  await page.waitForFunction(() => !document.querySelector('.weather-card button').disabled)
  results.push('Preview Refresh simulation disables then restores the control')
  await page.getByRole('combobox').selectOption('loading')
  assert.equal(await page.locator('[aria-busy="true"]').count(), 1)
  await page.getByRole('combobox').selectOption('error')
  await page.getByRole('button', { name: 'Try again (simulation)' }).click()
  await page.locator('.weather-card').waitFor()
  await context.close()

  // Exercise the real Dashboard/useWeather/fetchForecast path with isolated API responses.
  const app = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Australia/Melbourne' })
  await app.addInitScript(() => {
    localStorage.setItem('heatsafe-onboarding-complete', 'true')
    localStorage.setItem('heatSafe.language', 'en')
    localStorage.setItem('heatsafe-selected-location', JSON.stringify({ name: 'Melbourne', state: 'VIC', latitude: -37.8229, longitude: 145.0351, source: 'manual' }))
  })
  let failed = false
  let calls = 0
  let scene = 'clear'
  let lastURL = ''
  let pendingForecast
  await app.route('**/v1/forecast?**', async (route) => {
    calls++
    lastURL = route.request().url()
    if (pendingForecast) await pendingForecast
    if (failed) return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
    const f = makePreviewForecast(scene)
    const data = {
      current: { time: f.current.time, is_day: f.current.isDay ? 1 : 0, temperature_2m: f.current.temperature, apparent_temperature: f.current.apparentTemperature, relative_humidity_2m: f.current.humidity, weather_code: f.current.weatherCode, wind_speed_10m: f.current.windSpeed },
      hourly: { time: f.hourly.map(x => x.time), temperature_2m: f.hourly.map(x => x.temperature), apparent_temperature: f.hourly.map(x => x.apparentTemperature), relative_humidity_2m: f.hourly.map(x => x.humidity), uv_index: f.hourly.map(x => x.uvIndex), weather_code: f.hourly.map(x => x.weatherCode) },
      daily: { time: f.daily.map(x => x.date), temperature_2m_max: f.daily.map(x => x.max), temperature_2m_min: f.daily.map(x => x.min), apparent_temperature_max: f.daily.map(x => x.apparentMax), uv_index_max: f.daily.map(x => x.uvMax), sunrise: f.daily.map(x => x.sunrise), sunset: f.daily.map(x => x.sunset) }, timezone: f.timezone,
    }
    await route.fulfill({ json: data })
  })
  await app.route('**/v1/archive?**', route => route.fulfill({ json: { daily: { temperature_2m_max: [26], temperature_2m_min: [15] } } }))
  const dashboard = await app.newPage()
  dashboard.on('pageerror', error => errors.push(error.message))
  let release
  pendingForecast = new Promise(resolve => { release = resolve })
  await dashboard.goto(base)
  await dashboard.locator('[aria-busy="true"]').waitFor()
  assert.equal(await dashboard.locator('.weather-scene').count(), 0)
  release(); pendingForecast = null
  await dashboard.locator('.weather-card').waitFor()
  await dashboard.waitForFunction(() => document.querySelector('.weather-scene').dataset.ready === 'true')
  assert.ok(new URL(lastURL).searchParams.get('current').split(',').includes('is_day'))
  assert.equal(await dashboard.locator('.weather-card').getAttribute('data-night'), 'false')
  await dashboard.emulateMedia({ reducedMotion: 'reduce' })
  await dashboard.screenshot({ path: `${artifacts}/dashboard-desktop.png`, fullPage: true })
  for (const width of [320, 390, 768, 1440]) {
    await dashboard.setViewportSize({ width, height: 1000 })
    assert.equal(await dashboard.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `dashboard overflow at ${width}`)
  }
  await dashboard.setViewportSize({ width: 390, height: 844 })
  await dashboard.screenshot({ path: `${artifacts}/dashboard-mobile.png`, fullPage: true })
  const beforeCalls = calls
  scene = 'night'
  pendingForecast = new Promise(resolve => { release = resolve })
  await dashboard.getByRole('button', { name: 'Refresh', exact: true }).click()
  assert.equal(await dashboard.getByRole('button', { name: 'Refresh', exact: true }).isDisabled(), true)
  release(); pendingForecast = null
  await dashboard.waitForFunction(() => document.querySelector('.weather-card').dataset.night === 'true')
  await dashboard.waitForFunction(() => !document.querySelector('.weather-card button').disabled)
  assert.ok(calls > beforeCalls)
  assert.ok((await dashboard.locator('.weather-card__temperature').innerText()).includes('17'))
  results.push('Real dashboard: loading skeleton, provider is_day request, desktop/mobile layouts, Refresh request and night response update')
  failed = true
  await dashboard.getByRole('button', { name: 'Refresh', exact: true }).click()
  await dashboard.waitForFunction(() => document.querySelector('.weather-card').dataset.scene === 'neutral')
  assert.ok((await dashboard.locator('main').innerText()).includes('Showing previously downloaded weather data.'))
  assert.equal(await dashboard.locator('.weather-card__metric').count(), 6)
  results.push('Failed Refresh preserves cached values and feedback, with a neutral background')
  await dashboard.evaluate(() => localStorage.removeItem('heatsafe-weather-cache'))
  await dashboard.reload()
  await dashboard.getByRole('button', { name: 'Try again', exact: true }).waitFor()
  assert.equal(await dashboard.locator('.weather-card').count(), 0)
  failed = false
  await dashboard.getByRole('button', { name: 'Try again', exact: true }).click()
  await dashboard.locator('.weather-card').waitFor()
  results.push('Uncached failure keeps error/retry UI; retry recovers successfully')
  await dashboard.getByRole('button', { name: 'Open navigation menu' }).click()
  await dashboard.getByRole('navigation', { name: 'Mobile menu' }).getByRole('link', { name: /learn/i }).click()
  await dashboard.waitForURL('**/learn')
  results.push('Mobile navigation remains functional')
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ status: 'PASS', results, artifacts }, null, 2))
  await app.close()
} finally { await browser.close() }
