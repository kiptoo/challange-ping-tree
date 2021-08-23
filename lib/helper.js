var redis = require("./redis");
const redisMulti = redis.multi();
const { promisify } = require("util");
const scan = promisify(redis.scan).bind(redis);
const hset = promisify(redis.hset).bind(redis);
const expire = promisify(redis.expire).bind(redis);
const rpush = promisify(redis.rpush).bind(redis);
const sScan = promisify(redis.sscan).bind(redis);
const hgetall = promisify(redis.hgetall).bind(redis);
const hget = promisify(redis.hget).bind(redis);
const incr = promisify(redis.incr).bind(redis);
const get = promisify(redis.get).bind(redis);
const smembers = promisify(redis.smembers).bind(redis);
const ismember = promisify(redis.sismember).bind(redis);
const keyexists = promisify(redis.exists).bind(redis);
const zpopmax = promisify(redis.zpopmax).bind(redis);
const hScan = promisify(redis.hscan).bind(redis);
const zScan = promisify(redis.zscan).bind(redis);
const execMultiAsync = promisify(redisMulti.exec).bind(redisMulti);

const decision = async (key, data) => {
  console.log("decision key", key);
  console.log("decision  data.geoState", data.geoState);
  console.log("decision  key", "states:" + key);
  let iSinStates = await ismember("states:" + key, data.geoState);
  console.log("decision iSinStates", iSinStates);
  if (!iSinStates) return false;
  var myDate = new Date(data.timestamp);
  console.log("myDate", myDate);
  var hour = myDate.getMonth();

  console.log("hours", hour);
  let isInHours = await ismember("hours:" + key, hour);
  console.log("isInHours", isInHours);
  if (!isInHours) return false;
  let iskey = await keyexists("trafficCountPd:" + key);
  console.log("iskey", iskey);
  let maxTraffic;
  if (iskey) {
    maxTraffic = await hget("maxAcceptsPerDay", key).then(async (max) => {
      let count = await get("trafficCountPd:" + key);
      console.log("trafficCountPd", count);
      console.log("maxAcceptsPerDay", max);
      count = parseInt(count) + 1;
      max = parseInt(max);
      console.log("count", count);
      let exp = count <= max;
      console.log("exp", exp);
      if (count <= max) {
        await incr("trafficCountPd:" + key);
        return false;
      } else {
        return true;
      }
    });
  }
  console.log("maxTraffic", maxTraffic);
  if (maxTraffic) return false;

  if (!iskey) {
    await set("trafficCountPd:" + key, 1);
  }
  // results.push(key)
  return key;
};
const higestScore = async (key) => {
  console.log(" higestScore key", "scores:" + key);
  let max = await zpopmax("scores:" + key);
  console.log("higestScore max", max);
  return max;
};
module.exports = { decision, higestScore };
