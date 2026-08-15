import { useLocalStorage } from './useLocalStorage.js'

const STORAGE_KEY = 'heatSafe.savedCoolingPlaces'

export function useSavedCoolingPlaces() {
  const [savedPlaceIds, setSavedPlaceIds] = useLocalStorage(STORAGE_KEY, [])

  function isSaved(id) {
    return savedPlaceIds.includes(id)
  }

  function toggleSavedPlace(id) {
    const nextValue = isSaved(id)
      ? savedPlaceIds.filter((placeId) => placeId !== id)
      : [...savedPlaceIds, id]
    setSavedPlaceIds(nextValue)
    return !isSaved(id)
  }

  return { savedPlaceIds, isSaved, toggleSavedPlace }
}
