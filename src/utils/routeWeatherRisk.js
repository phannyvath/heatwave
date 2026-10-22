import { calculateHeatRisk } from './calculateHeatRisk.js'
import { localStamp } from './journeyTiming.js'

const severity = { comfortable: 0, warm: 1, hot: 2, 'very-hot': 3 }
const valid = (hour) => Number.isFinite(hour?.apparentTemperature) && Number.isFinite(hour?.uvIndex)

// Hourly forecasts are interpolated at the actual departure/arrival instant.
// Missing coverage is never replaced with a previous day or synthetic weather.
function weatherAt(forecast, epoch) {
  const hours = forecast.hourly
  const index = hours.findIndex((hour) => hour.epoch <= epoch && hour.epoch + 3600000 > epoch)
  if (index < 0 || !valid(hours[index])) return null
  const first = hours[index]
  if (epoch === first.epoch) return first
  const second = hours[index + 1]
  if (!valid(second) || second.epoch - first.epoch !== 3600000) return null
  const fraction = (epoch - first.epoch) / 3600000
  return { apparentTemperature: first.apparentTemperature + fraction * (second.apparentTemperature - first.apparentTemperature), uvIndex: first.uvIndex + fraction * (second.uvIndex - first.uvIndex) }
}

export function assessRoute(origin, destination, route) {
  if (route.error || !Number.isFinite(route.departure) || !Number.isFinite(route.arrival) || route.arrival < route.departure || route.arrival - route.departure > 86400000) return null
  const start = weatherAt(origin, route.departure)
  const end = weatherAt(destination, route.arrival)
  if (!start || !end) return null
  // Endpoint forecasts across the journey window are a conservative proxy;
  // they do not claim to measure shade, vehicle temperature or route weather.
  const samples = [route.departure, route.arrival]
  for (let time = Math.ceil(route.departure / 3600000) * 3600000; time < route.arrival; time += 3600000) samples.push(time)
  const weather = samples.flatMap((time) => [weatherAt(origin, time), weatherAt(destination, time)])
  if (weather.some((hour) => !hour)) return null
  const apparentTemperature = Math.max(...weather.map((hour) => hour.apparentTemperature))
  const uvIndex = Math.max(...weather.map((hour) => hour.uvIndex))
  return { ...route, apparentTemperature, uvIndex, endpoints: [start, end], risk: calculateHeatRisk({ apparentTemperature, uvIndex }) }
}

export function recommendRoutes(origin, destination, routes, mode) {
  const assessed = routes.map((route) => assessRoute(origin, destination, route))
  const selected = assessed[0]
  if (!selected) return null
  let recommended = selected
  let reason = 'same'
  // Prefer the earliest meaningful improvement, within the user's two-hour
  // comparison window. Never trade lower temperature for worse UV/category.
  for (const candidate of assessed.slice(1)) {
    if (!candidate || candidate.apparentTemperature > selected.apparentTemperature || candidate.durationMinutes > selected.durationMinutes + 15 || candidate.uvIndex > selected.uvIndex || severity[candidate.risk] > severity[selected.risk]) continue
    if (Number.isFinite(selected.outdoorMinutes) && (!Number.isFinite(candidate.outdoorMinutes) || candidate.outdoorMinutes > selected.outdoorMinutes + 5)) continue
    const improvement = severity[candidate.risk] < severity[selected.risk] ? 'risk'
      : candidate.apparentTemperature <= selected.apparentTemperature - 2 ? 'cooler'
        : selected.uvIndex >= 3 && candidate.uvIndex <= selected.uvIndex - 2 && candidate.apparentTemperature <= selected.apparentTemperature ? 'uv'
          : mode === 'TRANSIT' && Number.isFinite(candidate.outdoorMinutes) && candidate.outdoorMinutes <= selected.outdoorMinutes - 10 && candidate.apparentTemperature <= selected.apparentTemperature ? 'outdoors' : null
    if (improvement) { recommended = candidate; reason = improvement; break }
  }
  return {
    risk: selected.risk, selected, recommended, reason,
    date: localStamp(selected.departure, origin.timezone).slice(0, 10),
    recommendedTime: localStamp(recommended.departure, origin.timezone).slice(11, 16),
    assessedCount: assessed.filter(Boolean).length, requestedCount: routes.length,
  }
}
