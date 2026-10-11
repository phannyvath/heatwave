import { loadEnv } from 'vite'
import { createPlacesClient } from '../src/services/placesService.js'

const args = process.argv.slice(2)
const mode = args.includes('--production') ? 'production' : 'development'
const env = loadEnv(mode, process.cwd(), 'VITE_')
const apiKey = env.VITE_GEOAPIFY_API_KEY?.trim()
if (!apiKey) {
  console.error(`Missing VITE_GEOAPIFY_API_KEY in Vite ${mode} configuration. Set it in .env.local and restart Vite, or in Vercel Project Settings > Environment Variables and redeploy.`)
  process.exitCode = 1
} else if (!args.includes('--live')) {
  console.log(`Vite ${mode}: VITE_GEOAPIFY_API_KEY is configured. Its value is hidden. Live access has not been verified; run with --live --origin https://your-site.example to check.`)
} else {
  const originIndex = args.indexOf('--origin')
  let origin
  try {
    origin = new URL(originIndex >= 0 ? args[originIndex + 1] : 'http://localhost:5173').origin
    const search = createPlacesClient({ apiKey, fetcher: (url, options) => fetch(url, {
      ...options, headers: { Origin: origin, Referer: `${origin}/` },
    }) })
    const results = await search('haw')
    console.log(`Live Australian search for "haw": ${results.length} valid locations returned. Hawthorn match: ${results.some((p) => /hawthorn/i.test(p.displayName))}.`)
    if (!results.length) process.exitCode = 1
  } catch (error) {
    // Never print errors/URLs supplied by fetch: they may contain the API key.
    console.error(`Live verification failed (${['credentials', 'rateLimit', 'unavailable'].includes(error.code) ? error.code : 'request/configuration error'}). Check your key, allowed site origins and network. No credentials were logged.`)
    process.exitCode = 1
  }
}
