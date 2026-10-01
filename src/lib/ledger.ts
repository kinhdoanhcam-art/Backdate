import type { LedgerEntry } from './types'

export function amendmentPreview(entries: LedgerEntry[], newRate: bigint) {
  const current = entries.reduce((sum, entry) => sum + BigInt(entry.amount), 0n)
  const retroactive = entries.reduce((sum, entry) => sum + BigInt(entry.quantity) * newRate, 0n)
  return { current, retroactive }
}

export function formatNumber(value: string | number | bigint): string {
  try {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(BigInt(value))
  } catch {
    return String(value)
  }
}
