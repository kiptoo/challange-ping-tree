process.env.NODE_ENV = "development";

var test = require("ava");
var servertest = require("servertest");
const redis = require("../lib/redis");
var server = require("../lib/server");
const app = require("../index");
const config = require("../config");
const common = require("./common");
const axios = require("axios");
const redisMulti = redis.multi();
const { promisify } = require("util");
const hvals = promisify(redis.hvals).bind(redis);
const hget = promisify(redis.hget).bind(redis);
const flushall = promisify(redis.flushall).bind(redis);

const execMultiAsync = promisify(redisMulti.exec).bind(redisMulti);
test.beforeEach("Setup redis and add initial data", async (t) => {
  await flushall();
  return await common.createTargets(5);
});

test.serial.cb("healthcheck", function (t) {
  var url = "/health";
  servertest(server(), url, { encoding: "json" }, function (err, res) {
    t.falsy(err, "no error");

    t.is(res.statusCode, 200, "correct statusCode");
    t.is(res.body.status, "OK", "status is ok");
    t.end();
  });
});
test("Create a new Target", async (t) => {
  var url = `http://localhost:${config.serverport}/api/targets`;

  var data = {
    id: "6",
    url: "http://example.com",
    value: "6.50",
    maxAcceptsPerDay: "6",
    accept: {
      geoState: ["ca", "ny"],
      hour: ["1", "2", "6", "7"],
    },
  };
  const res = await axios({
    method: "POST",
    url: url,
    data: data,
  });
  let targets = await hvals("Targets");

  t.deepEqual(targets.length, 5);

  t.is(res.status, 200, "correct status");
  t.is(res.data.status, "Ok", "status is ok");
});
test("Update  Target", async (t) => {
  var url = `http://localhost:${config.serverport}/api/target/6`;

  var data = {
    url: "http://example.com",
    value: "7.50",
    maxAcceptsPerDay: "7",
    accept: {
      geoState: ["ca", "nz"],
      hour: ["6", "7", "8"],
    },
  };
  const res = await axios({
    method: "POST",
    url: url,
    data: data,
  });

  let target = await hget("Targets", "target:id-6");

  t.deepEqual(JSON.parse(target), data);

  t.is(res.status, 200, "correct status");
  t.is(res.data.status, "Ok", "status is ok");
});

test("get all targets", async (t) => {
  var url = `http://localhost:${config.serverport}/api/targets`;

  const res = await axios({
    method: "GET",
    url: url,
    // data: data,
  });

  let targets = await hvals("Targets");
  let jsonData = [];
  jsonData = targets.map((target) => {
    return JSON.parse(target);
  });

  t.deepEqual(targets.length, 4);
  t.deepEqual(res.data, jsonData);

  t.is(res.status, 200, "correct status");
});
test("get Target by id", async (t) => {
  var url = `http://localhost:${config.serverport}/api/get_byid/1`;

  const res = await axios({
    method: "GET",
    url: url,
    // data: data,
  });

  let targets = await hget("Targets", "target:id-1");

  t.deepEqual(res.data, JSON.parse(targets));

  t.is(res.status, 200, "correct status");
});
test("get route with highest score", async (t) => {
  var url = `http://localhost:${config.serverport}/route`;

  var data = {
    geoState: "ca",
    publisher: "abc",
    timestamp: "2018-07-19T23:28:59.513Z",
  };
  const res = await axios({
    method: "POST",
    url: url,
    data: data,
  });

  t.is(res.status, 200, "correct status");
  t.is(res.data.url, "http://4.com", "status is ok");
});
