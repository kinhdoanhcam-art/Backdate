import { abi, createClient } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import type { CalldataEncodable } from 'genlayer-js/types'
import type { Address, ContractLimits, Ledger, LedgerBundle, LedgerEntry, LedgerPointer, WriteOutcome } from './types'
import { normalizeError, errorCode } from './errors'

export const STUDIO_CHAIN_ID = 61999
export const STUDIO_CHAIN_HEX = '0xf22f'
export const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS || '') as Address

const WALLET_METHODS = new Set([
  'eth_accounts',
  'eth_requestAccounts',
  'eth_sendTransaction',
  'eth_signTransaction',
  'personal_sign',
  'eth_signTypedData_v4',
])

type Provider = NonNullable<Window['ethereum']>

export function proxiedChain() {
  return {
    ...studionet,
    rpcUrls: {
      ...studionet.rpcUrls,
      default: { http: ['/genlayer-rpc'] as readonly string[] },
    },
  }
}

async function sameOriginRpc(method: string, params: unknown[] = []) {
  const response = await fetch('/genlayer-rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  })
  const payload = await response.json() as { result?: unknown; error?: unknown }
  if (!response.ok || payload.error) throw payload.error || new Error(`RPC HTTP ${response.status}`)
  return payload.result
}

function routedProvider(wallet: Provider): Provider {
  return {
    request: ({ method, params }) => {
      if (WALLET_METHODS.has(method)) return wallet.request({ method, params })
      return sameOriginRpc(method, Array.isArray(params) ? params : [])
    },
  }
}

const readClient = createClient({ chain: proxiedChain() })

function assertConfigured(): Address {
  if (!/^0x[0-9a-fA-F]{40}$/.test(CONTRACT_ADDRESS)) {
    throw new Error('Backdate is not configured yet. Set VITE_CONTRACT_ADDRESS to the separately deployed Project contract.')
  }
  return CONTRACT_ADDRESS
}

export async function ensureStudioNet(): Promise<void> {
  const wallet = window.ethereum
  if (!wallet) throw new Error('MetaMask was not found.')
  const current = String(await wallet.request({ method: 'eth_chainId' })).toLowerCase()
  if (current === STUDIO_CHAIN_HEX) return
  try {
    await wallet.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: STUDIO_CHAIN_HEX }] })
    return
  } catch (error) {
    if (errorCode(error) !== 4902) throw error
  }
  const rpcUrl = new URL('/genlayer-rpc', window.location.origin).toString()
  await wallet.request({
    method: 'wallet_addEthereumChain',
    params: [{
      chainId: STUDIO_CHAIN_HEX,
      chainName: 'GenLayer StudioNet',
      rpcUrls: [rpcUrl],
      nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
      blockExplorerUrls: ['https://explorer-studio.genlayer.com'],
    }],
  })
  await wallet.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: STUDIO_CHAIN_HEX }] })
}

export async function connectWallet(): Promise<Address> {
  const wallet = window.ethereum
  if (!wallet) throw new Error('MetaMask was not found.')
  await ensureStudioNet()
  const accounts = await wallet.request({ method: 'eth_requestAccounts' }) as string[]
  if (!accounts[0]) throw new Error('No wallet account was returned.')
  return accounts[0] as Address
}

export async function currentAccount(): Promise<Address | null> {
  if (!window.ethereum) return null
  const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[]
  return accounts[0] ? accounts[0] as Address : null
}

async function acceptedRead(functionName: string, args: CalldataEncodable[] = []) {
  return readClient.readContract({
    address: assertConfigured(),
    functionName,
    args,
    // StudioNet exposes accepted application state through the latest
    // non-final snapshot. `latest-final` can remain one snapshot behind even
    // after Explorer marks a transaction finalized.
    transactionHashVariant: 'latest-nonfinal',
  } as never)
}

function objectValue<T>(value: unknown): T {
  return (value && typeof value === 'object' ? value : {}) as T
}

function arrayValue<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

export async function getLimits(): Promise<ContractLimits> {
  return objectValue<ContractLimits>(await acceptedRead('get_limits'))
}

export async function getLedger(author: string, title: string): Promise<Ledger | null> {
  const ledger = objectValue<Ledger>(await acceptedRead('get_ledger', [author, title]))
  return ledger.ledger_id ? ledger : null
}

export async function getEntries(author: string, title: string, count: number): Promise<LedgerEntry[]> {
  if (count <= 0) return []
  const entries: LedgerEntry[] = []
  for (let offset = 0; offset < count; offset += 20) {
    const page = arrayValue<LedgerEntry>(await acceptedRead('get_entries', [author, title, offset, Math.min(20, count - offset)]))
    entries.push(...page)
  }
  return entries
}

export async function getLedgerBundle(author: string, title: string): Promise<LedgerBundle | null> {
  const ledger = await getLedger(author, title)
  if (!ledger) return null
  return { ledger, entries: await getEntries(author, title, Number(ledger.entry_count)) }
}

export async function getLedgersFor(wallet: string): Promise<LedgerPointer[]> {
  const all: LedgerPointer[] = []
  for (let offset = 0; ; offset += 20) {
    const page = arrayValue<LedgerPointer>(await acceptedRead('get_ledgers_for', [wallet, offset, 20]))
    all.push(...page)
    if (page.length < 20) return all
  }
}

type LeaderReceipt = { mode?: string; execution_result?: string; result?: unknown; error?: unknown }

function leaderReceipt(raw: unknown): LeaderReceipt | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const consensus = record.consensus_data ?? record.consensusData
  if (!consensus || typeof consensus !== 'object') return null
  const receipts = (consensus as Record<string, unknown>).leader_receipt
  if (!Array.isArray(receipts)) return null
  return (receipts.find((item) => item && typeof item === 'object' && String((item as Record<string, unknown>).mode).toLowerCase() === 'leader') || null) as LeaderReceipt | null
}

export function inspectTransaction(raw: unknown): { state: 'pending' | 'success' | 'error'; value?: unknown; error?: unknown } {
  const receipt = leaderReceipt(raw)
  if (!receipt) return { state: 'pending' }
  const execution = String(receipt.execution_result || '').toUpperCase()
  if (execution === 'SUCCESS') return { state: 'success', value: receipt.result }
  if (execution === 'ERROR') return { state: 'error', error: receipt.error || receipt.result || raw }
  return { state: 'pending' }
}

async function waitForLeader(hash: Address, timeoutMs = 60_000): Promise<WriteOutcome> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const raw = await sameOriginRpc('eth_getTransactionByHash', [hash])
      const inspected = inspectTransaction(raw)
      if (inspected.state === 'success') return { state: 'confirmed', hash, returnValue: inspected.value }
      if (inspected.state === 'error') throw new Error(normalizeError(inspected.error))
    } catch (error) {
      const message = normalizeError(error)
      if (!/not found|unknown transaction/i.test(message)) throw error
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000))
  }
  return { state: 'delayed', hash }
}

async function write(account: Address, functionName: string, args: CalldataEncodable[]): Promise<WriteOutcome> {
  const wallet = window.ethereum
  if (!wallet) throw new Error('MetaMask was not found.')
  await ensureStudioNet()
  const client = createClient({ chain: proxiedChain(), account, provider: routedProvider(wallet) })
  const hash = await client.writeContract({
    address: assertConfigured(),
    functionName,
    args,
    value: 0n,
  }) as Address
  return waitForLeader(hash)
}

export function encodedWriteBytes(functionName: string, args: CalldataEncodable[]): number {
  const call = abi.calldata.encode(abi.calldata.makeCalldataObject(functionName, args, undefined))
  const serialized = abi.transactions.serialize([call, false])
  return (serialized.length - 2) / 2
}

export async function openLedger(account: Address, other: string, label: string, title: string, rate: number) {
  if (await getLedger(account, title)) throw new Error('This ledger already exists')
  return write(account, 'open_ledger', [other, label, title, rate])
}

export async function recordEntry(account: Address, title: string, quantity: number) {
  const ledger = await getLedger(account, title)
  if (!ledger) throw new Error('No ledger with this title')
  if (Number(ledger.entry_count) >= 30) throw new Error('The ledger is full')
  return write(account, 'record_entry', [title, quantity])
}

export async function amendRate(account: Address, title: string, newRate: number, text: string) {
  const ledger = await getLedger(account, title)
  if (!ledger) throw new Error('No ledger with this title')
  if (ledger.reach) throw new Error('This ledger has already been amended')
  return write(account, 'amend_rate', [title, newRate, text])
}

export async function objectToAmendment(account: Address, author: string, title: string, note: string) {
  const ledger = await getLedger(author, title)
  if (!ledger) throw new Error('No ledger with this title')
  if (account.toLowerCase() !== ledger.other_wallet.toLowerCase()) throw new Error('Only the named other side may object')
  if (!ledger.reach) throw new Error('There is no amendment to object to')
  if (ledger.objection_note) throw new Error('An objection has already been recorded')
  return write(account, 'object_to_amendment', [author, title, note])
}
