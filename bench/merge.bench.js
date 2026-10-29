'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { merge } = require('../src/lib/cidr')

const DATA = path.join(__dirname, '..', 'data')
const readLines = (file) => fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean)

function loadCases () {
  const country = fs.readdirSync(path.join(DATA, 'country')).filter((f) => f.endsWith('.txt'))
  const nonChina = []
  for (const f of country) if (f !== 'CN.txt') nonChina.push(...readLines(path.join(DATA, 'country', f)))

  const files = fs.readdirSync(DATA, { recursive: true }).filter((f) => f.endsWith('.txt')).map((f) => path.join(DATA, f))
  const everything = files.flatMap(readLines)

  const cncity = fs.readdirSync(path.join(DATA, 'cncity')).map((f) => readLines(path.join(DATA, 'cncity', f)))

  return [
    { name: 'CN.txt', inputs: [readLines(path.join(DATA, 'country', 'CN.txt'))] },
    { name: 'non-china (all countries except CN)', inputs: [nonChina] },
    { name: `cncity/*.txt (${cncity.length} files)`, inputs: cncity },
    { name: `every data/**/*.txt separately (${files.length} files)`, inputs: files.map(readLines) },
    { name: 'all data/**/*.txt concatenated', inputs: [everything] }
  ]
}

function bench (fn, inputs, minMs = 1500) {
  for (let i = 0; i < 3; i++) for (const input of inputs) fn(input, true) // warm-up
  let iters = 0
  const t0 = process.hrtime.bigint()
  let elapsed = 0
  while (elapsed < minMs || iters < 5) {
    for (const input of inputs) fn(input, true)
    iters++
    elapsed = Number(process.hrtime.bigint() - t0) / 1e6
  }
  return elapsed / iters
}

const fmt = (ms) => (ms < 1 ? `${(ms * 1000).toFixed(1)} µs` : `${ms.toFixed(2)} ms`)

console.log(`node ${process.version}\n`)
const rows = []
for (const c of loadCases()) {
  const size = c.inputs.reduce((n, a) => n + a.length, 0)
  const b = bench(merge, c.inputs)
  rows.push({
    case: c.name,
    'input CIDRs': size,
    'src/lib/cidr': fmt(b),
    'CIDRs / second': Math.round(size / (b / 1000)).toLocaleString('en-US')
  })
}
console.table(rows)
