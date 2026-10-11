# HeatSafe

React/Vite heat-safety planner. Journey locations are selected from **Geoapify Address Autocomplete**; weather comes from **Open-Meteo**. No mock locations or weather are used in the Travel Planner.

## Run locally

1. Install dependencies with `npm install` (Node 20.19+ or 22.12+).
2. Create a project and API key at [Geoapify MyProjects](https://myprojects.geoapify.com/).
3. Copy `.env.example` to `.env.local`, then set `VITE_GEOAPIFY_API_KEY` to your own key.
4. In Geoapify, restrict this dedicated browser key to the allowed origins/referrers for your site, including the actual Vite local URL during development. Remove development access from production-only keys. Vite variables prefixed with `VITE_` are public, not secrets: they are embedded in the browser bundle. Do not use a server/private credential. `.env.local` is ignored by Git.
5. Run `npm run dev`. Restart Vite after changing environment variables. For deployment, set the same variable in the build environment and rebuild with `npm run build`.

Without the key, the inputs show a neutral unavailable message and cannot yield valid selections; the app never substitutes example locations. An API key has not been supplied in this repository. Other pages keep their existing location services.

## Location search

Implementation follows the [Geoapify autocomplete API](https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/) and [integration guidance](https://apidocs.geoapify.com/how-to/addresses/add-address-autocomplete/):

- `filter=countrycode:au` allows locations throughout Australia. `bias=proximity:144.9631,-37.8136` favours Melbourne and nearby Victorian matches without excluding interstate results. No type filter excludes universities, named places or addresses.
- Searches begin with one non-whitespace character. The API accepts partial text and documents no larger minimum; quality/availability for a single letter depends on provider data. Try `H`, `Hawthorn`, `Heidelberg`, `Carlton`, `Swinburne`, a street address, and an interstate city. No particular match is fabricated or guaranteed.
- A 300 ms debounce, abortable requests, stale-response guards, a bounded five-minute memory cache and a shared request queue limit traffic across both inputs. Starts are spaced by at least 250 ms (four/second per browser). HTTP 429 respects `Retry-After`, with a 60-second fallback and no automatic retries. Requests time out after 10 seconds.
- The [published free plan](https://www.geoapify.com/pricing/) currently allows five requests/second and 3,000 credits/day. These limits apply to the account across users: client throttling cannot enforce a global quota. Monitor project usage; for a larger deployment, use a server-side proxy with a shared quota limiter or an appropriate plan. Never expose a private proxy credential in a `VITE_` variable.
- Dropdowns show provider names and supporting addresses with Geoapify/OpenStreetMap attribution. Selecting stores `{ provider, placeId, displayName, name, address, latitude, longitude, state, timezone }` in form state. Editing the text immediately invalidates that selection. Selections are not persisted after leaving the page.
- Arrow keys navigate, Enter selects, Escape dismisses, and Tab leaves the field. Loading, no matches, service/rate-limit errors are announced. On touch screens, rows are tappable and the dropdown scrolls.

## Weather assessment and duration

On **Check heat risk**, fresh forecasts are requested using the two selected coordinates. The destination request uses the origin forecast's timezone, so both endpoints are compared at the same instant, even across Australian timezones. The selected time means its next occurrence in the origin's timezone; an hourly forecast is used for that departure hour.

The existing heat-risk thresholds are applied to the two endpoints; the higher risk determines the result. One recommendation minimises the combined endpoint risk, then maximum apparent temperature, among the selected departure and later forecast hours before 9 PM on the same day. Equal candidates keep the earlier departure. If either endpoint's required forecast is missing, the result is unavailable; there is no silent partial assessment, Hawthorn fallback or synthetic weather.

This is **endpoint weather at departure**, not a route, transfer, exposure or arrival assessment. The UI explicitly says so. Duration is an optional, positive whole number of minutes supplied by the user. There is no routing service, fixed 42-minute journey, or driving-time substitute for public transport. Initial journey fields are empty.

Open-Meteo's public endpoint requires no API key for non-commercial use; check its [current terms and commercial options](https://open-meteo.com/en/terms) before a commercial deployment. Search text is sent to Geoapify; selected coordinates are sent to Open-Meteo. The app does not log keys, search queries or location selections.

## Validation

```sh
node --test tests/*.test.mjs
npm run build
```

Tests use explicitly synthetic fixtures and mocked HTTP responses only in test files. They do not prove live provider coverage. With your configured key, verify the searches above, keyboard/touch selection, editing after selection, offline/429 handling, and endpoint weather for two different Australian locations. Check narrow-screen layout, reduced motion, and the retained result/focus behaviour.

## Autocomplete configuration on Vercel and diagnosis

The exact variable is **`VITE_GEOAPIFY_API_KEY`**, read from `import.meta.env.VITE_GEOAPIFY_API_KEY`. This is a Vite React project, not Next.js: `GEOAPIFY_API_KEY` and `NEXT_PUBLIC_GEOAPIFY_API_KEY` will not configure this client.

- **Local:** put the value in `.env.local` beside `package.json`, and stop/restart `npm run dev`. A production build must be rebuilt after changing the value. Mode-specific files such as `.env.production.local` and shell environment variables can override `.env.local`; see [Vite environment precedence](https://vite.dev/guide/env-and-mode).
- **Vercel:** open the project → Settings → Environment Variables. Add `VITE_GEOAPIFY_API_KEY` for Production and, if needed, Preview/Development. Save, then create a new deployment (or redeploy the existing commit). Changes do not update existing deployments. Set the Vercel project Root Directory to the directory containing this app's `package.json`. See [Vercel environment variables](https://vercel.com/docs/environment-variables).
- Restrict the browser key in Geoapify to your actual local, preview and production origins/referrers. Never commit the key or paste it into source. Vite embeds browser keys in the client build, so do not commit credential-bearing `dist/` output either; deploy via Vercel's build instead.
- Run `npm run check:places` (or `npm run check:places -- --production`) to check Vite's effective configuration without printing the value. Then run `npm run check:places -- --live --origin http://localhost:5173` with the actual allowed site origin to request real `haw` matches. This verifies the service response, not browser CORS or the entire UI; verify both fields on the actual site as well.
- Missing configuration and HTTP 401/403 are internally distinguished from network/timeout failures and 429 rate limits. Public users see a neutral unavailable message for configuration/credential/network errors, not technical setup instructions. Empty results and rate limiting have their own messages.

Geoapify's current documentation accepts partial text and states no mandatory minimum beyond nonempty input; its integration guide recommends choosing two or three meaningful characters for relevance. This implementation retains the requested one-character support. `haw` is the recommended live verification query; a specific provider match cannot be guaranteed before a valid-key request succeeds.

Browser regression checks live in `tests/locationAutocomplete.browser.mjs`. With Playwright and its Chromium browser installed, run `node tests/locationAutocomplete.browser.mjs` (or set `PLAYWRIGHT_MODULE` to an existing Playwright module). The harness starts and stops isolated local Vite servers and intercepts all places/weather requests with test-only fixtures. It covers desktop keyboard and mobile touch selection, both fields, edited-selection invalidation, endpoint coordinates, list bounds/scrolling, missing configuration, rejected credentials, no matches, rate limiting, and network failure. These checks do not verify live provider coverage.
