const cidrTools = require('cidr-tools')

const plugin = (through2, file, cb) => {

  let data = file.contents.toString().trim().split('\n')

  let white = `
1.8.0.0/16
1.24.0.0/13
52.80.0.0/14
61.128.0.0/10
112.0.0.0/10
119.90.0.0/15
121.59.0.0/16
124.250.192.0/18
128.108.0.0/16
129.28.0.0/16
159.226.0.0/16
182.254.0.0/17
202.96.0.0/12
210.52.0.0/15
211.64.0.0/13
211.136.0.0/13
218.104.0.0/14
219.90.68.0/22
219.90.72.0/21
219.128.0.0/11
223.120.0.0/13
`
  white = white.trim().split('\n')
  data = cidrTools.merge([...data, ...white])

  file.contents = Buffer.from(data.join('\n'))
  file.path = file.path.replace('CN.txt', 'china.txt')
  cb(null, file)
}

module.exports = plugin
