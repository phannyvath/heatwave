import { calculateHeatRisk } from './calculateHeatRisk.js'

const severity = { comfortable: 0, warm: 1, hot: 2, 'very-hot': 3 }
const validHour = (hour) => Number.isFinite(hour.apparentTemperature) && Number.isFinite(hour.uvIndex)
const riskFor = (hour) => calculateHeatRisk({ apparentTemperature: hour.apparentTemperature, uvIndex: hour.uvIndex })

// Provider timestamps are local wall times in forecast.timezone, not browser time.
export function calculateJourney(forecast, time, now = new Date()) {
  if (!forecast?.timezone || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: forecast.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map(({ type, value }) => [type, value]))
  const today = `${parts.year}-${parts.month}-${parts.day}`
  const date = new Date(`${today}T00:00:00Z`)
  if (time < `${parts.hour}:${parts.minute}`) date.setUTCDate(date.getUTCDate() + 1)
  const journeyDate = date.toISOString().slice(0, 10)
  const hours = (forecast.hourly || []).filter((hour) => hour.time.startsWith(`${journeyDate}T`))
  const selected = hours.find((hour) => hour.time.slice(11, 13) === time.slice(0, 2))
  if (!selected || !validHour(selected)) return null
  const risk = riskFor(selected)
  // Keep the selected departure as a candidate; only recommend a later hour if better.
  const candidates = hours.filter((hour) => validHour(hour) && hour.time.slice(11, 16) >= time && hour.time.slice(11, 16) < '21:00')
  const recommended = candidates.reduce((best, hour) => {
    const difference = severity[riskFor(hour)] - severity[riskFor(best)]
    return difference < 0 || (difference === 0 && hour.apparentTemperature < best.apparentTemperature) ? hour : best
  }, selected)
  return {
    risk, selected, date: journeyDate,
    recommendedTime: recommended === selected ? time : recommended.time.slice(11, 16),
    recommended,
  }
}

// Both forecasts must use the origin's timezone so equal wall times represent
// the same instant, including journeys across Australian timezone boundaries.
export function calculateEndpointJourney(origin, destination, time, now = new Date()) {
  if (!origin || !destination || origin.timezone !== destination.timezone) return null
  const destinations = new Map(destination.hourly.map((hour) => [hour.time, hour]))
  const hourly = origin.hourly.flatMap((start) => {
    const end = destinations.get(start.time)
    if (!validHour(start) || !end || !validHour(end)) return []
    return [{
      time: start.time,
      apparentTemperature: Math.max(start.apparentTemperature, end.apparentTemperature),
      uvIndex: Math.max(start.uvIndex, end.uvIndex),
      endpoints: [start, end],
    }]
  })
  return calculateJourney({ timezone: origin.timezone, hourly }, time, now)
}
