import { createDemoPlan, demoTravelModes } from '../data/demoDirections.js'

export const recommendationModes = { WALK: demoTravelModes.walking, TRANSIT: demoTravelModes.transit, DRIVE: demoTravelModes.driving }

export function createRecommendation({ destination, start, method, arrival }, now = Date.now()) {
  const estimate = recommendationModes[method]
  const arrivalEpoch = new Date(arrival).getTime()
  if (!estimate || !Number.isFinite(arrivalEpoch)) throw new Error('Choose a valid arrival date, time and transportation.')
  const departure = arrivalEpoch - estimate.minutes * 60000
  if (departure <= now) throw new Error('Choose a later arrival time so your recommended departure is still in the future.')
  const plan = createDemoPlan(destination, start)
  return { ...plan, id: JSON.stringify([plan.places.start.name, destination.name, method]), form: { ...plan.form, method, arrival }, recommendation: { arrival: arrivalEpoch, departure, durationMinutes: estimate.minutes } }
}
