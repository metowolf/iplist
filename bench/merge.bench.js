'use strict'

const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const { parseArgs } = require('node:util')

const { values } = parseArgs({ options: {
  baseline: { type: 'string' },
  candidate: { type: 'string' },
  extended: { type: 'boolean', default: false },
  json: { type: 'string' },
  filter: { type: 'string' }
} })
const baseline = values.baseline ? require(path.resolve(values.baseline)).merge : null
const { merge } = require(values.candidate ? path.resolve(values.candidate) : '../src/lib/cidr')

const DATA = path.join(__dirname, '..', 'data')
const readLines = (file) => fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean)

function loadCases () {
  const country = fs.readdirSync(path.join(DATA, 'country')).filter((f) => f.endsWith('.txt'))
  const nonChina = []
  for (const f of country) if (f !== 'CN.txt') nonChina.push(...readLines(path.join(DATA, 'country', f)))

  const files = fs.readdirSync(DATA, { recursive: true }).filter((f) => f.endsWith('.txt')).map((f) => path.join(DATA, f))
  const everything = files.flatMap(readLines)

  const cncity = fs.readdirSync(path.join(DATA, 'cncity')).map((f) => readLines(path.join(DATA, 'cncity', f)))

  const cases = [
    { name: 'CN.txt', inputs: [readLines(path.join(DATA, 'country', 'CN.txt'))] },
    { name: 'non-china (all countries except CN)', inputs: [nonChina] },
    { name: `cncity/*.txt (${cncity.length} files)`, inputs: cncity },
    { name: `every data/**/*.txt separately (${files.length} files)`, inputs: files.map(readLines) },
    { name: 'all data/**/*.txt concatenated', inputs: [everything] }
  ]
  if (values.extended) {
    const ascending = merge(everything, true)
    const shuffled = ascending.slice()
    let seed = 42
    for (let i = shuffled.length - 1; i > 0; i--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      const j = seed % (i + 1)
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    const v6 = Array.from({ length: 10000 }, (_, i) => `2001:db8:${i.toString(16)}::1/128`)
    const v6Networks = Array.from({ length: 10000 }, (_, i) => `2001:db8:${i.toString(16)}::/64`)
    cases.push(
      { name: 'IPv4 ascending', inputs: [ascending] },
      { name: 'IPv4 descending', inputs: [ascending.slice().reverse()] },
      { name: 'IPv4 shuffled (seed 42)', inputs: [shuffled] },
      { name: 'IPv6 synthetic 10000 /128', inputs: [v6] },
      { name: 'IPv6 synthetic 10000 /128 sort=false', inputs: [v6], sort: false },
      { name: 'IPv6 synthetic 10000 /64', inputs: [v6Networks] },
      { name: 'mixed synthetic sort=false', inputs: [ascending.slice(0, 10000).concat(v6)], sort: false }
    )
  }
  return cases.filter((c) => !values.filter || c.name.includes(values.filter))
}

function bench (fn, inputs, sort, minMs) {
  let iters = 0
  const t0 = process.hrtime.bigint()
  let elapsed = 0
  while (elapsed < minMs || iters < 5) {
    for (const input of inputs) fn(input, sort)
    iters++
    elapsed = Number(process.hrtime.bigint() - t0) / 1e6
  }
  return elapsed / iters
}

const fmt = (ms) => (ms < 1 ? `${(ms * 1000).toFixed(1)} µs` : `${ms.toFixed(2)} ms`)
const median = (samples) => samples.slice().sort((a, b) => a - b)[Math.floor(samples.length / 2)]

console.log(`node ${process.version}\n`)
const rows = []
const results = []
for (const c of loadCases()) {
  const size = c.inputs.reduce((n, a) => n + a.length, 0)
  const sort = c.sort !== false
  for (const input of c.inputs) {
    if (baseline) assert.deepEqual(merge(input, sort), baseline(input, sort), c.name)
  }
  const before = []
  const after = []
  for (let i = 0; i < 3; i++) {
    for (const input of c.inputs) {
      if (baseline) baseline(input, sort)
      merge(input, sort)
    }
  }
  // Alternate execution order to reduce drift; report the median of five batches.
  for (let round = 0; round < (baseline ? 5 : 1); round++) {
    const runBefore = () => before.push(bench(baseline, c.inputs, sort, 300))
    const runAfter = () => after.push(bench(merge, c.inputs, sort, baseline ? 300 : 1500))
    if (baseline && round % 2 === 0) runBefore()
    runAfter()
    if (baseline && round % 2 !== 0) runBefore()
  }
  const b = median(after)
  results.push({ name: c.name, size, sort, before, after, beforeMs: baseline ? median(before) : null, afterMs: b })
  rows.push({
    case: c.name,
    'input CIDRs': size,
    ...(baseline ? { baseline: fmt(median(before)), speedup: `${(median(before) / b).toFixed(2)}x` } : {}),
    'src/lib/cidr': fmt(b),
    'CIDRs / second': Math.round(size / (b / 1000)).toLocaleString('en-US')
  })
}
console.table(rows)
if (values.json) fs.writeFileSync(values.json, JSON.stringify({ node: process.version, results }, null, 2) + '\n')
