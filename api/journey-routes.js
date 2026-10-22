import { handleJourneyRoutes } from '../server/journeyRoutes.js'

export default function handler(req, res) {
  return handleJourneyRoutes(req, res, { apiKey: (process.env.GEOAPIFY_API_KEY || process.env.VITE_GEOAPIFY_API_KEY) })
}
