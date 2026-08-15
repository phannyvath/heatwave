const ARCHIVE_BASE_URL = import.meta.env.VITE_OPEN_METEO_ARCHIVE_URL || 'https://archive-api.open-meteo.com/v1/archive'
const CACHE_KEY = 'heatsafe-climate-averages'
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

function roundCoordinate(value) {
  return Math.round(value * 10) / 10
}

function getMonthWindow(year, monthIndex) {
  const start = new Date(Date.UTC(year, monthIndex, 1))
  const end = new Date(Date.UTC(year, monthIndex + 1, 0))
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

function readCache(key) {
  try {
    const all = JSON.parse(window.localStorage.getItem(CACHE_KEY) || '{}')
    const cached = all[key]
    if (!cached) return null
    const fresh = Date.now() - new Date(cached.calculatedAt).getTime() < THIRTY_DAYS
    return fresh ? cached : null
  } catch {
    return null
  }
}

function writeCache(key, value) {
  try {
    const all = JSON.parse(window.localStorage.getItem(CACHE_KEY) || '{}')
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ ...all, [key]: value }))
  } catch {
    // Historical averages are optional; ignore storage restrictions.
  }
}

async function fetchMonth({ latitude, longitude, year, monthIndex, signal }) {
  const { start, end } = getMonthWindow(year, monthIndex)
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    start_date: start,
    end_date: end,
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    temperature_unit: 'celsius',
  })
  const response = await fetch(`${ARCHIVE_BASE_URL}?${params}`, { signal })
  if (!response.ok) throw new Error('Historical weather unavailable')
  return response.json()
}

export async function getMonthlyClimateAverage({ latitude, longitude, signal }) {
  const roundedLatitude = roundCoordinate(latitude)
  const roundedLongitude = roundCoordinate(longitude)
  const now = new Date()
  const key = `${roundedLatitude},${roundedLongitude},${now.getUTCMonth()}`
  const cached = readCache(key)
  if (cached) return { ...cached, fromCache: true }

  const currentYear = now.getUTCFullYear()
  const years = Array.from({ length: 10 }, (_, index) => currentYear - 1 - index)
  const results = await Promise.all(
    years.map((year) =>
      fetchMonth({
        latitude: roundedLatitude,
        longitude: roundedLongitude,
        year,
        monthIndex: now.getUTCMonth(),
        signal,
      }),
    ),
  )

  const maxValues = results.flatMap((item) => item.daily?.temperature_2m_max || []).filter(Number.isFinite)
  const minValues = results.flatMap((item) => item.daily?.temperature_2m_min || []).filter(Number.isFinite)
  if (!maxValues.length || !minValues.length) {
    throw new Error('Historical average unavailable')
  }

  const average = {
    latitude: roundedLatitude,
    longitude: roundedLongitude,
    calculatedAt: new Date().toISOString(),
    monthlyAverageMax: Math.round(maxValues.reduce((sum, value) => sum + value, 0) / maxValues.length),
    monthlyAverageMin: Math.round(minValues.reduce((sum, value) => sum + value, 0) / minValues.length),
  }
  writeCache(key, average)
  return average
}
