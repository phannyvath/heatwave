import { calculateHeatRisk } from './calculateHeatRisk.js'
import { createDemoPlan } from '../data/demoDirections.js'
import { recommendationModes } from './demoRecommendation.js'

export function localDateTime(epoch) {
  const date = new Date(epoch)
  return new Date(epoch - date.getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace(/:00$/, '')
}

export function createDeparturePlan({ start, destination, method, departure }, now = Date.now()) {
  const selectedDeparture = new Date(departure).getTime()
  if (!Number.isFinite(selectedDeparture) || selectedDeparture <= now) throw new Error('Choose a departure date and time in the future.')
  if (!recommendationModes[method]) throw new Error('Choose your transportation.')
  const plan = createDemoPlan(destination, start)
  return { ...plan, id: JSON.stringify([start.placeId || start.name, destination.placeId || destination.name, method]), form: { start: start.displayName, destination: destination.displayName, method, departure }, selectedDeparture, weatherRecommendation: true }
}

export function recommendDeparture(data, selectedDeparture, durationMinutes) {
  const times = data?.hourly?.time
  if (!Array.isArray(times)) throw new Error('The starting-location forecast is unavailable. Please retry.')
  const hours = times.map((time, i) => ({
    epoch: typeof time === 'number' ? time * 1000 : NaN,
    temperature: data.hourly.temperature_2m?.[i],
    apparentTemperature: data.hourly.apparent_temperature?.[i],
  })).filter(hour => Number.isFinite(hour.epoch)).sort((a, b) => a.epoch - b.epoch)
  const valid = hour => Number.isFinite(hour?.temperature) && Number.isFinite(hour?.apparentTemperature)
  const period = hours.find(hour => selectedDeparture >= hour.epoch && selectedDeparture < hour.epoch + 3600000)
  if (!valid(period)) throw new Error('No forecast covers your selected departure time. Retry, or choose a time within the available forecast.')
  const option = (hour, departure) => ({ ...hour, departure, arrival: departure + durationMinutes * 60000, category: calculateHeatRisk({ apparentTemperature: hour.apparentTemperature }) })
  const selected = option(period, selectedDeparture)
  const upcoming = hours.filter(hour => hour.epoch > selectedDeparture && valid(hour)).map(hour => option(hour, hour.epoch))
  const mild = hour => ['comfortable', 'warm'].includes(hour.category)
  const earliestMild = upcoming.find(mild)
  let kind = 'keep'
  let recommended = selected
  if (!mild(selected)) {
    kind = earliestMild ? 'cooler' : upcoming.length ? 'no-mild' : 'no-upcoming'
    recommended = earliestMild || upcoming.reduce((best, hour) => !best || hour.apparentTemperature < best.apparentTemperature ? hour : best, null) || selected
  }
  return { selected, recommended, kind, durationMinutes, timezone: data.timezone || 'UTC', fetchedAt: new Date().toISOString(), provider: 'Open-Meteo', missingPeriods: hours.filter(hour => hour.epoch > selectedDeparture && !valid(hour)).length }
}
