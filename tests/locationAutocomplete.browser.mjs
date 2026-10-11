// Browser interaction regression tests. All provider responses here are synthetic
// and intercepted; this does not verify a live Geoapify key or provider coverage.
import assert from 'node:assert/strict'
import { createServer } from 'vite'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ headless: true })
const server = await createServer({ server: { host: '127.0.0.1', port: 5187, strictPort: true }, define: { 'import.meta.env.VITE_GEOAPIFY_API_KEY': JSON.stringify('test-fixture-not-a-real-key') } })
await server.listen()
const missingServer = await createServer({ server: { host: '127.0.0.1', port: 5188, strictPort: true }, define: { 'import.meta.env.VITE_GEOAPIFY_API_KEY': JSON.stringify('') } })
await missingServer.listen()
const url = 'http://127.0.0.1:5187/travel-planner'
const sample = (index, destination) => ({ country_code: 'au', place_id: `fixture-${destination ? 'end' : 'start'}-${index}`, formatted: `Fixture ${destination ? 'campus' : 'Hawthorn'} ${index}, VIC, Australia`, name: `Fixture ${destination ? 'campus' : 'Hawthorn'} ${index}`, address_line2: 'VIC, Australia', lat: destination ? -37.9 : -37.8, lon: destination ? 145.1 : 145, timezone: { name: 'Australia/Melbourne' } })

async function open(mode, mobile = false) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.addInitScript(() => { localStorage.setItem('heatsafe-onboarding-complete', 'true'); localStorage.setItem('heatSafe.language', 'en') })
  const weatherCoordinates = []
  await page.route('https://api.geoapify.com/**', async (route) => {
    const query = new URL(route.request().url()).searchParams
    assert.equal(query.get('filter'), 'countrycode:au')
    assert.equal(query.get('bias'), 'proximity:144.9631,-37.8136')
    await new Promise((resolve) => setTimeout(resolve, 150))
    if (mode === 'network') return route.abort('failed')
    if (mode === 'credentials') return route.fulfill({ status: 403, body: '{}' })
    if (mode === 'rateLimit') return route.fulfill({ status: 429, headers: { 'Retry-After': '60' }, body: '{}' })
    const results = mode === 'empty' ? [] : Array.from({ length: 8 }, (_, i) => sample(i, query.get('text').startsWith('swi')))
    return route.fulfill({ json: { results } })
  })
  await page.route('https://api.open-meteo.com/**', async (route) => {
    const params = new URL(route.request().url()).searchParams
    weatherCoordinates.push([params.get('latitude'), params.get('longitude')])
    const times = Array.from({ length: 4 * 24 }, (_, i) => {
      const date = new Date(Date.now() + Math.floor(i / 24) * 86400000)
      const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
      return `${day}T${String(i % 24).padStart(2, '0')}:00`
    })
    const values = (n) => times.map(() => n)
    return route.fulfill({ json: { timezone: 'Australia/Melbourne', current: { time: times[0] }, daily: { time: [] }, hourly: {
      time: times, temperature_2m: values(25), apparent_temperature: values(25), relative_humidity_2m: values(50), uv_index: values(2), weather_code: values(0),
    } } })
  })
  await page.goto(mode === 'configuration' ? url.replace('5187', '5188') : url)
  const start = page.getByRole('combobox', { name: 'Starting location' })
  await start.waitFor()
  return { context, page, start, destination: page.getByRole('combobox', { name: 'Destination' }), weatherCoordinates }
}
try {
  for (const mobile of [false, true]) {
    const { context, page, start, destination, weatherCoordinates } = await open('ready', mobile)
    assert.equal(await start.inputValue(), '')
    await start.fill('haw')
    await page.getByText('Searching locations…', { exact: true }).first().waitFor()
    await page.getByRole('option').first().waitFor()
    const list = page.getByRole('listbox')
    const inputBox = await start.boundingBox()
    const listBox = await list.boundingBox()
    const destinationBox = await destination.boundingBox()
    assert.ok(listBox.y >= inputBox.y + inputBox.height, 'list sits below its input')
    assert.ok(destinationBox.y >= listBox.y + listBox.height, 'destination is not obscured')
    assert.ok(await list.evaluate((el) => el.scrollHeight > el.clientHeight), 'results scroll')
    assert.equal(await page.locator('#journey-location-help').count(), 1)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow')
    await page.screenshot({ path: `/tmp/heatsafe-autocomplete-${mobile ? 'mobile' : 'desktop'}.png`, fullPage: true })
    if (mobile) await page.getByRole('option').first().tap()
    else { await start.press('ArrowDown'); await start.press('Enter') }
    assert.match(await start.inputValue(), /Fixture Hawthorn 0/)
    assert.equal(await start.getAttribute('aria-expanded'), 'false')
    await destination.fill('swi')
    await page.getByRole('option').first().waitFor()
    await destination.press('ArrowDown')
    await destination.press('Enter')
    assert.match(await destination.inputValue(), /Fixture campus 0/)
    await page.getByLabel(/^Departure time/).fill('13:30')
    await start.fill('haw changed')
    await page.getByRole('option').first().waitFor()
    await start.press('Escape')
    assert.equal(await page.getByRole('listbox').count(), 0)
    await page.getByRole('button', { name: 'Check heat risk', exact: true }).click()
    await page.getByRole('alert').waitFor()
    assert.equal(weatherCoordinates.length, 0, 'edited text invalidates selected coordinates')
    await start.fill('haw')
    await page.getByRole('option').first().waitFor()
    await start.press('ArrowDown'); await start.press('Enter')
    await page.getByRole('button', { name: 'Check heat risk', exact: true }).click()
    await page.getByRole('heading', { name: 'Low heat risk for this journey.' }).waitFor()
    assert.deepEqual(weatherCoordinates, [['-37.8', '145'], ['-37.9', '145.1']], 'both selected coordinates reach weather service')
    await context.close()
    console.log(`${mobile ? 'Mobile touch' : 'Desktop keyboard'}: both fields, layout, selection, Escape, changed-input validation, and coordinates passed.`)
  }
  for (const mode of ['configuration', 'empty', 'credentials', 'rateLimit', 'network']) {
    const { context, page, start, destination } = await open(mode)
    for (const field of [start, destination]) {
      await field.fill('haw')
      const text = mode === 'empty' ? 'No matching locations. Try a longer name, street address or suburb.' : mode === 'rateLimit' ? 'Location search is temporarily rate-limited. Please wait before trying again.' : 'Location search is temporarily unavailable. Please try again.'
      await page.getByText(text, { exact: true }).first().waitFor()
      assert.equal(await page.getByText(/Add the Geoapify API key/).count(), 0)
      await field.press('Escape')
    }
    await context.close()
    console.log(`${mode}: both fields passed.`)
  }
} finally { await browser.close(); await server.close(); await missingServer.close() }
