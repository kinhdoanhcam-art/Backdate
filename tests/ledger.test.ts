import { describe, expect, it } from 'vitest'
import { amendmentPreview } from '../src/lib/ledger'

describe('amendment preview', () => {
  it('shows the two totals without asking the contract to preview', () => {
    const entries = [1, 2].map((index) => ({
      ledger_id: 'x', index, quantity: 10, amount: 1000, amount_at_base: 1000, uses_new_rate: false,
    }))
    expect(amendmentPreview(entries, 120n)).toEqual({ current: 2000n, retroactive: 2400n })
  })

  it('preserves bigint precision', () => {
    const entries = [{ ledger_id: 'x', index: 1, quantity: '1000000', amount: '1000000000000000000', amount_at_base: '1000000000000000000', uses_new_rate: false }]
    expect(amendmentPreview(entries, 1_000_000_000_000n).retroactive).toBe(1_000_000_000_000_000_000n)
  })
})

