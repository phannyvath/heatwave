export const heatRiskContent = {
  comfortable: {
    label: 'Comfortable',
    badge: 'Comfortable conditions',
    tone: 'safe',
    color: 'bg-safe',
    message: 'Conditions are currently comfortable. Normal care is usually enough.',
    advice: 'Keep water nearby and enjoy your day with normal care.',
  },
  warm: {
    label: 'Warm',
    badge: 'Warm conditions today',
    tone: 'high',
    color: 'bg-yellow-400',
    message: 'Warm conditions today. Plan water, shade and comfortable travel times.',
    advice: 'Carry water, use sunscreen, wear light clothing and choose shade when you can.',
  },
  hot: {
    label: 'Hot',
    badge: 'Hot conditions today',
    tone: 'danger',
    color: 'bg-heat',
    message: 'Hot conditions are expected. Avoid long outdoor periods during the warmest hours.',
    advice: 'Consider shorter outdoor trips, cooler rest stops and a later travel time.',
  },
  'very-hot': {
    label: 'Very hot',
    badge: 'Very hot conditions today',
    tone: 'danger',
    color: 'bg-danger',
    message: 'Very hot conditions are expected. Change outdoor plans where possible and prepare a cooler place.',
    advice: 'Prepare water, cooling options, transport plans and check in with friends.',
  },
}

export function calculateHeatRisk({ apparentTemperature, dailyMaximum, dailyMinimum, uvIndex }) {
  if (apparentTemperature >= 42 || dailyMaximum >= 40 || dailyMinimum >= 26) {
    return 'very-hot'
  }

  if (apparentTemperature >= 38 || dailyMaximum >= 35 || uvIndex >= 11) {
    return 'hot'
  }

  if (apparentTemperature >= 32 || dailyMaximum >= 30 || uvIndex >= 8) {
    return 'warm'
  }

  return 'comfortable'
}

export function calculateDailyHeatRisk(day) {
  return calculateHeatRisk({
    apparentTemperature: day.apparentMax,
    dailyMaximum: day.max,
    dailyMinimum: day.min,
    uvIndex: day.uvMax,
  })
}
