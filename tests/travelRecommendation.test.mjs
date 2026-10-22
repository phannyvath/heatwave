import test from 'node:test'
import assert from 'node:assert/strict'
import { createRecommendation } from '../src/utils/demoRecommendation.js'
const destination = { name: 'Demo Library' }
for (const [method, minutes] of [['WALK', 12], ['TRANSIT', 8], ['DRIVE', 4]]) {
  test(`${method}: departure equals arrival minus ${minutes} minutes, including date rollover`, () => {
    const arrival = '2030-01-02T00:05:00+11:00'
    const plan = createRecommendation({ destination, method, arrival }, Date.parse('2030-01-01T00:00:00Z'))
    assert.equal(plan.recommendation.departure, Date.parse(arrival) - minutes * 60000)
    assert.equal(plan.recommendation.durationMinutes, minutes)
    assert.equal(plan.form.arrival, arrival)
    assert.equal(plan.form.method, method)
  })
}
test('rejects invalid times and departures that are already due', () => {
  assert.throws(() => createRecommendation({ destination, method: 'WALK', arrival: 'invalid' }))
  assert.throws(() => createRecommendation({ destination, method: 'WALK', arrival: new Date(600000).toISOString() }, 0), /later arrival/)
})
