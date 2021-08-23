var redis = require("./redis");
const { decision, higestScore } = require("./helper");
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
const zadd = promisify(redis.zadd).bind(redis);
const del = promisify(redis.del).bind(redis);
module.exports = async (data) => {
  if (!data) throw new Error("Expected accessing user to be provided!");
  console.log("data", data);

  let returnResults = smembers("TargetsSet")
    .then(async (targets) => {
      if (!targets.length) return results;
      let targetList = {};
      let results = {};
      let randomhash = Math.random().toString(36).substring(7);
      console.log("randomhash", randomhash);
      // targets.forEach(async (key) => {
      for (let i = 0; i < targets.length; i++) {
        var key = targets[i];

        let returndecision = await decision(key, data);
        console.log("returndecision", returndecision);
        if (returndecision) {
          let target = await hget("Targets", returndecision);
          let parsedTarget = JSON.parse(target);
          targetList[returndecision] = parsedTarget;
          let score = parseFloat(parsedTarget.value);
          console.log("parsedTarget score float", score);
          console.log("randomhash", randomhash);
          await zadd("scores:" + randomhash, score, key);
        }
      }
      console.log("targetList", targetList);
      if (Object.keys(targetList).length === 0) return { decision: "reject" };
      let returnScore = await higestScore(randomhash);
      console.log("randomhash", randomhash);
      console.log("higestScore", returnScore);
      if (returnScore) {
        let scorekey = returnScore[0];
        results = targetList[scorekey];
      }
      console.log("delete key : ", "scores:" + randomhash);
      await del("scores:" + randomhash);
      if (Object.keys(results).length === 0) return { decision: "reject" };
      else return { url: results.url };
    })
    .catch((e) => {
      throw e;
    });
  return returnResults;
};
