# Distinct LOFI weather scenes

The existing dashboard weather card now uses **12 separately generated illustrations**. There is no shared landscape recoloured with filters. The old `melbourne-weather.jpg` is no longer imported by the application. Each image has its own landscape composition, foreground details, lighting and atmosphere; the palette, painterly texture and Melbourne-inspired setting unify the collection.

## Assets and selection

All new assets live in `src/assets/images/weather/`:

| Asset | Live condition | Separate animated layer |
| --- | --- | --- |
| `sunny.jpg` | WMO 0/1, daytime | Soft sun glow, slow cloud |
| `partly-cloudy.jpg` | WMO 2, daytime | Large clouds drifting over sunlight |
| `overcast.jpg` | WMO 3, daytime | Dense slow layered clouds |
| `rainy.jpg` | Drizzle/rain/showers, daytime | Gentle rain and river ripples |
| `thunderstorm.jpg` | WMO 95/96/97/99, day or night | Denser rain, purple clouds, ripples; no lightning/flashes |
| `foggy.jpg` | WMO 45/48, daytime | Drifting low mist |
| `clear-night.jpg` | WMO 0/1, nighttime | Moon glow, twinkling stars |
| `cloudy-night.jpg` | WMO 2/3, nighttime | Dark clouds passing across moonlight |
| `rainy-night.jpg` | Drizzle/rain/showers, nighttime | Rain and ripples over wet village scenery |
| `hot.jpg` | Daytime clear/partly cloudy with existing heat priority >= 3 | Warm sunlight and subtle shimmer |
| `hot-night.jpg` | Clear nighttime with existing heat priority >= 3 | Moonlight, stars and gentle shimmer |
| `snow.jpg` | WMO 71/73/75/77/85/86, daytime | Slow snowfall |

Provider: https://open-meteo.com/en/docs (`is_day` and WMO code tables). The provider request, normalization and sunrise/sunset fallback added previously are preserved. No new risk thresholds were introduced.

Precedence: unavailable data → neutral; thunderstorms → storm; other precipitation/fog/overcast → their actual condition; heat artwork applies to otherwise clear/partly cloudy daytime or clear nighttime. A high heat status can add gentle shimmer without replacing a rainy, foggy, overcast or storm scene.

Documented combined-condition fallbacks:

- Night fog uses `cloudy-night.jpg` with low mist and no visible moon/stars.
- Night snow uses `cloudy-night.jpg` with snowflakes. This is a nighttime atmospheric fallback, not the snow-covered daytime landscape.
- Day and night thunderstorms share the dedicated, dark purple storm illustration, which has no daylight sun or moon.
- Unknown codes, missing daylight data and stale/failed forecast responses retain a neutral surface without suggesting current conditions. Initial loading and uncached failure feedback remain unchanged.

## Rendering and performance

Each scene is a separate 1280 px JPEG (approximately 327–489 KiB). Production initially downloads only the selected scene; URL imports do not fetch all images. The next image is decoded before its 1.2-second opacity crossfade begins. At most two scene layers are retained, then the outgoing layer is removed. Interrupted loads are ignored. Asset-load failures retain a neutral CSS surface and readable content. No animation/rendering dependency was added.

Animations use lightweight CSS opacity/transform effects and a small number of SVG clouds/particles. All layers are behind real interface text and controls, `aria-hidden`, non-focusable and `pointer-events: none`. Reduced motion removes animations, crossfades and shimmer. Weather values, greeting, location, source, update time, Refresh and six metrics remain real UI. Night and storm scenes use cream summary text with a dark protective backdrop; all metrics retain translucent cream surfaces and dark labels. The logo and navigation remain unchanged.

## Development preview

Run `npm run dev`, then visit `/__dev/weather` on its displayed port. The development-only route has a labelled synthetic-state selector, selected asset filename, and an expandable gallery of all 12 originals. Preview fixtures do not overwrite live responses or local caches. Preview Refresh is explicitly simulated. The route/import are removed in production.

The preview also covers night storm/fog/snow fallbacks, neutral, loading and error states. Use browser/OS reduced-motion settings for the static version.

## Artwork provenance

Generated with the built-in imagegen tool, one independent generation per scene. The exact shared style prompt and individual scene prompts are saved in `docs/weather-artwork-prompts.json`. Generated outputs were resized/encoded to website JPEG assets; the originals remain in the imagegen output directory. No visual reference attachment was available in this conversation, so the user's written LOFI direction guided the collection.

## Verification

- `node --test tests/weatherScene.test.mjs`: WMO mapping, daylight/cache boundaries, distinct asset selection, existing heat classification, precedence, neutral behaviour and documented nighttime fallbacks.
- `npm run lint` and `npm run build`.
- `PLAYWRIGHT_PATH=/path/to/playwright node tests/weather-browser.mjs`: separate browser context, 320/390/768/1440 px viewport checks over 16 condition combinations; image loading, no colour filters, six metrics, overflow, motion/reduced motion, plus real Dashboard Refresh/loading/cached failure/uncached retry/navigation with isolated mocked provider responses.
- Optional environment variables: `WEATHER_TEST_URL` (default http://127.0.0.1:5175), `CHROME_PATH`, `WEATHER_TEST_ARTIFACTS`.

Limitations: illustrations are atmospheric Melbourne-inspired artwork, not exact live views of selected locations. Snow/fog at night and storms use the documented fallbacks above. Browser checks simulate devices and provider responses; they do not constitute testing on physical phones. The pre-existing production JavaScript chunk-size warning remains.

### Completed checks

All five Node test groups, ESLint and the production build passed. The browser checks passed across 64 viewport/condition combinations. The asset lifecycle check confirmed one initial artwork download, a decoded-image 1.2-second crossfade, outgoing-layer cleanup, instantaneous reduced-motion replacement, and a neutral missing-image fallback that preserves Refresh and metrics. The production bundle contains neither the preview route/gallery nor the former shared landscape reference.

Rendered-pixel contrast checks sampled backgrounds beneath every text range for 16 states at 390 and 1440 px with motion disabled. A protective timestamp surface was added after the rainy/hot mobile scenes exposed weak contrast. The final lowest sampled ratio was 5.85:1 after the Melbourne artwork refresh. These are representative rendered checks, not a full accessibility certification.


## Melbourne location refresh

All 12 JPEG assets were regenerated as different Melbourne-inspired places. Sunny: Yarra/Birrarung Marr; partly cloudy: Brighton bathing boxes; overcast: Carlton Gardens; rainy: Fitzroy tram street; storm: Docklands/Bolte Bridge; fog: Royal Botanic Gardens; clear night: Southbank/Princes Bridge; cloudy night: St Kilda Pier; rainy night: Degraves Street-inspired laneway; hot: Albert Park Lake; hot night: Lygon Street; snow: an imagined Dandenong Ranges winter railway.

The development gallery labels each location. These are original artistic interpretations, not exact photographs or live views. The snow illustration is deliberately imagined. Locations vary by weather scene; refresh does not randomise the actual weather or select an unrelated weather condition. Weather mapping and existing animation logic remain unchanged. Updated generation prompts are in weather-artwork-prompts.json.
