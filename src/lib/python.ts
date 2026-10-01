import { keccak256, stringToHex } from 'viem'

// Python 3 str.isspace() characters. JavaScript's \s differs at U+001C–U+001F
// and U+0085, so generic trim/split/regex is deliberately not used here.
const PYTHON_WHITESPACE = new Set([
  '\u0009', '\u000a', '\u000b', '\u000c', '\u000d',
  '\u001c', '\u001d', '\u001e', '\u001f', '\u0020', '\u0085',
  '\u00a0', '\u1680', '\u2000', '\u2001', '\u2002', '\u2003',
  '\u2004', '\u2005', '\u2006', '\u2007', '\u2008', '\u2009',
  '\u200a', '\u2028', '\u2029', '\u202f', '\u205f', '\u3000',
])

export function pyLen(value: string): number {
  return Array.from(value).length
}

export function pyStrip(value: string): string {
  const points = Array.from(value)
  let start = 0
  let end = points.length
  while (start < end && PYTHON_WHITESPACE.has(points[start])) start += 1
  while (end > start && PYTHON_WHITESPACE.has(points[end - 1])) end -= 1
  return points.slice(start, end).join('')
}

export function pyNormalize(value: string): string {
  const words: string[] = []
  let word = ''
  for (const point of Array.from(value)) {
    if (PYTHON_WHITESPACE.has(point)) {
      if (word) words.push(word)
      word = ''
    } else {
      word += point
    }
  }
  if (word) words.push(word)
  return words.join(' ')
}

export function ledgerIdFor(author: string, title: string): string {
  const normalized = pyNormalize(title)
  const payload = `REACH_BACK:LEDGER:V1|${author.toLowerCase()}|${pyLen(normalized)}|${normalized}`
  return keccak256(stringToHex(payload)).slice(2)
}

export function isWallet(value: string): boolean {
  const wallet = pyStrip(value).toLowerCase()
  return /^0x[0-9a-f]{40}$/.test(wallet) && wallet !== `0x${'0'.repeat(40)}`
}

