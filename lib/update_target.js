var redis = require('./redis')
const redisMulti = redis.multi()
const { promisify } = require('util')

const keys = promisify(redis.keys).bind(redis)
const execMultiAsync = promisify(redisMulti.exec).bind(redisMulti)
module.exports = async (id, data) => {
  if (!id) throw new Error('Expected update id to be provided!')
  if (!data) throw new Error('Expected update data to be provided!')

  if (data.id) throw new Error('cannot change id of target')
  const key = 'target:id-' + id

  redisMulti.hset('Targets', key, JSON.stringify(data))
  redisMulti.sadd('TargetsSet', key)
  if (data.maxAcceptsPerDay) { redisMulti.hset('maxAcceptsPerDay', key, data.maxAcceptsPerDay) }
  if (data.value) redisMulti.zadd('targetValues', data.value, key)

  if (data.accept.geoState) {
    const statesList = data.accept.geoState

    const statekeys = await keys('*states*')

    statekeys.forEach((statekey) => {
      redisMulti.srem(statekey, key)
    })

    statesList.forEach((state) => {
      redisMulti.sadd('states:' + state, key)
    })
  }
  if (data.accept.hour) {
    const hoursList = data.accept.hour

    const hourskeys = await keys('*hours*')

    hourskeys.forEach((hourkey) => {
      redisMulti.srem(hourkey, key)
    })
    hoursList.forEach((hour) => {
      redisMulti.sadd('hours:' + hour, key)
    })
  }

  const resp = await execMultiAsync()

  if (resp.length) return { status: 200, msg: 'Ok' }
  return { status: 400, msg: 'fail' }
}
