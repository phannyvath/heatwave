import { useEffect, useRef, useState } from 'react'
import CurrentWeatherCard from '../components/weather/CurrentWeatherCard.jsx'
import WeatherSkeleton from '../components/weather/WeatherSkeleton.jsx'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import { getHeatStatus } from '../utils/heatRisk.js'
import { makePreviewForecast, previewStates } from './weatherFixtures.js'
import { sceneAssets } from '../components/weather/sceneAssets.js'
import { getWeatherScene } from '../utils/weatherScene.js'

export default function WeatherPreview() {
  const [state, setState] = useState('clear')
  const [refreshing, setRefreshing] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(null)
  const timer = useRef(null)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const forecast = makePreviewForecast(state)
  if (updatedAt) forecast.fetchedAt = updatedAt
  const scene = getWeatherScene(forecast, getHeatStatus({ forecast, climate: null }))

  function refresh() {
    setRefreshing(true)
    timer.current = window.setTimeout(() => {
      setUpdatedAt(new Date().toISOString())
      setRefreshing(false)
    }, 800)
  }

  return (
    <main className="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
      <Card className="space-y-3 p-5">
        <h1 className="text-xl font-black">Development preview · simulated weather</h1>
        <p className="text-sm">Synthetic Melbourne fixtures. No live requests or saved weather changes. Refresh simulates a request; use the dashboard to check live Refresh.</p>
        <label className="flex flex-wrap items-center gap-3 font-bold">
          Weather scene
          <select className="rounded-xl border border-orange-200 bg-white p-2" value={state} onChange={(event) => setState(event.target.value)}>
            {previewStates.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <p className="text-xs">Use your system or browser’s reduced-motion setting for the static version. Loading and error examples retain neutral surfaces.</p>
        <p className="text-sm font-bold">Selected asset: {scene.artwork ? `${scene.artwork}.jpg` : 'Neutral surface (no inferred weather)'}</p>
        <p className="text-xs">Night fog and snow use the cloudy-night landscape with mist or snow. Storm uses its deep-purple artwork both day and night. Heat styling follows the existing classification; rain, storms, fog, snow and overcast take priority.</p>
        <a className="inline-block font-bold underline" href="/">Back to live dashboard</a>
      </Card>
      {state === 'loading' ? <WeatherSkeleton /> : state === 'error' ? (
        <Card className="space-y-4 p-5">
          <h2 className="font-black">Development preview · weather unavailable</h2>
          <p>Simulated request failure. No weather scene is inferred.</p>
          <Button onClick={() => setState('clear')}>Try again (simulation)</Button>
        </Card>
      ) : (
        <CurrentWeatherCard
          forecast={forecast}
          location={{ name: 'Melbourne (preview)', state: 'VIC' }}
          prefs={{ tempUnit: 'C' }}
          refreshing={refreshing} onRefresh={refresh}
          heatStatus={getHeatStatus({ forecast, climate: null })}
        />
      )}
      <details className="rounded-2xl border border-orange-100 bg-white p-5">
        <summary className="cursor-pointer font-black">Original scene artwork · 12 separate illustrations</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(sceneAssets).map(([name, src]) => (
            <figure key={name}>
              <img src={src} alt={`${name} original LOFI landscape`} loading="lazy" className="aspect-[3/2] w-full rounded-xl object-cover" />
              <figcaption className="mt-2 text-sm font-bold">{name}.jpg</figcaption>
            </figure>
          ))}
        </div>
      </details>
    </main>
  )
}
