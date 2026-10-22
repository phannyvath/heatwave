// Use location time, never the browser's timezone. Search actual instants so
// skipped DST times are rejected and repeated times choose the next occurrence.
export function localStamp(epoch, timezone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(epoch)).map(({ type, value }) => [type, value]))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

export function nextDeparture(time, timezone, now = new Date()) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('invalidTime')
  const today = localStamp(now.getTime(), timezone).slice(0, 10)
  const base = Date.parse(`${today}T${time}:00Z`)
  for (let day = 0; day < 2; day++) {
    const target = new Date(base + day * 86400000).toISOString().slice(0, 16)
    const matches = []
    for (let offset = -14 * 60; offset <= 14 * 60; offset += 15) {
      const epoch = base + day * 86400000 + offset * 60000
      if (epoch >= now.getTime() && localStamp(epoch, timezone) === target) matches.push(epoch)
    }
    if (matches.length) return Math.min(...matches)
    // A future wall time that does not exist today must not silently move a day.
    if (day === 0 && target > localStamp(now.getTime(), timezone)) throw new Error('invalidTime')
  }
  throw new Error('invalidTime')
}
