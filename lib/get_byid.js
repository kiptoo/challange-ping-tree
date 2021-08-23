var redis = require("./redis");
module.exports = async (key) => {
  let result;
  console.log("key", key);
  redis.get(key, (err, obj) => {
    if (!obj) {
      result = false;
    } else {
      result = obj;
    }
  });

  return result;
};
