// Open-Meteo WMO codes: https://open-meteo.com/en/docs#weathervariables
const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]
const snowCodes = [71, 73, 75, 77, 85, 86]

export function getWeatherSceneKind(code) {
  if (code === 0 || code === 1) return 'clear'
  if (code === 2) return 'partly-cloudy'
  if (code === 3) return 'overcast'
  if ([95, 96, 97, 99].includes(code)) return 'storm'
  if (code === 45 || code === 48) return 'fog'
  if (rainCodes.includes(code)) return 'rain'
  if (snowCodes.includes(code)) return 'snow'
  return 'neutral'
}

export function getForecastDaylight(forecast) {
  const value = forecast?.current?.isDay
  if (typeof value === 'boolean') return value
  if (value === 0 || value === 1) return value === 1

  // Older cached forecasts lack is_day. These three timestamps share the
  // provider's local timezone; compare them without using the device timezone.
  const time = forecast?.current?.time
  const day = forecast?.daily?.find((entry) => entry.date === time?.slice(0, 10))
  const localISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/
  if (![time, day?.sunrise, day?.sunset].every((entry) => typeof entry === 'string' && localISO.test(entry))) return null
  if (day.sunrise >= day.sunset) return null
  return time >= day.sunrise && time < day.sunset
}

export function getWeatherScene(forecast, heatStatus, unavailable = false) {
  const kind = getWeatherSceneKind(forecast?.current?.weatherCode)
  const daylight = getForecastDaylight(forecast)
  if (unavailable || kind === 'neutral' || daylight === null) {
    return { kind: 'neutral', night: false, hot: false, artwork: null }
  }
  // Keep precipitation/fog visible even when the existing heat classification is high.
  const hot = heatStatus?.priority >= 3
  const night = !daylight
  let artwork
  if (kind === 'storm') artwork = 'thunderstorm'
  else if (night) {
    if (kind === 'rain') artwork = 'rainy-night'
    else if (kind === 'clear') artwork = hot ? 'hot-night' : 'clear-night'
    // Explicit night snow/fog fallback: dark cloudy artwork + condition-specific effects.
    else artwork = 'cloudy-night'
  } else if (kind === 'rain') artwork = 'rainy'
  else if (kind === 'snow') artwork = 'snow'
  else if (kind === 'fog') artwork = 'foggy'
  else if (kind === 'overcast') artwork = 'overcast'
  else if (hot) artwork = 'hot'
  else artwork = kind === 'clear' ? 'sunny' : 'partly-cloudy'
  return { kind, night, hot, artwork }
}
