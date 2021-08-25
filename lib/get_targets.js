var redis = require("./redis");
const { promisify } = require("util");
const hvals = promisify(redis.hvals).bind(redis);
module.exports = async (key) => {
  if (!key) throw new Error("Expected key to be provided!");
  let targets = await hvals(key);
  let jsonData = [];
  jsonData = targets.map((target) => {
    return JSON.parse(target);
  });

  if (!jsonData.length) {
    return [];
  } else {
    return jsonData;
  }
};
