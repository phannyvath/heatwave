function sameDay(isoTime, date = new Date()) {
  return new Date(isoTime).toDateString() === date.toDateString()
}

export function getUpcomingTodayHours(hourly, now = new Date()) {
  return hourly.filter((hour) => sameDay(hour.time, now) && new Date(hour.time) >= now)
}

export function getHottestHour(hourly) {
  return hourly.reduce((hottest, hour) => {
    if (!hottest || hour.apparentTemperature > hottest.apparentTemperature) return hour
    return hottest
  }, null)
}

export function getHeatStatus({ forecast, climate }) {
  const today = forecast.daily[0]
  const temperatureDifference = climate ? Math.round(today.max - climate.monthlyAverageMax) : null
  const persistentHeat = climate
    ? forecast.daily.slice(0, 3).every((day) => day.max > climate.monthlyAverageMax && day.min > climate.monthlyAverageMin)
    : false

  if (persistentHeat) {
    return {
      level: 'Persistent heat',
      tone: 'danger',
      temperatureDifference,
      message: 'Hot days and warm nights are expected to continue. Your body may have less time to recover overnight.',
      priority: 4,
    }
  }

  if ((temperatureDifference ?? -Infinity) >= 5 || forecast.current.apparentTemperature >= 38) {
    return {
      level: 'High heat',
      tone: 'danger',
      temperatureDifference,
      message: 'High heat is expected today. Consider adjusting outdoor plans during the hottest hours.',
      priority: 3,
    }
  }

  if ((temperatureDifference ?? -Infinity) >= 3 || forecast.current.apparentTemperature >= 32) {
    return {
      level: 'Warmer than usual',
      tone: 'high',
      temperatureDifference,
      message: 'Today is warmer than usual. A few small preparations may help you stay comfortable.',
      priority: 2,
    }
  }

  return {
    level: 'Comfortable',
    tone: 'safe',
    temperatureDifference,
    message: 'Conditions are close to the usual temperature for this location.',
    priority: 1,
  }
}

export function getTravelSuggestion(hourly, selectedTime = new Date()) {
  const now = new Date()
  const selected = selectedTime instanceof Date ? selectedTime : new Date(selectedTime)
  const remaining = getUpcomingTodayHours(hourly, now).filter((hour) => {
    const date = new Date(hour.time)
    return date.getHours() < 21
  })
  if (!remaining.length) {
    return {
      message: 'Temperatures are expected to remain similar this evening. Bring water and consider a cool rest location.',
      hottestHour: null,
      suggestedHour: null,
      difference: 0,
    }
  }

  const hottestHour = getHottestHour(remaining)
  const suggestedHour = remaining.reduce((coolest, hour) =>
    hour.apparentTemperature < coolest.apparentTemperature ? hour : coolest,
  )
  const selectedHour =
    remaining.find((hour) => new Date(hour.time).getHours() === selected.getHours()) || remaining[0]
  const difference = Math.round(selectedHour.apparentTemperature - suggestedHour.apparentTemperature)

  if (difference < 2) {
    return {
      message: 'Temperatures are expected to remain similar this evening. Bring water and consider a cool rest location.',
      hottestHour,
      suggestedHour,
      difference,
    }
  }

  return {
    message: `Leaving after ${new Intl.DateTimeFormat('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(suggestedHour.time))} may feel approximately ${difference}°C cooler.`,
    hottestHour,
    suggestedHour,
    difference,
  }
}

export function getUvLabel(value) {
  if (value >= 11) return 'Extreme'
  if (value >= 8) return 'Very high'
  if (value >= 6) return 'High'
  if (value >= 3) return 'Moderate'
  return 'Low'
}
