process.env.NODE_ENV = 'development'

var test = require('ava')
var servertest = require('servertest')
const redis = require('../lib/redis')
redis.select(3)
var server = require('../lib/server')

const common = require('../lib/common')
const { promisify } = require('util')
const hvals = promisify(redis.hvals).bind(redis)
const hget = promisify(redis.hget).bind(redis)
const flushdb = promisify(redis.flushdb).bind(redis)

test.beforeEach('Setup redis and add initial data', async (t) => {
  await flushdb()
  return await common.createTargets(6)
})

test.serial.cb('healthcheck', function (t) {
  var url = '/health'
  var data = {
    id: '6',
    url: 'http://example.com',
    value: '6.50',
    maxAcceptsPerDay: '6',
    accept: {
      geoState: ['ca', 'ny'],
      hour: ['1', '2', '6', '7']
    }
  }
  servertest(server(), url, {
    encoding: 'json',
    url,
    method: 'GET',
    headers: {
      'Content-type': 'application/json'
    },
    json: data
  }, function (err, res) {
    t.falsy(err, 'no error')
    t.pass('this assertion passed')
    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.status, 'OK', 'status is ok')
    t.end()
  })
})

test.serial.cb('GET  All Targets', function (t) {
  t.timeout(180000)
  var url = '/api/targets'
  var data = {
    id: '6',
    url: 'http://example.com',
    value: '6.50',
    maxAcceptsPerDay: '6',
    accept: {
      geoState: ['ca', 'ny'],
      hour: ['1', '2', '6', '7']
    }
  }
  servertest(server(), url, {
    encoding: 'json',

    method: 'GET',
    headers: {
      'Content-type': 'application/json'
    },
    json: data,
    body: data
  }, async function (err, res) {
    const targets = await hvals('Targets')

    t.falsy(err, 'no error')
    t.pass('this assertion passed')
    t.pass('this assertion passed')
    t.deepEqual(targets.length, res.body.length)

    t.is(res.statusCode, 200, 'correct status')
    t.end()
  })
})

test.serial.cb('Create a new Target', function (t) {
  t.timeout(180000)
  var url = '/api/targets'
  var data = {
    id: '6',
    url: 'http://example.com',
    value: '6.50',
    maxAcceptsPerDay: '6',
    accept: {
      geoState: ['ca', 'ny'],
      hour: ['1', '2', '6', '7']
    }
  }

  var req = servertest(server(), url, { encoding: 'json', method: 'POST' }, function (err, res) {
    hvals('Targets').then((targets) => {
      t.falsy(err, 'no error')
      t.deepEqual(targets.length, 6)
      t.is(res.statusCode, 200, 'correct status')
      t.is(res.body.status, 'Ok', 'status is ok')
      t.end()
    })
  })

  req.write(JSON.stringify(data))
  req.end()
})
test.serial.cb('Update  Target', function (t) {
  t.timeout(180000)
  var url = '/api/target/6'
  var data = {
    url: 'http://example.com',
    value: '7.50',
    maxAcceptsPerDay: '7',
    accept: {
      geoState: ['ca', 'nz'],
      hour: ['6', '7', '8']
    }
  }

  var req = servertest(server(), url, { encoding: 'json', method: 'POST' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.body.status, 'Ok', 'status is ok')
    t.is(res.statusCode, 200, 'correct status')
    t.end()
  })

  req.write(JSON.stringify(data))
  req.end()
})
test.serial.cb('Get Target By Id', function (t) {
  t.timeout(180000)
  var url = '/api/get_byid/1'

  servertest(server(), url, { encoding: 'json', method: 'GET' }, function (err, res) {
    hget('Targets', 'target:id-1').then((target) => {
      t.falsy(err, 'no error')
      t.pass('this assertion passed')
      t.deepEqual(res.body, JSON.parse(target))

      t.is(res.statusCode, 200, 'correct status')
      t.end()
    })
  })
})
test.serial.cb('Get route with highest score', function (t) {
  t.timeout(180000)
  var url = '/route'
  var data = {
    geoState: 'ca',
    publisher: 'abc',
    timestamp: '2018-07-19T23:28:59.513Z'
  }
  var req = servertest(server(), url, { encoding: 'json', method: 'POST' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct status')
    t.deepEqual(res.body.url, 'http://5.com')
    t.end()
  })

  req.write(JSON.stringify(data))
  req.end()
})

test.afterEach('Setup redis and add initial data', async (t) => {
  process.env.NODE_ENV = 'development'
  await flushdb()
})
