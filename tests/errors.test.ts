import { describe, expect, it } from 'vitest'
import { CONTRACT_MESSAGES, normalizeError } from '../src/lib/errors'

describe('recursive rollback extraction', () => {
  it.each(CONTRACT_MESSAGES)('extracts exact contract message: %s', (message) => {
    const error = { cause: { data: { originalError: { message: `[rollback] UserError('${message}')` } } } }
    expect(normalizeError(error)).toBe(message)
  })

  it('handles wallet rejection', () => {
    expect(normalizeError({ cause: { code: 4001, message: 'rejected' } })).toBe('The wallet request was rejected.')
  })
})

