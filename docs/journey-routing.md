# Journey routing with Geoapify

The planner uses the existing `VITE_GEOAPIFY_API_KEY` for search and routing. No Google API key, Google Cloud account or Google billing is needed. Geoapify's free plan has shared credit/rate limits; routing and autocomplete both consume these credits. One routing request supplies the estimated duration for up to three weather comparisons.

## Setup

- Local: keep `VITE_GEOAPIFY_API_KEY` in `.env.local`, then restart Vite.
- Vercel: set `VITE_GEOAPIFY_API_KEY` in the Production/Preview environment and redeploy the source project. The included `api/journey-routes.js` runs the routing proxy. A static-only upload of `dist/` cannot run this endpoint.
- The same-origin browser request's origin/referrer is forwarded to Geoapify, supporting the existing browser key restrictions. Allow your actual local and hosted origins in Geoapify.
- Optionally set a separate server-only `GEOAPIFY_API_KEY`; the proxy prefers this over the browser key. Apply appropriate Geoapify restrictions to it. Never give a private server key a `VITE_` prefix.
- A Google Maps directions link opens a fresh search without an API key. Users set their departure time there to confirm transit schedules; schedules are not imported into this app.

## Recommendation logic and limits

Select transit, walking, cycling or driving. Geoapify returns a real route and estimated duration. Walking/cycling outdoor exposure equals the route duration; transit waits, shelter and driving exposure are unknown. Transit must contain an actual transit instruction, otherwise the app offers the external directions link without fabricating a recommendation. It never silently substitutes driving, walking or approximated transit for transit.

The documented Geoapify request does not accept the user's departure time. The same route estimate is therefore reused for the selected departure and alternatives 60/120 minutes later, restricted to the same date before 9 pm. Driving uses Geoapify's approximated traffic model, not live traffic. Transit duration does not verify service availability or timetable waits at any candidate time. These limitations appear in the results.

Departure is resolved in the origin timezone, including DST gaps/repeated times. Unix forecast timestamps align Australian timezones. Open-Meteo hourly weather is interpolated at departure/estimated arrival and checked at both endpoints throughout the journey window. Missing complete coverage means no assessment; no synthetic or cached fallback is presented as current data.

The earliest meaningful weather improvement is suggested: a lower forecast category, at least 2°C lower peak feels-like temperature, or at least 2 lower peak UV starting at UV 3+. Alternatives cannot be hotter or have worse UV/category. Duration and outdoor-time comparison safeguards remain in the shared comparison utility, but this integration does not claim differences in timetable or traffic between departures.

This is an endpoint weather proxy, not conditions sampled along the route or a validated personal health assessment. Shade, exertion and vehicle cooling are unknown. General preparation tips are fixed and labelled general. Route directions and Geoapify/OpenStreetMap attribution appear in the results.

## Data and verification

Search text goes to Geoapify; coordinates go to Geoapify and Open-Meteo. The proxy does not send the departure time to Geoapify and does not log keys or journey selections. Google receives coordinates/mode only when the user opens the external link. No route responses are persisted by the app.

Run `node --test tests/*.test.mjs`, `npm run lint`, `npm run build`, and the Playwright browser harness described in the README. Synthetic test fixtures do not establish live regional coverage. Real walking and transit responses were checked for a Melbourne public-location pair during this change; other routes and hosted-origin permissions still depend on provider coverage/configuration.

References: [Geoapify routing](https://apidocs.geoapify.com/docs/routing/), [free-plan limits](https://www.geoapify.com/pricing/), [Google Maps URLs without keys](https://developers.google.com/maps/documentation/urls/get-started), [Open-Meteo terms](https://open-meteo.com/en/terms).
