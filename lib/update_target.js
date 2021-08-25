var redis = require("./redis");
const redisMulti = redis.multi();
const { promisify } = require("util");

const keys = promisify(redis.keys).bind(redis);
const execMultiAsync = promisify(redisMulti.exec).bind(redisMulti);
module.exports = async (id, data) => {
  if (!id) throw new Error("Expected update id to be provided!");
  if (!data) throw new Error("Expected update data to be provided!");
  // console.log("data", data);
  // if (data.id) delete data.id;
  if (data.id) throw new Error("cannot change id of target");
  let key = "target:id-" + id;

  redisMulti.hset("Targets", key, JSON.stringify(data));
  redisMulti.sadd("TargetsSet", key);
  if (data.maxAcceptsPerDay)
    redisMulti.hset("maxAcceptsPerDay", key, data.maxAcceptsPerDay);
  if (data.value) redisMulti.zadd("targetValues", data.value, key);

  if (data.accept.geoState) {
    let statesList = data.accept.geoState;
    // console.log("statesList", statesList);
    let statekeys = await keys("*states*");
    // console.log("statekeys", statekeys);
    statekeys.forEach((statekey) => {
      redisMulti.srem(statekey, key);
    });

    statesList.forEach((state) => {
      redisMulti.sadd("states:" + state, key);
    });
  }
  if (data.accept.hour) {
    let hoursList = data.accept.hour;
    // console.log("hoursList", hoursList);

    let hourskeys = await keys("*hours*");
    // console.log("hourskeys", hourskeys);
    hourskeys.forEach((hourkey) => {
      redisMulti.srem(hourkey, key);
    });
    hoursList.forEach((hour) => {
      redisMulti.sadd("hours:" + hour, key);
    });
  }

  let resp = await execMultiAsync();

  if (resp.length) return { status: 200, msg: "Ok" };
  return { status: 400, msg: "fail" };
};
