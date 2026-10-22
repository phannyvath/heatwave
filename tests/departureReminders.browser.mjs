import assert from 'node:assert/strict'
import { createServer } from 'vite'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const server = await createServer({ define: { 'import.meta.env.VITE_GEOAPIFY_API_KEY': JSON.stringify('test-fixture') }, server: { host: '127.0.0.1', port: 5193, strictPort: true } })
let browser
try {
  await server.listen()
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) })
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, timezoneId: 'Australia/Melbourne' })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => {
      localStorage.setItem('heatsafe-onboarding-complete', 'true')
      localStorage.setItem('heatSafe.language', 'en')
      window.notificationRequests = 0
      Notification.requestPermission = () => { window.notificationRequests++; return Promise.resolve('denied') }
    })
    let scenario = 'comfortable'
    let base = Math.ceil(Date.now() / 3600000) * 3600000
    const selected = base + 30 * 60000 + 25000
    const requests = []
    await page.route('https://api.geoapify.com/**', route => {
      const start = new URL(route.request().url()).searchParams.get('text').includes('Start')
      return route.fulfill({ json: { results: [{ country_code: 'au', place_id: start ? 'start' : 'dest', formatted: start ? 'Demo Start, Melbourne' : 'Demo Library, Melbourne', name: start ? 'Demo Start' : 'Demo Library', lat: start ? -37.81 : -37.9, lon: start ? 144.96 : 145.1 }] } })
    })
    await page.route('https://api.open-meteo.com/**', route => {
      const params = new URL(route.request().url()).searchParams
      requests.push([params.get('latitude'), params.get('longitude')])
      if (scenario === 'missing') return route.fulfill({ status: 503, body: '{}' })
      const values = { comfortable: [26, 25, 24, 23], warm: [34, 30, 25, 22], hot: [39, 39, 34, 22], veryhot: [43, 39, 34, 22], none: [43, 41, 39, 40] }[scenario]
      return route.fulfill({ json: { timezone: 'Australia/Melbourne', hourly: { time: values.map((_, i) => (base + i * 3600000) / 1000), temperature_2m: values.map(v => v - 2), apparent_temperature: values } } })
    })
    await page.goto('http://127.0.0.1:5193/travel-planner')
    for (const [label, value] of [['Starting location', 'Demo Start'], ['Destination', 'Demo Library']]) {
      await page.getByRole('combobox', { name: label, exact: true }).fill(value)
      await page.getByRole('listbox').getByRole('option').first().click()
    }
    const departure = page.getByLabel('Departure date and time')
    const generate = page.getByRole('button', { name: 'Generate travel recommendation', exact: true })
    const modal = page.getByRole('dialog', { name: 'Your travel recommendation', exact: true })
    const bell = page.locator('[data-reminder-bell]')
    const popover = page.getByRole('dialog', { name: 'Departure reminders', exact: true })
    const due = page.getByRole('dialog', { name: 'Time to leave for Demo Library', exact: true })
    const local = epoch => page.evaluate(epoch => { const d = new Date(epoch); return new Date(epoch - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace(/:00$/, '') }, epoch)
    const open = async epoch => { await departure.fill(await local(epoch)); await generate.click(); await modal.getByText(/Forecast: Open-Meteo/).waitFor() }
    for (const mode of ['comfortable', 'warm']) {
      scenario = mode
      await open(selected)
      await modal.getByText('You’re good to go', { exact: true }).waitFor()
      assert.equal(Date.parse(await modal.getByTestId('recommended-departure').getAttribute('datetime')), selected)
      await page.keyboard.press('Shift+Tab')
      assert.ok(await modal.evaluate(el => el.contains(document.activeElement)))
      await modal.getByRole('button', { name: 'Back to edit', exact: true }).click()
      assert.equal(await departure.inputValue(), await local(selected))
      assert.match(await bell.getAttribute('aria-label'), /0 upcoming enabled/)
    }
    for (const mode of ['hot', 'veryhot']) {
      scenario = mode
      await page.getByLabel('Transportation', { exact: true }).selectOption('TRANSIT')
      await open(selected)
      assert.equal(Date.parse(await modal.getByTestId('recommended-departure').getAttribute('datetime')), base + 7200000)
      await modal.getByRole('button', { name: 'Use recommended time', exact: true }).click()
      assert.equal(await departure.inputValue(), await local(base + 7200000))
      assert.match(await bell.getAttribute('aria-label'), /0 upcoming enabled/)
      assert.equal(await modal.getByRole('button', { name: 'Set departure reminder', exact: true }).count(), 1)
      await modal.getByRole('button', { name: 'Keep my selected time', exact: true }).click()
      assert.equal(await departure.inputValue(), await local(selected))
      await page.keyboard.press('Escape')
    }
    scenario = 'none'
    await open(selected)
    await modal.getByText('No Comfortable or Warm period found', { exact: true }).waitFor()
    assert.ok((await modal.textContent()).includes('it remains Hot'))
    assert.equal(Date.parse(await modal.getByTestId('recommended-departure').getAttribute('datetime')), base + 7200000)
    await page.keyboard.press('Escape')
    scenario = 'missing'
    await departure.fill(await local(selected))
    await generate.click()
    await modal.getByRole('button', { name: 'Retry forecast', exact: true }).waitFor()
    assert.equal(await modal.getByRole('button', { name: 'Set departure reminder', exact: true }).count(), 0)
    scenario = 'warm'
    await modal.getByRole('button', { name: 'Retry forecast', exact: true }).click()
    await modal.getByText('You’re good to go', { exact: true }).waitFor()
    await modal.getByRole('button', { name: 'Set departure reminder', exact: true }).click()
    await page.getByText('Departure reminder added.', { exact: true }).waitFor()
    await open(selected)
    await modal.getByRole('button', { name: 'Set departure reminder', exact: true }).click()
    await modal.getByText('A reminder already exists for this travel plan and departure time.').waitFor()
    await page.keyboard.press('Escape')
    await bell.click()
    assert.equal(Date.parse(await popover.locator('time').getAttribute('datetime')), selected)
    await popover.getByRole('switch').press('Space')
    assert.match(await bell.getAttribute('aria-label'), /0 upcoming enabled/)
    await page.reload()
    await bell.click()
    assert.equal(await popover.getByRole('switch').getAttribute('aria-checked'), 'false')
    await popover.getByRole('switch').click()
    assert.match(await bell.getAttribute('aria-label'), /1 upcoming enabled/)
    await popover.getByRole('button', { name: 'Cancel reminder', exact: true }).click()
    await popover.getByText('No departure reminders', { exact: true }).waitFor()
    await page.keyboard.press('Escape')
    base = Math.floor(Date.now() / 3600000) * 3600000
    await open(Math.floor((Date.now() + 6000) / 1000) * 1000)
    await modal.getByRole('button', { name: 'Set departure reminder', exact: true }).click()
    await bell.click()
    await popover.getByRole('switch').click()
    await page.keyboard.press('Escape')
    await page.waitForTimeout(6500)
    assert.equal(await due.count(), 0, 'disabled reminder never triggers')
    await bell.click()
    await popover.getByRole('button', { name: 'Cancel reminder', exact: true }).click()
    await page.keyboard.press('Escape')
    await open(Math.floor((Date.now() + 5000) / 1000) * 1000)
    await modal.getByRole('button', { name: 'Set departure reminder', exact: true }).click()
    await due.waitFor({ timeout: 10000 })
    await due.getByRole('button', { name: 'Dismiss', exact: true }).click()
    await page.reload()
    await generate.waitFor()
    await page.waitForTimeout(1500)
    assert.equal(await due.count(), 0)
    assert.ok(requests.every(([lat, lon]) => lat === '-37.81' && lon === '144.96'), 'only starting-location forecast is fetched')
    assert.equal(await page.evaluate(() => window.notificationRequests), 0)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    assert.deepEqual(errors, [])
    await context.close()
    console.log(`PASS ${mobile ? 'mobile' : 'desktop'}: comfortable/warm, hot/very hot, earliest cooler, no mild period, retry, exact times, explicit actions, reminder toggle/persistence/duplicates/alert once`)
  }
} finally { await browser?.close(); await server.close() }
