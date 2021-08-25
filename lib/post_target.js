var redis = require("./redis");
const redisMulti = redis.multi();
const { promisify } = require("util");

const execMultiAsync = promisify(redisMulti.exec).bind(redisMulti);
module.exports = async (data) => {
  if (!data) throw new Error("Expected post data  to be provided!");
  // console.log("data", data);
  //create an hash with key Targets to add all targets
  let key = "target:id-" + data.id;

  redisMulti.hset("Targets", key, JSON.stringify(data));
  redisMulti.sadd("TargetsSet", key);
  redisMulti.hset("maxAcceptsPerDay", key, data.maxAcceptsPerDay);
  redisMulti.zadd("targetValues", data.value, key);
  redisMulti.set("trafficCountPd:" + key, 0);
  redisMulti.expire("trafficCountPd:" + key, 86400);
  let statesList = data.accept.geoState;
  // console.log("statesList", statesList);

  statesList.forEach((state) => {
    redisMulti.sadd("states:" + state, key);
  });

  let hoursList = data.accept.hour;
  // console.log("hoursList", hoursList);

  hoursList.forEach((hour) => {
    redisMulti.sadd("hours:" + hour, key);
  });

  let resp = await execMultiAsync();

  if (resp.length) return { status: 200, msg: "Ok" };
  return { status: 200, msg: "fail" };
};
