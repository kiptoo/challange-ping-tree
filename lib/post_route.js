var redis = require("./redis");
const redisMulti = redis.multi();
const { promisify } = require("util");

const hget = promisify(redis.hget).bind(redis);
const get = promisify(redis.get).bind(redis);
const incr = promisify(redis.incr).bind(redis);
const sadd = promisify(redis.sadd).bind(redis);
const del = promisify(redis.del).bind(redis);
const sinterstore = promisify(redis.sinterstore).bind(redis);
const smembers = promisify(redis.smembers).bind(redis);

const execMultiAsync = promisify(redisMulti.exec).bind(redisMulti);

module.exports = async (data) => {
  // console.log("route data controller 1", data);
  if (!data) throw new Error("Expected post data to be provided!");

  var myDate = new Date(data.timestamp);

  var hour = myDate.getMonth();

  redisMulti.sinterstore(
    "target:decision",
    "TargetsSet",
    "states:" + data.geoState,
    "hours:" + hour
  );
  let exec1 = await execMultiAsync();
  // console.log("execMultiAsync exec1", exec1);
  await smembers("target:decision").then(async (data) => {
    // console.log(" redisMulti.sinterstore", data);
    await del("target:decision:belowmax");
    // console.log("after delete");
    for (let i = 0; i < data.length; i++) {
      let element = data[i];

      // console.log(" smembers element", element);
      let max = await hget("maxAcceptsPerDay", element);
      let count = await get("trafficCountPd:" + element);
      count = parseInt(count);
      max = parseInt(max);
      // console.log(" smembers max", max);
      // console.log(" smembers count", count);

      if (count + 1 <= max) {
        await sadd("target:decision:belowmax", element);
      }
    }
    // });
  });

  redisMulti.zinterstore(
    "target:decision:zinter",
    2,
    "targetValues",
    // "target:decision",
    "target:decision:belowmax",
    "AGGREGATE",
    "MAX"
  );
  redisMulti.zpopmax("target:decision:zinter");

  let resp = await execMultiAsync();

  // console.log("execMultiAsync", resp);

  if (!resp[1].length) return { decision: "reject" };
  let highscore = resp[1][0];
  // console.log("highscore", highscore);
  await incr("trafficCountPd:" + highscore);

  let target = await hget("Targets", highscore);

  let jsonParsed = JSON.parse(target);
  // console.log("top target jsonParsed", jsonParsed);
  return { url: jsonParsed.url };
};
