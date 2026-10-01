const CONTRACT_MESSAGES = [
  'Invalid wallet address',
  'The other side cannot be the author',
  'Label is empty',
  'Label is too long',
  'Title is empty',
  'Title is too long',
  'Text is empty',
  'Text is too long',
  'Note is empty',
  'Note is too long',
  'Text or label contains a reserved token',
  'The rate is out of range',
  'This ledger already exists',
  'No ledger with this title',
  'The quantity is out of range',
  'The ledger is full',
  'This ledger has already been amended',
  'Only the named other side may object',
  'There is no amendment to object to',
  'An objection has already been recorded',
  'Invalid offset',
  'Invalid page size',
] as const

function stringsFrom(value: unknown, depth = 0, seen = new Set<unknown>()): string[] {
  if (depth > 7 || value === null || value === undefined || seen.has(value)) return []
  if (typeof value === 'string') return [value]
  if (typeof value !== 'object') return [String(value)]
  seen.add(value)
  const record = value as Record<string, unknown>
  const preferred = ['message', 'shortMessage', 'details', 'reason', 'data', 'cause', 'error', 'originalError']
  return preferred.flatMap((key) => key in record ? stringsFrom(record[key], depth + 1, seen) : [])
}

export function errorCode(error: unknown, depth = 0): number | undefined {
  if (!error || typeof error !== 'object' || depth > 6) return undefined
  const record = error as Record<string, unknown>
  const code = Number(record.code)
  if (Number.isFinite(code)) return code
  for (const key of ['data', 'cause', 'error', 'originalError']) {
    const nested = record[key]
    if (nested && nested !== error) {
      const found = errorCode(nested, depth + 1)
      if (found !== undefined) return found
    }
  }
  return undefined
}

export function normalizeError(error: unknown): string {
  const joined = stringsFrom(error).join('\n')
  for (const message of CONTRACT_MESSAGES) {
    if (joined.includes(message)) return message
  }
  const rollback = joined.match(/(?:\[rollback\]|UserError[:\s(]+)["']?([^"'\n})]+)/i)
  if (rollback?.[1]) return rollback[1].trim()
  const code = errorCode(error)
  if (code === 4001) return 'The wallet request was rejected.'
  if (code === -32002) return 'MetaMask already has a pending request. Finish it first.'
  if (code === 4902) return 'GenLayer StudioNet is not configured in MetaMask.'
  return joined.split('\n').find((line) => line.trim())?.trim() || 'Unexpected wallet or RPC error.'
}

export { CONTRACT_MESSAGES }

