<p align="center">
<a href="https://github.com/metowolf/iplist">
<img src="https://user-images.githubusercontent.com/2666735/50806883-84930c00-1333-11e9-869e-3c2f2664f154.png" />
</a>
</p>

<h1 align="center">IP 地址库</h1>

<p align="center">数据基于 OpenIPDB 分类</p>

<p align=center>
<a href="https://i-meto.com/">Author Website</a> ·
<a href="https://github.com/metowolf/iplist">Project Source</a> ·
<a href="https://twitter.com/metowolf">Twitter</a>
</p>

***

## 分类
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fmetowolf%2Fiplist.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fmetowolf%2Fiplist?ref=badge_shield)


### 国家 IP 段

采用 [ISO_3166-1](https://zh.wikipedia.org/wiki/ISO_3166-1%E4%BA%8C%E4%BD%8D%E5%AD%97%E6%AF%8D%E4%BB%A3%E7%A0%81) 进行分类

|Country|CIDR|
|---|---|
|中国 (CN)|https://raw.githubusercontent.com/metowolf/iplist/master/data/country/CN.txt|
|中国香港|https://raw.githubusercontent.com/metowolf/iplist/master/data/country/HK.txt|
|美国|https://raw.githubusercontent.com/metowolf/iplist/master/data/country/US.txt|
|日本|https://raw.githubusercontent.com/metowolf/iplist/master/data/country/JP.txt|
||[ > 查看更多](https://github.com/metowolf/iplist/tree/master/docs/country.md)|

### 中国内地 IP 段 🌟

由于网络审查的原因，你可能需要一份「中国内地区域的 IP 地址列表」，数据精确度可以自行多方比对，仅供参考，数据每小时更新一次。

详情 https://github.com/metowolf/iplist/blob/master/docs/china.md

|Country|CIDR|
|---|---|
|中国内地 (CN)|https://raw.githubusercontent.com/metowolf/iplist/master/data/special/china.txt|

### 省级 IP 段

采用 [行政区划代码](http://www.mca.gov.cn/article/sj/xzqh/2019/201901-06/201906211048.html) 进行分类，如广东省为 440000

|City|CIDR|
|---|---|
|北京市|https://raw.githubusercontent.com/metowolf/iplist/master/data/cncity/110000.txt|
|浙江省|https://raw.githubusercontent.com/metowolf/iplist/master/data/cncity/330000.txt|
|广东省|https://raw.githubusercontent.com/metowolf/iplist/master/data/cncity/440000.txt|
||[ > 查看更多](https://github.com/metowolf/iplist/tree/master/docs/cncity.md)|

### 市级 IP 段

采用 [行政区划代码](http://www.mca.gov.cn/article/sj/xzqh/2019/201901-06/20190203221738.html) 进行分类，如广东省为 440000，广州市为 440100

|City|CIDR|
|---|---|
|广东省广州市|https://raw.githubusercontent.com/metowolf/iplist/master/data/cncity/440100.txt|
|广东省深圳市|https://raw.githubusercontent.com/metowolf/iplist/master/data/cncity/440300.txt|
|广东省佛山市|https://raw.githubusercontent.com/metowolf/iplist/master/data/cncity/440600.txt|
||[ > 查看更多](https://github.com/metowolf/iplist/tree/master/docs/cncity.md)|


## 数据来源

|采信源|地址|
|---|---|
|OpenIPDB|https://openipdb.org/|


## 致谢

 - **特别感谢 [OpenIPDB.ipdb](https://www.npmjs.com/package/openipdb.ipdb) 项目，本列表直接采集于该数据库**
 - **特别感谢 [IPinfo](https://ipinfo.io) 提供的免费 ASN 数据用于修正**
 - 感谢 [IPIP.net](https://www.ipip.net/) 设计的 ipdb 数据库格式
 - 感谢 ipdb 项目提供 ipdb 数据库格式的读取工具
 - 感谢 @ipdb/range 项目提供 ipdb 数据库格式的分段工具
 - 感谢 [fast-cidr-tools](https://github.com/SukkaW/fast-cidr-tools) 项目提供高效、可靠的 CIDR 合并工具
 - 感谢专注于 IP 数据库收集整理工作的公司和热心网友们


## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fmetowolf%2Fiplist.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fmetowolf%2Fiplist?ref=badge_large)
