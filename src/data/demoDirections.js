// Fixed Melbourne CBD geometry. Names are illustrative; never use for navigation.
export const demoRoute = [
  [-37.81002, 144.96278], // Melbourne Central / La Trobe Street
  [-37.80922, 144.96003], // Elizabeth Street
  [-37.81151, 144.95898], // Lonsdale Street
  [-37.81252, 144.96244], // Swanston Street
]
export const demoMapBounds = [[-37.815, 144.956], [-37.807, 144.967]]
export const demoTravelModes = {
  cycling: { label: 'Cycling', time: '5 minutes', distance: '850 m', journey: 'Follow the highlighted demo route toward' },
  walking: { label: 'Walking', minutes: 12, time: '12 minutes', distance: '850 m', journey: 'Follow the highlighted streets toward' },
  transit: { label: 'Public transport', minutes: 8, time: '8 minutes', distance: '850 m total · 200 m walking', journey: 'Walk to the demo stop, take the sample service, then walk to' },
  driving: { label: 'Driving', minutes: 4, time: '4 minutes', distance: '1.2 km', journey: 'Follow the highlighted road route to' },
}

export function createDemoPlan(destination, start = { name: 'Your location (demo)' }) {
  return { id: JSON.stringify([start.name, destination.name, 'WALK']), form: { start: start.name, destination: destination.name, method: 'WALK' }, places: { start, destination }, checkedAt: new Date().toISOString(), journey: null }
}
