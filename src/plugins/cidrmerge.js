const { merge } = require('fast-cidr-tools')

const plugin = (file, _, cb) => {
  let cidrs = file.contents.toString().split('\n')

  console.log(file.path)

  if (cidrs.length) {
    cidrs = merge(cidrs, true)
  }

  file.contents = Buffer.from(cidrs.join('\n'))
  cb(null, file)
}

module.exports = plugin
