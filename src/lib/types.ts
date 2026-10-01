export type Address = `0x${string}`
export type Numeric = string | number | bigint

export type LedgerPointer = {
  author_wallet: string
  title: string
  ledger_id: string
}

export type Ledger = {
  ledger_id: string
  author: string
  outcome: string
  other_wallet: string
  other_label: string
  title: string
  base_rate: Numeric
  entry_count: Numeric
  amendment_text: string
  new_rate: Numeric
  reach: string
  resolved_by: string
  effective_from: Numeric
  objection_note: string
  total: Numeric
  total_at_base: Numeric
}

export type LedgerEntry = {
  ledger_id: string
  index: Numeric
  quantity: Numeric
  amount: Numeric
  amount_at_base: Numeric
  uses_new_rate: boolean
}

export type LedgerBundle = {
  ledger: Ledger
  entries: LedgerEntry[]
}

export type ContractLimits = {
  max_title_length: Numeric
  max_label_length: Numeric
  max_text_length: Numeric
  max_note_length: Numeric
  max_entries: Numeric
  max_rate: Numeric
  max_quantity: Numeric
  max_page_size: Numeric
}

export type WriteOutcome =
  | { state: 'confirmed'; hash: Address; returnValue: unknown }
  | { state: 'delayed'; hash: Address }
