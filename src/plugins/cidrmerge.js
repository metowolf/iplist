const cidrTools = require('cidr-tools')
const ProgressBar = require('progress')

const plugin = (file, _, cb) => {
  let cidrs = file.contents.toString().split('\n')

  console.log(file.path)

  if (cidrs.length) {
    let result = [cidrs[0]]
    let bar = new ProgressBar(':bar :current/:total', { total: cidrs.length })
    for (let i = 1; i < cidrs.length; i += 1) {
      let t = cidrTools.merge([result[result.length - 1], cidrs[i]])
      if (t.length === 1) {
        result[result.length - 1] = t[0]
      } else {
        result.push(cidrs[i])
      }
      bar.tick()
    }
    cidrs = result
    console.log()
  }

  file.contents = Buffer.from(cidrs.join('\n'))
  cb(null, file)
}

module.exports = plugin
