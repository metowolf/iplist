const { merge } = require('../lib/cidr')
const through2 = require('through2')
const vinyl = require('vinyl')
const path = require('path')

const plugin = () => {
  let all = []

  return through2.obj(
    function (file, _, cb) {
      if (path.basename(file.path) !== 'CN.txt') {
        const lines = file.contents.toString().trim().split('\n').filter(Boolean)
        all = all.concat(lines)
      }
      cb()
    },
    function (cb) {
      const merged = merge(all, true)
      this.push(new vinyl({
        cwd: '/',
        base: '/',
        path: '/non-china.txt',
        contents: Buffer.from(merged.join('\n'))
      }))
      cb()
    }
  )
}

module.exports = plugin
