const redis = require("../lib/redis");
const redisMulti = redis.multi();
const { promisify } = require("util");

const execMultiAsync = promisify(redisMulti.exec).bind(redisMulti);
module.exports = {
  async createTargets(count) {
    let promises = [];
    for (let i = 1; i < count; i++) {
      let data = this.createTarget(i);
      if (!data) throw new Error("Expected post data  to be provided!");
      // console.log("common data", data);
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
      let execdata = await execMultiAsync();
      // console.log("common execdata", execdata);
      promises.push(execdata);
    }
    return promises;
  },
  createTarget(index) {
    return (data = {
      id: index,
      url: `http://${index}.com`,
      value: index + ".50",
      maxAcceptsPerDay: index,
      accept: { geoState: ["ca", "ny"], hour: ["6", "7", "8"] },
    });
  },
};
