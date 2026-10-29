'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { expectedUnion, networkKey } = require('./helpers/cidr-oracle')
const { merge } = require('../src/lib/cidr')

const DATA = path.join(__dirname, '..', 'data')

const readLines = (file) => fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean)
const allFiles = () => fs.readdirSync(DATA, { recursive: true })
  .filter((f) => f.endsWith('.txt'))
  .map((f) => path.join(DATA, f))

// deterministic PRNG (mulberry32)
function rng (seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randV4 (r, minPrefix = 0) {
  const ip = Math.floor(r() * 4294967296)
  const prefix = minPrefix + Math.floor(r() * (33 - minPrefix))
  const withMask = r() < 0.9
  const s = `${ip >>> 24}.${(ip >>> 16) & 255}.${(ip >>> 8) & 255}.${ip & 255}`
  return withMask ? `${s}/${prefix}` : s
}

function randV6 (r) {
  const groups = []
  // bias towards a small shared prefix so ranges actually overlap / touch
  for (let i = 0; i < 8; i++) {
    groups.push(i < 2 ? (r() < 0.5 ? '2001' : 'db8') : (r() < 0.4 ? '0' : Math.floor(r() * 65536).toString(16)))
  }
  const prefix = 16 + Math.floor(r() * 113)
  return `${groups.join(':')}/${prefix}`
}

const check = (input, sort = true) => {
  const result = merge(input, sort)
  assert.deepEqual(result.map(networkKey), expectedUnion(input, sort))
  assert.deepEqual(merge(result, sort), result)
}

test('real data: every data/**/*.txt file', () => {
  const files = allFiles()
  for (const f of files) check(readLines(f))
  assert.ok(files.length > 1000)
})

test('real data: china (CN + whitelist) and non-china aggregates', () => {
  const countries = fs.readdirSync(path.join(DATA, 'country')).filter((f) => f.endsWith('.txt'))
  let all = []
  for (const f of countries) {
    if (f !== 'CN.txt') all = all.concat(readLines(path.join(DATA, 'country', f)))
  }
  check(all)
  check([...readLines(path.join(DATA, 'country', 'CN.txt')), '1.8.0.0/16', '61.128.0.0/10', '202.96.0.0/12'])
  // whole dataset in one go (heavy overlap between country / city / isp)
  check(allFiles().flatMap(readLines))
})

test('edge cases IPv4', () => {
  check(['0.0.0.0/0'])
  check(['0.0.0.0/1', '128.0.0.0/1'])
  check(['255.255.255.255'])
  check(['255.255.255.254/31', '0.0.0.0/32'])
  check(['1.2.3.4/24', '1.2.3.0/24', '1.2.2.0/24'])
  check(['10.0.0.1/8', '1.2.3.4', '1.2.3.5'])
  check(['1.0.0.0/32', '1.0.0.2/32', '1.0.0.1/32', '1.0.0.3/32'])
  check(['0.0.0.1', '0.0.0.2', '0.0.0.3', '255.255.255.0/25'])
  check([])
})

test('IPv4 bit masks cover every prefix and unsigned boundary', () => {
  for (let prefix = 0; prefix <= 32; prefix++) {
    for (const ip of ['0.0.0.0', '0.0.0.1', '127.255.255.255', '128.0.0.0', '255.255.255.255']) {
      check([`${ip}/${prefix}`])
    }
  }
})

test('IPv4 ordering detection uses normalized packed keys across IPv6 entries', () => {
  const inputs = [
    ['10.0.0.255/24', '10.0.0.1/32', '10.0.0.1/32', '10.0.2.0/24'],
    ['10.0.0.1/32', '10.0.0.255/24', '10.0.2.0/24'],
    ['255.255.255.255', '128.0.0.0/1', '0.0.0.0/1'],
    ['0.0.0.1', '::1', '0.0.0.2', '::2'],
    ['0.0.0.2', '::1', '0.0.0.1', '::2']
  ]
  for (const input of inputs) {
    check(input, true)
    check(input, false)
  }
})

test('edge cases IPv6 and mixed', () => {
  check(['::/0'])
  check(['::1', '::'])
  check(['2001:db8::/33', '2001:db8:8000::/33'])
  check(['::ffff:1.2.3.4/128', '1.2.3.4', '::1'])
  check(['fe80::1%eth0/128', 'fe80::2/127'])
  check(['ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:fffe/127'])
  check(['2001:0:0:1::/64', '1:0:0:0:0:0:0:1', '1:0:0:1:0:0:0:1', '0:0:1::/48'])
  check(['0.0.0.0/0', '::/0'])
  check(['0.0.0.1', '::1', '::2/127', '0.0.0.2/31'])
})

test('canonical strings and ordering', () => {
  assert.deepEqual(merge(['10.0.0.1/8', '10.0.0.0/16']), ['10.0.0.0/8'])
  assert.deepEqual(merge(['0.0.0.0/1', '128.0.0.0/1']), ['0.0.0.0/0'])
  assert.deepEqual(merge(['::/1', '8000::/1']), ['::/0'])
  assert.deepEqual(merge(['::ffff:1.2.3.4']), ['::ffff:102:304/128'])
  assert.deepEqual(merge(['fe80::1%eth0/64']), ['fe80::/64'])
  assert.deepEqual(merge(['2001:0:0:1:0:0:1:1']), ['2001::1:0:0:1:1/128'])
  const input = ['0.0.0.2', '::1', '0.0.0.1', '::2']
  assert.deepEqual(merge(input, true), ['0.0.0.1/32', '::1/128', '0.0.0.2/32', '::2/128'])
  assert.deepEqual(merge(input, false), ['0.0.0.1/32', '0.0.0.2/32', '::1/128', '::2/128'])
})

test('random fuzz IPv4 (sorted output)', () => {
  const r = rng(42)
  for (let round = 0; round < 300; round++) {
    const n = 1 + Math.floor(r() * 400)
    const minPrefix = round % 3 === 0 ? 0 : 12
    const input = Array.from({ length: n }, () => randV4(r, minPrefix))
    check(input)
  }
})

test('random fuzz dense IPv4 small space', () => {
  const r = rng(7)
  for (let round = 0; round < 300; round++) {
    const n = 1 + Math.floor(r() * 200)
    const input = Array.from({ length: n }, () => {
      const ip = Math.floor(r() * 4096)
      const prefix = 20 + Math.floor(r() * 13)
      return `10.0.${ip >>> 8}.${ip & 255}/${prefix}`
    })
    check(input)
  }
})

test('random fuzz mixed IPv4 / IPv6', () => {
  const r = rng(1337)
  for (let round = 0; round < 200; round++) {
    const n = 1 + Math.floor(r() * 150)
    const input = Array.from({ length: n }, () => (r() < 0.5 ? randV6(r) : randV4(r, 8)))
    check(input)
  }
})

test('unsorted mode returns the same set', () => {
  const r = rng(99)
  for (let round = 0; round < 50; round++) {
    const input = Array.from({ length: 200 }, () => (r() < 0.2 ? randV6(r) : randV4(r, 8)))
    check(input, false)
  }
})

test('invalid input throws', () => {
  for (const bad of ['', 'abc', '1.2.3', '1.2.3.4/33', '256.0.0.0/8', '1.2.3.4/', '::/129', '1:2:3', 'fe80::1%', 'fe80::1%/128']) {
    assert.throws(() => merge([bad]), TypeError, bad)
  }
})
