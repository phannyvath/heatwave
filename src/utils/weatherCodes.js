import { Cloud, CloudDrizzle, CloudFog, CloudRain, CloudSun, Snowflake, Sun } from 'lucide-react'

export function getWeatherDescription(code) {
  if (code === 0) return 'Clear'
  if ([1, 2].includes(code)) return 'Partly cloudy'
  if (code === 3) return 'Cloudy'
  if ([45, 48].includes(code)) return 'Fog'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow'
  if ([95, 96, 99].includes(code)) return 'Storms'
  return 'Weather'
}

export function getWeatherIcon(code) {
  if (code === 0) return Sun
  if ([1, 2].includes(code)) return CloudSun
  if (code === 3) return Cloud
  if ([45, 48].includes(code)) return CloudFog
  if ([51, 53, 55, 56, 57].includes(code)) return CloudDrizzle
  if ([61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) return CloudRain
  if ([71, 73, 75, 77, 85, 86].includes(code)) return Snowflake
  return CloudSun
}
