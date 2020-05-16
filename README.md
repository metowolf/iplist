<p align="center">
<a href="https://github.com/metowolf/iplist">
<img src="https://user-images.githubusercontent.com/2666735/50806883-84930c00-1333-11e9-869e-3c2f2664f154.png" />
</a>
</p>

<h1 align="center">IP 地址库</h1>

<p align="center">数据基于纯真数据库分类，更新日期 20200515.</p>

<p align=center>
<a href="https://i-meto.com/">Author Website</a> ·
<a href="https://github.com/metowolf/iplist">Project Source</a> ·
<a href="https://twitter.com/metowolf">Twitter</a>
</p>

***

## 分类

### 国家 IP 段

采用 [ISO_3166-1](https://zh.wikipedia.org/wiki/ISO_3166-1%E4%BA%8C%E4%BD%8D%E5%AD%97%E6%AF%8D%E4%BB%A3%E7%A0%81) 进行分类

|Country|CIDR|
|---|---|
|中国 (CN)|https://raw.githubusercontent.com/metowolf/iplist/master/data/country/CN.txt|
|中国香港|https://raw.githubusercontent.com/metowolf/iplist/master/data/country/HK.txt|
|美国|https://raw.githubusercontent.com/metowolf/iplist/master/data/country/US.txt|
|日本|https://raw.githubusercontent.com/metowolf/iplist/master/data/country/JP.txt|
||[ > 查看更多](https://github.com/metowolf/iplist/tree/master/docs/country.md)|

### 大陆 IP 段

相比较国家 IP 段，数据经过精简合并

|Country|CIDR|
|---|---|
|中国 (CN)|https://raw.githubusercontent.com/metowolf/iplist/master/data/special/china.txt|

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

|采信源|文件|版本|
|---|---|---|
|纯真数据库|[qqwry.ipdb.tgz](https://registry.npmjs.org/qqwry.ipdb/-/qqwry.ipdb-2020.5.15.tgz)|20200515|


## 数据准确性

由于数据并非直接采集于纯真原始数据库，而是经过 [qqwry.ipdb](https://github.com/metowolf/qqwry.ipdb) 二次标准化后进行分类，所以数据难免会出现遗漏。
如果您发现数据中存在错误的地方，以下是可供反馈的途径：

 1. 直接向本项目 [发起 issue](https://github.com/metowolf/iplist/issues/new)，按照规范注明需要修改的 IP 范围、正确信息，如有信息来源建议一并填写，我会代为排查并向上游反馈。
 2. 如果发现是 [qqwry.ipdb](https://github.com/metowolf/qqwry.ipdb) 不幸错误格式化了原始信息，请前往 [qqwry.ipdb issue](https://github.com/metowolf/qqwry.ipdb/issues/new) 进行反馈。
 3. 如果发现是纯真数据库的数据错误，可以通过 [IP 小秘书](http://www.cz88.net/ip/) 或者 [前往纯真论坛](http://bbs.cz88.net/f26)，按照格式要求进行发帖反馈。


## 致谢

 - **特别感谢 [纯真](http://cz88.net/) 的离线数据库，本列表数据均来源于纯真**
 - **特别感谢 [qqwry.ipdb](https://github.com/metowolf/qqwry.ipdb) 标准化项目，本列表直接采集于该数据库**
 - 感谢 [IPIP.net](https://www.ipip.net/) 设计的 ipdb 数据库格式
 - 感谢 ipdb 项目提供 ipdb 数据库格式的读取工具
 - 感谢 @ipdb/range 项目提供 ipdb 数据库格式的分段工具
 - 感谢 @ipdb/cac 项目提供中国行政区划分类工具
 - 感谢 @ipdb/iso3166 项目提供国家、地区标准代码分类工具
 - 感谢 [cidr-tools](https://github.com/silverwind/cidr-tools) 项目提供可靠的 CIDR 合并工具
 - 感谢专注于 IP 数据库收集整理工作的公司和热心网友们
