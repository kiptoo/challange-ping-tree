var redis = require("./redis");
const { promisify } = require("util");
const get = promisify(redis.get).bind(redis);
const hmgetall = promisify(redis.hgetall).bind(redis);
module.exports = async (key) => {
  return await hmgetall(key)
    .then((data) => {
      return data;
    })
    .catch((e) => {
      return e;
    });
};
