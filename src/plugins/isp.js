const vinyl = require('vinyl')
const IPDB = require('ipdb')
const ipdb_range = require('@ipdb/range')
const ProgressBar = require('progress')

const ISP_MAP = {
  // 中国运营商
  'chinatelecom.com.cn': 'chinatelecom', // 中国电信
  'chinaunicom.com': 'chinaunicom', // 中国联通
  'chinamobile.com': 'chinamobile', // 中国移动
  'drpeng.com.cn': 'drpeng', // 彭博士
  'cernet.edu.cn': 'cernet', // 中国教育网
  'cstnet.cn': 'cstnet', // 中国科技网
  // 常见云服务商
  'aliyun.com': 'aliyun', // 阿里云
  'tencent.com': 'tencent', // 腾讯云
  'cloudflare.com': 'cloudflare',
  'huawei.com': 'huawei', // 华为云
  'microsoft.com': 'microsoft',
  'bytedance.com': 'bytedance', // 字节跳动
  'volcengine.com': 'volcengine', // 火山引擎
  'cloud.google.com': 'googlecloud', // Google Cloud
  'digitalocean.com': 'digitalocean', // DigitalOcean
}

const plugin = (through2, file, cb) => {

  console.log('Parse ipdb')

  const ipdb = new IPDB(file.contents, {
    patches: [ipdb_range]
  })

  let bar = new ProgressBar(':bar :current/:total', { total: ipdb.meta.node_count })

  let result = []
  let ip = '0.0.0.0'
  while (true) {
    const info = ipdb.find(ip).data
    const isp = info.isp_domain || ''
    if (isp.length > 0 && ISP_MAP[isp]) {
      const ispName = ISP_MAP[isp]
      if (!result[ispName]) {
        result[ispName] = []
      }
      result[ispName].push(`${info.range.from}/${info.bitmask}`)
    }
    bar.tick()
    ip = info.range.next
    if (ip === '0.0.0.0') break
  }

  console.log()

  for (let [isp, cidrs] of Object.entries(result)) {
    let temp = new vinyl({
      cwd: '/',
      base: '/',
      path: `/${isp}.txt`,
      contents: new Buffer.from(cidrs.join('\n'))
    })
    through2.push(temp)
  }

  cb()
}

module.exports = plugin
