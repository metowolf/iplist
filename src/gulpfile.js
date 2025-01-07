const { series, src, dest } = require('gulp')
const through2 = require('through2')
const plugin_country = require('./plugins/country')
const plugin_city = require('./plugins/city')
const plugin_cncity = require('./plugins/cncity')
const plugin_china = require('./plugins/china')
const plugin_cidrmerge = require('./plugins/cidrmerge')

const database = '/tmp/openipdb.ipdb'

const country = () => {
  return src(database)
    .pipe(through2.obj(function(file, _, cb) {
      return plugin_country(this, file, cb)
    }))
    .pipe(through2.obj(plugin_cidrmerge))
    .pipe(dest('data/country'))
}

const city = () => {
  return src(database)
    .pipe(through2.obj(function(file, _, cb) {
      return plugin_city(this, file, cb)
    }))
    .pipe(through2.obj(plugin_cidrmerge))
    .pipe(dest('data/country'))
}

const cncity = () => {
  return src(database)
    .pipe(through2.obj(function(file, _, cb) {
      return plugin_cncity(this, file, cb)
    }))
    .pipe(through2.obj(plugin_cidrmerge))
    .pipe(dest('data/cncity'))
}

const china = () => {
  return src('data/country/CN.txt')
    .pipe(through2.obj(function(file, _, cb) {
      return plugin_china(this, file, cb)
    }))
    .pipe(dest('data/special'))
}

exports.country = country
exports.city = city
exports.cncity = cncity
exports.china = china
exports.build = series(country, city, cncity, china)
