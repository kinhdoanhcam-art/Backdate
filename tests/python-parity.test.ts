import { describe, expect, it } from 'vitest'
import { ledgerIdFor, pyLen, pyNormalize, pyStrip } from '../src/lib/python'

const whitespaceCases = [
  '\talpha\n', '\u001calpha\u001d', '\u001ealpha\u001f', '\u0085alpha\u0085',
  '\u00a0alpha\u00a0', '\u1680alpha\u1680', '\u2000alpha\u200a', '\u2028alpha\u2029',
  '\u202falpha\u205f', '\u3000alpha\u3000', '  alpha  ', '\ralpha\v',
]

describe('Python text parity', () => {
  it.each(whitespaceCases)('pyStrip matches Python for %j', (value) => {
    expect(pyStrip(value)).toBe('alpha')
  })

  it('normalizes all Python whitespace, including JS mismatches', () => {
    expect(pyNormalize('  one\u001ctwo\u0085three\u3000four  ')).toBe('one two three four')
  })

  it('counts Unicode code points rather than UTF-16 units', () => {
    expect(pyLen('Rate📒 Book')).toBe(10)
  })

  it('matches the live Ledger A ID', () => {
    expect(ledgerIdFor('0x3065E31B1D993d7C0D59E6786844cBa56780B2d3', 'Ledger A'))
      .toBe('0d3c481fb8b7c3f06d475737a9d0f7a2dcced8e3142d1d6933c671a2e6aa2263')
  })

  it('normalizes U+0085 before hashing', () => {
    expect(ledgerIdFor('0x3065E31B1D993d7C0D59E6786844cBa56780B2d3', '  Ledger\u0085C  '))
      .toBe('cb692d732b20fb6302b343ed4e5c8b6fb4b31f7f602ef61f7135e3ef9b198f07')
  })
})
