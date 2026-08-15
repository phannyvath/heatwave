import { useCallback, useState } from 'react'

const STORAGE_KEY = 'heatsafe-selected-location'
const SESSION_KEY = 'heatsafe-session-location'

const defaultLocation = {
  name: 'Hawthorn',
  state: 'VIC',
  postcode: '',
  latitude: -37.8229,
  longitude: 145.0351,
  source: 'default',
}

function readStoredLocation() {
  try {
    const sessionLocation = window.sessionStorage.getItem(SESSION_KEY)
    if (sessionLocation) return JSON.parse(sessionLocation)
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || null
  } catch {
    return null
  }
}

export function useLocation() {
  const [location, setLocationState] = useState(() => readStoredLocation())
  const [status, setStatus] = useState(location ? 'ready' : 'needs-choice')
  const [error, setError] = useState('')

  const selectLocation = useCallback((nextLocation) => {
    setLocationState(nextLocation)
    setStatus('ready')
    setError('')
    if (nextLocation.source === 'manual' || nextLocation.source === 'default') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextLocation))
        window.sessionStorage.removeItem(SESSION_KEY)
      } catch {
        // Location storage is helpful but not required for the app to work.
      }
    }
  }, [])

  const useDefaultLocation = useCallback(() => {
    selectLocation(defaultLocation)
  }, [selectLocation])

  const requestCurrentLocation = useCallback(() => {
    setStatus('requesting')
    setError('')
    if (!navigator.geolocation) {
      setStatus('denied')
      setError('Location is unavailable on this device. Please choose a suburb instead.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          name: 'Current location',
          state: 'Australia',
          postcode: '',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'gps',
        }
        setLocationState(nextLocation)
        try {
          window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextLocation))
        } catch {
          // Keep GPS coordinates in memory if session storage is unavailable.
        }
        setStatus('ready')
      },
      () => {
        setStatus('denied')
        setError('Location permission was not enabled. You can still choose a suburb.')
      },
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 10 * 60 * 1000 },
    )
  }, [])

  const changeLocation = useCallback(() => {
    setStatus('needs-choice')
    setError('')
  }, [])

  return {
    location,
    status,
    error,
    requestCurrentLocation,
    selectLocation,
    useDefaultLocation,
    changeLocation,
  }
}
