import { defineConfig, loadEnv } from 'vite'
import { handleJourneyRoutes } from './server/journeyRoutes.js'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const routing = {
    name: 'journey-routes',
    configureServer(server) {
      server.middlewares.use('/api/journey-routes', (req, res) => handleJourneyRoutes(req, res, { apiKey: (env.GEOAPIFY_API_KEY || env.VITE_GEOAPIFY_API_KEY) }))
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/journey-routes', (req, res) => handleJourneyRoutes(req, res, { apiKey: (env.GEOAPIFY_API_KEY || env.VITE_GEOAPIFY_API_KEY) }))
    },
  }
  return {
    plugins: [react({ jsxRuntime: 'automatic' }), routing],
    esbuild: {
      jsx: 'automatic',
    },
  }
})
