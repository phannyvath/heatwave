import { useEffect, useRef, useState } from 'react'
import { sceneAssets } from './sceneAssets.js'
import './weather-scene.css'

function SceneLayers({ scene, src }) {
  const { kind, night, hot } = scene
  const cloudy = ['partly-cloudy', 'overcast', 'rain', 'storm', 'snow'].includes(kind)
  const raining = kind === 'rain' || kind === 'storm'
  const showOrb = kind === 'clear' || (!night && kind === 'partly-cloudy')
  const cloudCount = kind === 'clear' ? 1 : cloudy ? 5 : 0
  return (
    <>
      {src && <img className="weather-scene__landscape" src={src} alt="" draggable="false" decoding="async" />}
      {night && kind === 'clear' && (
        <div className="weather-scene__stars">
          {Array.from({ length: 18 }, (_, index) => (
            <i key={index} style={{ left: `${12 + (index * 29) % 85}%`, top: `${4 + (index * 13) % 36}%`, animationDelay: `${-index * 0.8}s` }} />
          ))}
        </div>
      )}
      {showOrb && <div className={`weather-scene__orb ${night ? 'weather-scene__orb--moon' : 'weather-scene__orb--sun'} ${cloudy ? 'weather-scene__orb--veiled' : ''}`} />}
      {cloudCount > 0 && (
        <div className={`weather-scene__clouds ${cloudy ? 'weather-scene__clouds--layered' : ''}`}>
          {Array.from({ length: cloudCount }, (_, index) => (
            <svg key={index} className={`weather-scene__cloud weather-scene__cloud--${index}`} viewBox="0 0 240 90" focusable="false">
              <path d="M30 76C-3 75 0 40 30 38C33 8 77 0 94 28C116 0 159 13 162 39C206 13 247 46 228 69C222 77 207 79 185 79H30Z" fill="currentColor" />
            </svg>
          ))}
        </div>
      )}
      {(raining || kind === 'snow') && (
        <div className={`weather-scene__precipitation weather-scene__precipitation--${kind}`}>
          {Array.from({ length: kind === 'storm' ? 38 : 24 }, (_, index) => (
            <i key={index} style={{ left: `${(index * 37) % 100}%`, top: `${(index * 17) % 85}%`, animationDelay: `${-index * 0.43}s`, animationDuration: `${(kind === 'snow' ? 12 : kind === 'storm' ? 3 : 6) + index % 4}s` }} />
          ))}
        </div>
      )}
      {raining && <div className="weather-scene__ripples">{[0, 1, 2, 3].map(index => <i key={index} style={{ left: `${35 + index * 14}%`, bottom: `${12 + index % 3 * 7}%`, animationDelay: `${-index * 2}s` }} />)}</div>}
      {kind === 'fog' && <div className="weather-scene__fog" />}
      {hot && kind !== 'snow' && <div className="weather-scene__shimmer" />}
    </>
  )
}

export default function WeatherScene({ scene }) {
  const [layers, setLayers] = useState([])
  const [assetError, setAssetError] = useState(false)
  const sequence = useRef(0)
  const { artwork, kind, night, hot } = scene
  const visibleScene = layers.at(-1)?.scene
  const ready = visibleScene?.artwork === artwork && visibleScene?.kind === kind && visibleScene?.night === night && visibleScene?.hot === hot

  useEffect(() => {
    let cancelled = false
    let cleanupTimer
    const src = sceneAssets[artwork]
    const nextScene = { artwork, kind, night, hot }
    const commit = (source) => {
      if (cancelled) return
      const entry = { id: ++sequence.current, scene: nextScene, src: source }
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      // Never keep more than two scenes in the DOM during the 1.2s crossfade.
      setLayers(previous => reduce ? [entry] : [...previous.slice(-1), entry])
      cleanupTimer = window.setTimeout(() => setLayers(previous => previous.slice(-1)), 1250)
    }
    setAssetError(false)
    if (!src) {
      // Missing live weather immediately clears any previous weather imagery.
      setLayers([])
      return undefined
    }
    const image = new Image()
    image.src = src
    image.decode().then(() => commit(src)).catch(() => {
      if (!cancelled) {
        setLayers([])
        setAssetError(true)
      }
    })
    return () => { cancelled = true; window.clearTimeout(cleanupTimer) }
  }, [artwork, kind, night, hot])

  return (
    <div className="weather-scene" aria-hidden="true" data-asset-error={assetError} data-ready={ready}>
      {layers.map(layer => (
        <div key={layer.id} className="weather-scene__layer" data-kind={layer.scene.kind} data-night={layer.scene.night} data-artwork={layer.scene.artwork}>
          <SceneLayers scene={layer.scene} src={layer.src} />
        </div>
      ))}
      <div className="weather-scene__scrim" />
    </div>
  )
}
