var redis = require("./redis");
const { promisify } = require("util");
var crypto = require("crypto");

const set = promisify(redis.set).bind(redis);
const hset = promisify(redis.hset).bind(redis);
const expire = promisify(redis.expire).bind(redis);
const rpush = promisify(redis.rpush).bind(redis);
const sadd = promisify(redis.sadd).bind(redis);
const zadd = promisify(redis.zadd).bind(redis);

module.exports = async (key, data) => {
  if (!data) throw new Error("Expected accessing user to be provided!");
  console.log("data", data);
  //create an hash with key Targets to add all targets
  let targetHash = await hset("Targets", key, JSON.stringify(data))
    .then(async (data) => {
      await sadd("TargetsSet", key);
      return data;
    })
    .catch((e) => {
      throw e;
    });
  console.log("targetHash", targetHash);
  // let scoreZset;
  // if (targetHash) {
  //   console.log("score", data.value);
  //   let score = parseFloat(data.value);
  //   console.log("score float", score);
  //   scoreZset = await zadd("scores", score, key)
  //     .then((data) => {
  //       return data;
  //     })
  //     .catch((e) => {
  //       throw e;
  //     });
  // }
  let maxAcceptsPerDay;
  // if (scoreZset) {
  if (targetHash) {
    maxAcceptsPerDay = await hset(
      "maxAcceptsPerDay",
      key,
      data.maxAcceptsPerDay
    )
      .then((data) => {
        return data;
      })
      .catch((e) => {
        throw e;
      });
  }
  let trafficCountPd;
  if (maxAcceptsPerDay) {
    // trafficCountPd = await hset("trafficCountPd", key, 0)
    trafficCountPd = await set("trafficCountPd:" + key, 0)
      .then(async (data) => {
        await expire("trafficCountPd:" + key, 86400);
        // await expire("trafficCountPd:" + key, 30);
        return data;
      })
      .catch((e) => {
        throw e;
      });
  }
  let states;
  if (trafficCountPd) {
    let promiseList = [];
    let statesList = data.accept.geoState;
    console.log("statesList", statesList);

    statesList.forEach((state) => {
      let command = sadd("states:" + key, state);
      promiseList.push(command);
    });
    states = await Promise.all(promiseList)
      .then(async (data) => {
        console.log("promise.all data", data);
        return data;
      })
      .catch((e) => {
        throw e;
      });
  }
  let hours;
  if (states) {
    let promiseList = [];
    let hoursList = data.accept.hour;
    console.log("hoursList", hoursList);

    hoursList.forEach((hour) => {
      let command = sadd("hours:" + key, hour);
      promiseList.push(command);
    });
    hours = await Promise.all(promiseList)
      .then(async (data) => {
        console.log(" hours promise.all data", data);
        return data;
      })
      .catch((e) => {
        throw e;
      });
  }
  return hours;
  // let hashKey = new Buffer.from(`${id}`).toString("base64");
  // return await hset("target", "target:" + key, data)
  //   .then((data) => {
  //     return data;
  //   })
  //   .catch((e) => {
  //     throw e;
  //   });
};
