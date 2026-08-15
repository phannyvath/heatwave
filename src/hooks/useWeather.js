import { useCallback, useEffect, useMemo, useState } from 'react'
import { getMonthlyClimateAverage } from '../services/climateService.js'
import { fetchForecast, normaliseForecast } from '../services/weatherService.js'
import { getHeatStatus } from '../utils/heatRisk.js'

const CACHE_KEY = 'heatsafe-weather-cache'
const REFRESH_INTERVAL_MS = 30 * 60 * 1000

function cacheKey(location) {
  return `${Math.round(location.latitude * 100) / 100},${Math.round(location.longitude * 100) / 100}`
}

function readCachedWeather(location) {
  try {
    const all = JSON.parse(window.localStorage.getItem(CACHE_KEY) || '{}')
    return all[cacheKey(location)] || null
  } catch {
    return null
  }
}

function writeCachedWeather(location, forecast) {
  try {
    const all = JSON.parse(window.localStorage.getItem(CACHE_KEY) || '{}')
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ ...all, [cacheKey(location)]: forecast }))
  } catch {
    // Cached weather is a convenience only.
  }
}

export function useWeather(location) {
  const [forecast, setForecast] = useState(null)
  const [climate, setClimate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [climateError, setClimateError] = useState('')
  const [isCached, setIsCached] = useState(false)

  const load = useCallback(
    async ({ background = false } = {}) => {
      if (!location) return
      const controller = new AbortController()
      if (background) setRefreshing(true)
      else setLoading(true)
      setError('')
      setClimateError('')

      try {
        const data = await fetchForecast({ ...location, signal: controller.signal })
        const normalised = normaliseForecast(data)
        setForecast(normalised)
        setIsCached(false)
        writeCachedWeather(location, normalised)
      } catch {
        const cached = readCachedWeather(location)
        if (cached) {
          setForecast(cached)
          setIsCached(true)
          setError('Showing previously downloaded weather data.')
        } else if (!navigator.onLine) {
          setError('No internet connection. Connect to the internet to download local weather.')
        } else {
          setError('We couldn’t update the weather right now. Please try again shortly.')
        }
      }

      try {
        const average = await getMonthlyClimateAverage({ ...location, signal: controller.signal })
        setClimate(average)
      } catch {
        setClimate(null)
        setClimateError('Local average is currently unavailable.')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [location],
  )

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!location) return undefined
    const interval = window.setInterval(() => {
      load({ background: true })
    }, REFRESH_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [load, location])

  const heatStatus = useMemo(() => {
    if (!forecast) return null
    return getHeatStatus({ forecast, climate })
  }, [climate, forecast])

  return {
    forecast,
    climate,
    heatStatus,
    loading,
    refreshing,
    error,
    climateError,
    isCached,
    refresh: () => load({ background: Boolean(forecast) }),
  }
}
