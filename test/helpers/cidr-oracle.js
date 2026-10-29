'use strict'

// Independent test oracle: normalize with BigInt, remove contained networks,
// then collapse sibling CIDRs on a stack instead of merging address intervals.
function parse (cidr) {
  const [raw, mask] = cidr.split('/')
  const ip = raw.split('%')[0]
  const family = ip.includes(':') ? 6 : 4
  const bits = family === 4 ? 32 : 128
  let value
  if (family === 4) {
    value = ip.split('.').reduce((n, octet) => n * 256n + BigInt(octet), 0n)
  } else {
    const hex = ip.replace(/\d+\.\d+\.\d+\.\d+$/, (v4) => {
      const n = v4.split('.').reduce((n, octet) => n * 256n + BigInt(octet), 0n)
      return (n >> 16n).toString(16) + ':' + (n & 65535n).toString(16)
    })
    const sides = hex.split('::')
    let groups
    if (sides.length === 1) groups = hex.split(':')
    else {
      const left = sides[0] ? sides[0].split(':') : []
      const right = sides[1] ? sides[1].split(':') : []
      groups = [...left, ...Array(8 - left.length - right.length).fill('0'), ...right]
    }
    value = groups.reduce((n, group) => n * 65536n + BigInt('0x' + group), 0n)
  }
  const prefix = mask === undefined ? bits : Number(mask)
  const size = 2n ** BigInt(bits - prefix)
  return { family, start: value / size * size, size, prefix }
}

const key = (net) => `${net.family}:${net.start}:${net.prefix}`
const byStart = (a, b) => a.start < b.start ? -1 : a.start > b.start ? 1 : 0

function expectedUnion (cidrs, sort = true) {
  const nets = cidrs.map(parse).sort((a, b) =>
    a.family - b.family || byStart(a, b) || a.prefix - b.prefix)
  const stack = []
  for (let net of nets) {
    let prev = stack[stack.length - 1]
    if (prev && prev.family === net.family && net.start < prev.start + prev.size) continue
    while (prev && prev.family === net.family && prev.size === net.size &&
      prev.start + prev.size === net.start && prev.start % (2n * net.size) === 0n) {
      stack.pop()
      net = { family: net.family, start: prev.start, size: net.size * 2n, prefix: net.prefix - 1 }
      prev = stack[stack.length - 1]
    }
    stack.push(net)
  }
  if (sort) stack.sort((a, b) => byStart(a, b) || a.family - b.family)
  return stack.map(key)
}

module.exports = { expectedUnion, networkKey: (cidr) => key(parse(cidr)) }
