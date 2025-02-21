const list = require('./data')

const query = (country, region, city) => {
  if (country === '中国') {
    if (list[region]) {
      if (!city) {
        return list[region][region].toString()
      }
      if (list[region][city]) {
        return list[region][city].toString()
      }
    }
    // 尝试前缀匹配
    for (const key in list) {
      if (region.indexOf(key) === 0) {
        if (city) {
          const cityList = list[key]
          for (const cityKey in cityList) {
            if (city.indexOf(cityKey) === 0) {
              return cityList[cityKey].toString()
            }
          }
        }
        return list[key][key].toString()
      }
    }
    return '100000'
  }
  // 港澳台地区
  if (country === '中国香港') {
    return '810000'
  }
  if (country === '中国澳门') {
    return '820000'
  }
  if (country === '中国台湾' || country === '台湾') {
    return '710000'
  }
  return ''
}

const patch = data => {
  if (!data.china_admin_code) {
    data.china_admin_code = query(data.country_name, data.region_name, data.city_name)
  }
  return data
}

module.exports = patch
