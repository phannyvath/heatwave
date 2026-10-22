import assert from 'node:assert/strict'
import { createServer } from 'vite'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const server = await createServer({ server: { host: '127.0.0.1', port: 5192, strictPort: true } })
let browser
try {
  await server.listen()
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) })
  for (const [mobile, offline] of [[false, true], [true, true], [false, false]]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1100 } })
    const page = await context.newPage()
    await page.addInitScript(() => {
      localStorage.setItem('heatsafe-onboarding-complete', 'true')
      localStorage.setItem('heatSafe.language', 'en')
      window.demoGeolocationCalls = 0
      navigator.geolocation.getCurrentPosition = () => { window.demoGeolocationCalls++ }
    })
    await page.route('**/*.tile.openstreetmap.org/**', route => offline ? route.abort() : route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9l8AAAAASUVORK5CYII=', 'base64') }))
    await page.goto('http://127.0.0.1:5192/cool-places')
    await page.getByRole('button', { name: 'List', exact: true }).click()
    const triggers = page.getByRole('button', { name: 'Get directions', exact: true })
    for (let i = 0; i < 2; i++) {
      const trigger = triggers.nth(i)
      const name = await trigger.locator('xpath=../..').getByRole('heading').textContent()
      await trigger.click()
      const dialog = page.getByRole('dialog')
      await dialog.waitFor()
      assert.equal(await dialog.getByRole('heading', { level: 2 }).textContent(), `Directions to ${name}`)
      assert.equal(await dialog.getByLabel('Destination', { exact: true }).inputValue(), name)
      assert.equal(await dialog.locator('.demo-map-label').last().textContent(), name)
      if (offline) await dialog.getByText('Map tiles unavailable.', { exact: false }).waitFor()
      else {
        await dialog.locator('.leaflet-tile-loaded').first().waitFor()
        const layers = await dialog.locator('.leaflet-tile-pane').evaluate(el => ({ fallback: getComputedStyle(el.querySelector('.leaflet-image-layer')).zIndex, tiles: getComputedStyle(el.querySelector('.leaflet-layer:not(.leaflet-image-layer)')).zIndex }))
        assert.ok(Number(layers.tiles) > Number(layers.fallback), 'street tiles display above fallback')
      }
      assert.ok(await dialog.locator('.leaflet-image-layer').evaluate(el => el.complete && el.naturalWidth > 0))
      assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Close demo directions')
      await page.keyboard.press('Shift+Tab')
      assert.ok(await dialog.evaluate(el => el.contains(document.activeElement)), 'focus stays in dialog')
      for (const [mode, time, distance] of [['Public transport', '8 minutes', '200 m walking'], ['Driving', '4 minutes', '1.2 km'], ['Walking', '12 minutes', '850 m']]) {
        const button = dialog.getByRole('button', { name: new RegExp(mode) })
        await button.click()
        assert.equal(await button.getAttribute('aria-pressed'), 'true')
        const journey = await dialog.locator('section').textContent()
        assert.ok(journey.includes(name) && journey.includes(time) && journey.includes(distance))
        if (mode === 'Public transport') assert.equal(await dialog.locator('path[stroke-dasharray="4 10"]').count(), 2)
      }
      const map = await dialog.locator('.demo-directions-map').boundingBox()
      const frame = await dialog.boundingBox()
      assert.ok(map.width > 250 && map.height >= 300 && map.x >= frame.x && map.x + map.width <= frame.x + frame.width)
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      await dialog.getByRole('button', { name: 'Zoom in', exact: true }).click()
      await page.keyboard.press('Escape')
      assert.equal(await page.getByRole('dialog').count(), 0)
      assert.ok(await trigger.evaluate(el => el === document.activeElement), 'focus returns to clicked location')
    }
    assert.equal(await page.evaluate(() => window.demoGeolocationCalls), 0)
    await context.close()
    console.log(`PASS ${mobile ? 'mobile' : 'desktop'}: two destinations, transport, ${offline ? 'fallback' : 'loaded tiles'}, zoom, focus, Escape, no geolocation`)
  }
} finally {
  await browser?.close()
  await server.close()
}
