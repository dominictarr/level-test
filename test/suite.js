'use strict'

var test = require('tape')
var abstract = require('abstract-leveldown')

function isAbstract (db) {
  if (!db || typeof db !== 'object') { return false }
  return Object.keys(abstract.AbstractLevelDOWN.prototype).filter(function (name) {
    return name[0] !== '_'
  }).every(function (name) {
    return typeof db[name] === 'function'
  })
}

function down (db, type) {
  if (typeof db.down === 'function') return db.down(type)
  if (type && db.type === type) return db
  if (isAbstract(db.db)) return down(db.db, type)
  if (isAbstract(db._db)) return down(db._db, type)
  return type ? null : db
}

exports.clean = function (level) {
  test('clean', function (t) {
    t.plan(5)

    var db = level({ clean: true })

    db.get('foo', function (err) {
      t.ok(err)

      db.put('foo', 'bar', function (err) {
        t.error(err)

        db.get('foo', function (err) {
          t.notOk(err)

          db.close(function (err) {
            t.error(err)

            var db2 = level({ clean: true })
            db2.get('foo', function (err) {
              t.ok(err)
            })
          })
        })
      })
    })
  })
}

exports.args = function (level, expectedDown) {
  test('without arguments', function (t) {
    t.plan(3)

    var db = level()

    db.on('open', function () {
      t.ok(down(db) instanceof expectedDown, 'got expected down')
    })

    db.put('foo', 'bar', function (err) {
      t.ifError(err)
      t.notOk(err)
    })
  })

  test('with options and callback', function (t) {
    t.plan(6)

    level({ valueEncoding: 'json' }, function (err, db) {
      t.ifError(err)
      t.ok(db.isOpen())
      t.ok(down(db) instanceof expectedDown, 'got expected down')

      var key = '' + Math.random()
      var value = { test_key: '' + new Date() }

      db.put(key, value, function (err) {
        t.notOk(err)

        db.get(key, function (err, _value) {
          t.ifError(err)
          t.deepEqual(_value, value)
        })
      })
    })
  })

  test('with options', function (t) {
    t.plan(4)

    var db = level({ valueEncoding: 'json' })
    var key = '' + Math.random()
    var value = { test_key: '' + new Date() }

    db.on('open', function () {
      t.ok(down(db) instanceof expectedDown, 'got expected down')
    })

    db.put(key, value, function (err) {
      t.notOk(err)

      db.get(key, function (err, _value) {
        t.ifError(err)
        t.deepEqual(_value, value)
      })
    })
  })

  test('with callback', function (t) {
    t.plan(6)

    level(function (err, db) {
      t.ifError(err)
      t.ok(db.isOpen())
      t.ok(down(db) instanceof expectedDown, 'got expected down')

      db.put('key', 'value', function (err) {
        t.notOk(err)

        db.get('key', function (err, value) {
          t.ifError(err)
          t.is(value, 'value')
        })
      })
    })
  })
}

exports.options = function (levelTest) {
  test('opts precedence', function (t) {
    t.plan(6)

    var level = levelTest({ valueEncoding: 'utf8' })
    var db1 = level()
    var db2 = level({ valueEncoding: 'json' })
    var value = { test: true }

    db1.put('key', value, function (err) {
      t.ifError(err)

      db1.get('key', function (err, value1) {
        t.ifError(err)
        t.is(value1, '[object Object]')
      })
    })

    db2.put('key', value, function (err) {
      t.ifError(err)

      db2.get('key', function (err, value2) {
        t.ifError(err)
        t.deepEqual(value2, value)
      })
    })
  })
}
