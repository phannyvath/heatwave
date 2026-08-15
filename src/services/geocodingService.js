const GEOCODING_BASE_URL = import.meta.env.VITE_OPEN_METEO_GEOCODING_URL || 'https://geocoding-api.open-meteo.com/v1/search'

const adminStateNames = {
  'Australian Capital Territory': 'ACT',
  'New South Wales': 'NSW',
  'Northern Territory': 'NT',
  Queensland: 'QLD',
  'South Australia': 'SA',
  Tasmania: 'TAS',
  Victoria: 'VIC',
  'Western Australia': 'WA',
}

export async function searchAustralianLocations(query, { signal } = {}) {
  const params = new URLSearchParams({
    name: query,
    count: '8',
    language: 'en',
    format: 'json',
    countryCode: 'AU',
  })

  const response = await fetch(`${GEOCODING_BASE_URL}?${params}`, { signal })
  if (!response.ok) {
    throw new Error('Suburb search is unavailable')
  }

  const data = await response.json()
  return (data.results || []).map((result) => ({
    id: `${result.id}-${result.latitude}-${result.longitude}`,
    name: result.name,
    state: adminStateNames[result.admin1] || result.admin1 || 'Australia',
    postcode: result.postcodes?.[0] || '',
    latitude: result.latitude,
    longitude: result.longitude,
    source: 'manual',
  }))
}
