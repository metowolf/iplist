'use strict'

/**
 * Merge IPv4 and IPv6 CIDRs into their minimal exact union.
 *
 * IPv4 fast path:
 *   - hand-written charCode parser (no split / BigInt)
 *   - each CIDR packed into one double: start * 64 + hostBits  (< 2^38, exact)
 *   - native Float64Array numeric sort (sorts by start, then by size)
 *   - single linear sweep merging overlapping / adjacent ranges
 *   - greedy range -> minimal CIDR decomposition via Math.clz32
 *
 * IPv6 path uses BigInt (rare in this project) with the same algorithm.
 *
 * With `sort = true`, both families are sorted by numeric start (IPv4 first on ties).
 * With `sort = false`, results are IPv4 (ascending) followed by IPv6 (ascending).
 */

const TWO_32 = 4294967296
const POW2 = new Float64Array(33)
for (let i = 0; i <= 32; i++) POW2[i] = 2 ** i

const invalid = (cidr) => new TypeError(`Invalid IP address: ${cidr}`)

/** Not a valid IPv4 CIDR: hand over to the IPv6 parser if it may be one, else throw. */
function bad (s) {
  if (s.indexOf(':') !== -1) return -1
  throw invalid(s)
}

/**
 * Parse an IPv4 CIDR into packed key (start * 64 + hostBits).
 * Returns -1 if the string looks like IPv6 (contains ':').
 */
function parseV4Packed (s) {
  const len = s.length
  let ip = 0
  let octet = 0
  let digits = 0
  let dots = 0
  let i = 0
  for (; i < len; i++) {
    const c = s.charCodeAt(i)
    if (c >= 48 && c <= 57) {
      octet = octet * 10 + (c - 48)
      if (++digits > 3) return bad(s)
    } else if (c === 46) { // '.'
      if (digits === 0 || octet > 255 || ++dots > 3) return bad(s)
      ip = ip * 256 + octet
      octet = 0
      digits = 0
    } else if (c === 47) { // '/'
      break
    } else if (c === 58) { // ':'
      return -1
    } else {
      return bad(s)
    }
  }
  if (digits === 0 || octet > 255 || dots !== 3) return bad(s)
  ip = ip * 256 + octet

  let prefix = 32
  if (i < len) {
    // after '/'
    i++
    if (i === len || len - i > 2) return bad(s)
    prefix = 0
    for (; i < len; i++) {
      const c = s.charCodeAt(i)
      if (c < 48 || c > 57) return bad(s)
      prefix = prefix * 10 + (c - 48)
    }
    if (prefix > 32) return bad(s)
  }
  const hb = 32 - prefix
  const start = ip - (ip % POW2[hb])
  return start * 64 + hb
}

function v4ToString (s, prefix) {
  return ((s >>> 24) + '.' + ((s >>> 16) & 255) + '.' + ((s >>> 8) & 255) + '.' + (s & 255) + '/' + prefix)
}

/** Decompose [s, e] (inclusive, IPv4 numbers) into minimal CIDRs. */
function emitV4 (s, e, out, starts) {
  while (s <= e) {
    const n = e - s + 1
    const hbLen = n >= TWO_32 ? 32 : 31 - Math.clz32(n)
    const hbAlign = s === 0 ? 32 : 31 - Math.clz32((s & -s) >>> 0)
    const hb = hbLen < hbAlign ? hbLen : hbAlign
    out.push(v4ToString(s, 32 - hb))
    if (starts !== null) starts.push(s)
    s += POW2[hb]
  }
}

function mergeV4 (keys, count, out, starts) {
  if (count === 0) return
  const sorted = count === keys.length ? keys : keys.subarray(0, count)
  sorted.sort()

  let k = sorted[0]
  let hb = k % 64
  let curS = (k - hb) / 64
  let curE = curS + POW2[hb] - 1

  for (let i = 1; i < count; i++) {
    k = sorted[i]
    hb = k % 64
    const s = (k - hb) / 64
    if (s > curE + 1) {
      emitV4(curS, curE, out, starts)
      curS = s
      curE = s + POW2[hb] - 1
    } else {
      const e = s + POW2[hb] - 1
      if (e > curE) curE = e
    }
  }
  emitV4(curS, curE, out, starts)
}

/* ----------------------------- IPv6 ----------------------------- */

function parseV6 (cidr) {
  const slash = cidr.indexOf('/')
  let ip = slash === -1 ? cidr : cidr.slice(0, slash)
  let prefix = 128
  if (slash !== -1) {
    const p = cidr.slice(slash + 1)
    if (!/^\d{1,3}$/.test(p)) throw invalid(cidr)
    prefix = +p
    if (prefix > 128) throw invalid(cidr)
  }
  const pct = ip.indexOf('%')
  if (pct !== -1) {
    if (pct === ip.length - 1) throw invalid(cidr)
    ip = ip.slice(0, pct)
  }

  // embedded IPv4 tail
  let tail = []
  const lastColon = ip.lastIndexOf(':')
  if (ip.indexOf('.', lastColon) !== -1) {
    const v4 = ip.slice(lastColon + 1).split('.')
    if (v4.length !== 4) throw invalid(cidr)
    const o = v4.map((x) => {
      if (!/^\d{1,3}$/.test(x) || +x > 255) throw invalid(cidr)
      return +x
    })
    tail = [(o[0] << 8 | o[1]).toString(16), (o[2] << 8 | o[3]).toString(16)]
    // keep a trailing '::' intact (e.g. '::1.2.3.4' -> '::'), otherwise drop the separator
    ip = ip[lastColon - 1] === ':' ? ip.slice(0, lastColon + 1) : ip.slice(0, lastColon)
  }

  let groups
  const dbl = ip.indexOf('::')
  if (dbl !== -1) {
    if (ip.indexOf('::', dbl + 1) !== -1) throw invalid(cidr)
    const head = ip.slice(0, dbl) === '' ? [] : ip.slice(0, dbl).split(':')
    const rest = ip.slice(dbl + 2)
    const back = (rest === '' ? [] : rest.split(':')).concat(tail)
    const fill = 8 - head.length - back.length
    if (fill < 1) throw invalid(cidr)
    groups = head.concat(new Array(fill).fill('0'), back)
  } else {
    groups = (ip === '' ? [] : ip.split(':')).concat(tail)
    if (groups.length !== 8) throw invalid(cidr)
  }

  let hex = ''
  for (let i = 0; i < 8; i++) {
    const g = groups[i]
    if (!/^[0-9a-fA-F]{1,4}$/.test(g)) throw invalid(cidr)
    hex += g.padStart(4, '0')
  }
  const value = BigInt('0x' + hex)
  const hb = BigInt(128 - prefix)
  const start = (value >> hb) << hb
  return [start, start + (1n << hb) - 1n]
}

function v6ToString (n, prefix) {
  const parts = new Array(8)
  for (let i = 7; i >= 0; i--) {
    parts[i] = Number(n & 0xFFFFn)
    n >>= 16n
  }
  // Compress the first longest run of zero groups (length >= 1).
  let bestStart = -1
  let bestLen = 0
  for (let i = 0; i < 8;) {
    if (parts[i] === 0) {
      let j = i
      while (j < 8 && parts[j] === 0) j++
      if (j - i > bestLen) { bestStart = i; bestLen = j - i }
      i = j
    } else {
      i++
    }
  }
  const hex = parts.map((p) => p.toString(16))
  let str
  if (bestStart === -1) {
    str = hex.join(':')
  } else {
    str = hex.slice(0, bestStart).join(':') + '::' + hex.slice(bestStart + bestLen).join(':')
  }
  return str + '/' + prefix
}

function bitLength (n) {
  return n === 0n ? 0 : n.toString(2).length
}

function emitV6 (s, e, out, starts) {
  while (s <= e) {
    const n = e - s + 1n
    const hbLen = bitLength(n) - 1
    const hbAlign = s === 0n ? 128 : bitLength(s & -s) - 1
    const hb = hbLen < hbAlign ? hbLen : hbAlign
    out.push(v6ToString(s, 128 - hb))
    starts.push(s)
    s += 1n << BigInt(hb)
  }
}

function mergeV6 (ranges, out, starts) {
  if (ranges.length === 0) return
  ranges.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
  let [curS, curE] = ranges[0]
  for (let i = 1; i < ranges.length; i++) {
    const [s, e] = ranges[i]
    if (s > curE + 1n) {
      emitV6(curS, curE, out, starts)
      curS = s
      curE = e
    } else if (e > curE) {
      curE = e
    }
  }
  emitV6(curS, curE, out, starts)
}

/* ----------------------------- API ----------------------------- */

/**
 * Merge CIDRs into the minimal set of non-overlapping CIDRs.
 * @param {string[]} cidrs
 * @param {boolean} [sort=false]
 * @returns {string[]}
 */
function merge (cidrs, sort = false) {
  const len = cidrs.length
  const keys = new Float64Array(len)
  let count = 0
  let v6 = null

  for (let i = 0; i < len; i++) {
    const c = cidrs[i]
    const k = parseV4Packed(c)
    if (k === -1) {
      if (v6 === null) v6 = []
      v6.push(parseV6(c))
    } else {
      keys[count++] = k
    }
  }

  const out4 = []
  if (v6 === null) {
    mergeV4(keys, count, out4, null)
    return out4
  }

  const starts4 = []
  const out6 = []
  const starts6 = []
  mergeV4(keys, count, out4, starts4)
  mergeV6(v6, out6, starts6)

  if (!sort || out4.length === 0 || out6.length === 0) return out4.concat(out6)

  // Sort both families by numeric start, with IPv4 first on ties.
  const res = new Array(out4.length + out6.length)
  let a = 0
  let b = 0
  let r = 0
  while (a < out4.length && b < out6.length) {
    if (starts6[b] < starts4[a]) res[r++] = out6[b++]
    else res[r++] = out4[a++]
  }
  while (a < out4.length) res[r++] = out4[a++]
  while (b < out6.length) res[r++] = out6[b++]
  return res
}

module.exports = { merge }
