require("dotenv").config();

module.exports = {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    // host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    ...(process.env.NODE_ENV === "test" ? { fast: true } : {}),
  },
  serverport: process.env.PORT || 5000,
};
