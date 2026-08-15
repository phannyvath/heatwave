export function toFahrenheit(celsius) {
  return Math.round((celsius * 9) / 5 + 32)
}

export function celsiusToFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32
}

export function formatTemperature(celsius, unit) {
  if (unit === 'fahrenheit' || unit === 'F') {
    return `${Math.round(celsiusToFahrenheit(celsius))}°F`
  }

  return `${Math.round(celsius)}°C`
}

export function formatTemp(celsius, unit) {
  return formatTemperature(celsius, unit)
}

export function riskFromHour(time) {
  const hour = Number(time.split(':')[0])
  const period = time.toLowerCase().includes('pm') ? 'pm' : 'am'
  const normalized = period === 'pm' && hour !== 12 ? hour + 12 : hour
  if (normalized >= 12 && normalized <= 17) return 'Hot'
  if (normalized >= 11 && normalized <= 18) return 'Warm'
  return 'Comfortable'
}
