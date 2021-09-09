var redis = require('./redis')
const { promisify } = require('util')
const hget = promisify(redis.hget).bind(redis)
module.exports = async (id) => {
  if (!id) throw new Error('Expected id to be provided!')
  const targets = await hget('Targets', 'target:id-' + id)

  return JSON.parse(targets)
}
