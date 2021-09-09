var redis = require('./redis')
const redisMulti = redis.multi()
const { promisify } = require('util')

const hget = promisify(redis.hget).bind(redis)
const get = promisify(redis.get).bind(redis)
const incr = promisify(redis.incr).bind(redis)
const sadd = promisify(redis.sadd).bind(redis)
const del = promisify(redis.del).bind(redis)
const smembers = promisify(redis.smembers).bind(redis)

const execMultiAsync = promisify(redisMulti.exec).bind(redisMulti)

module.exports = async (data) => {
  if (!data) throw new Error('Expected post data to be provided!')

  var myDate = new Date(data.timestamp)

  var hour = myDate.getHours()

  redisMulti.sinterstore(
    'target:decision',
    'TargetsSet',
    'states:' + data.geoState,
    'hours:' + hour
  )
  await execMultiAsync()
  await smembers('target:decision').then(async (memberData) => {
    await del('target:decision:belowmax')

    for (let i = 0; i < memberData.length; i++) {
      const element = memberData[i]

      let max = await hget('maxAcceptsPerDay', element)
      let count = await get('trafficCountPd:' + element)
      count = parseInt(count)
      max = parseInt(max)

      if (count + 1 <= max) {
        await sadd('target:decision:belowmax', element)
      }
    }
  })

  redisMulti.zinterstore(
    'target:decision:zinter',
    2,
    'targetValues',

    'target:decision:belowmax',
    'AGGREGATE',
    'MAX'
  )
  redisMulti.zpopmax('target:decision:zinter')

  const resp = await execMultiAsync()

  if (!resp[1].length) return { decision: 'reject' }
  const highscore = resp[1][0]

  await incr('trafficCountPd:' + highscore)

  const target = await hget('Targets', highscore)

  const jsonParsed = JSON.parse(target)

  return { url: jsonParsed.url }
}
