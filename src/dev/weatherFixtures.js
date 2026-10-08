// Synthetic data used only by the isolated development preview and tests.
export const previewStates = ['clear', 'partly-cloudy', 'overcast', 'rain', 'storm', 'fog', 'night', 'cloudy-night', 'rain-night', 'hot', 'hot-night', 'snow', 'storm-night', 'fog-night', 'snow-night', 'neutral', 'loading', 'error']

export function makePreviewForecast(state = 'clear') {
  const night = state.includes('night')
  const hot = state.includes('hot')
  const date = '2026-10-08'
  const code = ({ 'partly-cloudy': 2, overcast: 3, 'cloudy-night': 3, rain: 63, 'rain-night': 63, storm: 95, 'storm-night': 95, fog: 45, 'fog-night': 45, snow: 73, 'snow-night': 73, neutral: null })[state] ?? (state === 'neutral' ? null : 0)
  return {
    current: {
      time: `${date}T${night ? '22' : '13'}:00`, isDay: !night,
      temperature: hot ? 37 : night ? 17 : 24, apparentTemperature: hot ? 39 : 24,
      humidity: 54, weatherCode: code, windSpeed: 12,
    },
    hourly: Array.from({ length: 24 }, (_, index) => ({
      time: `${date}T${String(index).padStart(2, '0')}:00`,
      temperature: 24, apparentTemperature: index === 14 ? 28 : 24,
      humidity: 54, uvIndex: 5, weatherCode: code,
    })),
    daily: Array.from({ length: 7 }, (_, index) => ({
      date: `2026-10-${String(8 + index).padStart(2, '0')}`,
      max: hot ? 38 : 26, min: 15, apparentMax: hot ? 39 : 27, uvMax: 5,
      sunrise: `2026-10-${String(8 + index).padStart(2, '0')}T06:45`,
      sunset: `2026-10-${String(8 + index).padStart(2, '0')}T19:30`,
    })),
    timezone: 'Australia/Melbourne', fetchedAt: `${date}T03:00:00Z`, provider: 'Open-Meteo',
  }
}
