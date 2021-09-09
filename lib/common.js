const redis = require('../lib/redis')
const redisMulti = redis.multi()
const { promisify } = require('util')

const execMultiAsync = promisify(redisMulti.exec).bind(redisMulti)
module.exports = {
  async createTargets (count) {
    const promises = []
    for (let i = 1; i < count; i++) {
      const data = this.createTarget(i)
      if (!data) throw new Error('Expected post data  to be provided!')

      const key = 'target:id-' + data.id

      redisMulti.hset('Targets', key, JSON.stringify(data))
      redisMulti.sadd('TargetsSet', key)
      redisMulti.hset('maxAcceptsPerDay', key, data.maxAcceptsPerDay)
      redisMulti.zadd('targetValues', data.value, key)
      redisMulti.set('trafficCountPd:' + key, 0)
      redisMulti.expire('trafficCountPd:' + key, 86400)
      const statesList = data.accept.geoState

      statesList.forEach((state) => {
        redisMulti.sadd('states:' + state, key)
      })

      const hoursList = data.accept.hour

      hoursList.forEach((hour) => {
        redisMulti.sadd('hours:' + hour, key)
      })
      const execdata = await execMultiAsync()

      promises.push(execdata)
    }
    return promises
  },
  createTarget (index) {
    return ({
      id: index,
      url: `http://${index}.com`,
      value: index + '.50',
      maxAcceptsPerDay: index,
      accept: { geoState: ['ca', 'ny'], hour: ['2', '3', '6', '7', '8'] }
    })
  }
}
