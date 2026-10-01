import { describe, expect, it } from 'vitest'
import { encodedWriteBytes, inspectTransaction } from '../src/lib/genlayer'

const tx = (receipt: object) => ({ consensus_data: { leader_receipt: [{ mode: 'validator', execution_result: 'SUCCESS' }, receipt] } })

describe('leader receipt gate', () => {
  it('accepts only leader SUCCESS', () => {
    expect(inspectTransaction(tx({ mode: 'leader', execution_result: 'SUCCESS', result: 'ok' })))
      .toEqual({ state: 'success', value: 'ok' })
  })

  it('turns leader ERROR into failure', () => {
    expect(inspectTransaction(tx({ mode: 'leader', execution_result: 'ERROR', error: '[rollback] boom' })).state).toBe('error')
  })

  it('does not treat a missing execution result as success', () => {
    expect(inspectTransaction(tx({ mode: 'leader', execution_result: null }))).toEqual({ state: 'pending' })
  })

  it('ignores validator success when the leader receipt is absent', () => {
    expect(inspectTransaction({ consensus_data: { leader_receipt: [{ mode: 'validator', execution_result: 'SUCCESS' }] } })).toEqual({ state: 'pending' })
  })
})

describe('encoded calldata meter', () => {
  it('measures full serialized calldata, not string length', () => {
    const bytes = encodedWriteBytes('amend_rate', ['Ledger A', 120, 'future entries only'])
    expect(bytes).toBeGreaterThan('future entries only'.length)
  })
})

