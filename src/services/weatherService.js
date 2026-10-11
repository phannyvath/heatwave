const FORECAST_BASE_URL = import.meta.env?.VITE_OPEN_METEO_FORECAST_URL || 'https://api.open-meteo.com/v1/forecast'

export async function fetchForecast({ latitude, longitude, signal, timezone = 'auto' }) {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day',
    hourly: 'temperature_2m,apparent_temperature,relative_humidity_2m,uv_index,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,apparent_temperature_max,uv_index_max,sunrise,sunset',
    timezone,
    forecast_days: '7',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
  })

  const response = await fetch(`${FORECAST_BASE_URL}?${params}`, { signal })
  if (!response.ok) {
    throw new Error('Weather API unavailable')
  }
  return response.json()
}

export function normaliseForecast(data) {
  const hourly = data.hourly.time.map((time, index) => ({
    time,
    temperature: data.hourly.temperature_2m[index],
    apparentTemperature: data.hourly.apparent_temperature[index],
    humidity: data.hourly.relative_humidity_2m[index],
    uvIndex: data.hourly.uv_index[index],
    weatherCode: data.hourly.weather_code[index],
  }))

  const daily = data.daily.time.map((date, index) => ({
    date,
    max: data.daily.temperature_2m_max[index],
    min: data.daily.temperature_2m_min[index],
    apparentMax: data.daily.apparent_temperature_max[index],
    uvMax: data.daily.uv_index_max[index],
    sunrise: data.daily.sunrise[index],
    sunset: data.daily.sunset[index],
  }))

  return {
    current: {
      time: data.current.time,
      temperature: data.current.temperature_2m,
      apparentTemperature: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      weatherCode: data.current.weather_code,
      windSpeed: data.current.wind_speed_10m,
      isDay: data.current.is_day === 1 ? true : data.current.is_day === 0 ? false : null,
    },
    hourly,
    daily,
    timezone: data.timezone,
    fetchedAt: new Date().toISOString(),
    provider: 'Open-Meteo',
  }
}
