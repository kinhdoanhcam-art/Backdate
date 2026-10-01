import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import {
  CONTRACT_ADDRESS,
  amendRate,
  connectWallet,
  currentAccount,
  encodedWriteBytes,
  getLedgerBundle,
  getLedgersFor,
  objectToAmendment,
  openLedger,
  recordEntry,
} from './lib/genlayer'
import { normalizeError } from './lib/errors'
import { amendmentPreview, formatNumber } from './lib/ledger'
import { isWallet, ledgerIdFor, pyLen, pyStrip } from './lib/python'
import type { Address, LedgerBundle, LedgerPointer, WriteOutcome } from './lib/types'

type Notice = { tone: 'good' | 'warn' | 'bad'; text: string; hash?: string }

const RESERVED = [
  '<UNTRUSTED_AMENDMENT_TEXT>', '</UNTRUSTED_AMENDMENT_TEXT>',
  '<UNTRUSTED_OTHER_SIDE_LABEL>', '</UNTRUSTED_OTHER_SIDE_LABEL>',
  'RETROACTIVE', 'FORWARD_ONLY', 'UNRESOLVED',
]

const short = (value: string) => value ? `${value.slice(0, 7)}…${value.slice(-5)}` : '—'
const same = (a?: string, b?: string) => Boolean(a && b && a.toLowerCase() === b.toLowerCase())
const hasReserved = (value: string) => RESERVED.some((token) => value.toUpperCase().includes(token))

function outcomeNotice(outcome: WriteOutcome, success: string): Notice {
  if (outcome.state === 'confirmed') return { tone: 'good', text: success, hash: outcome.hash }
  return { tone: 'warn', text: 'Submitted — confirmation delayed. Do not resend blindly; refresh this ledger first.', hash: outcome.hash }
}

function TxNotice({ notice }: { notice: Notice | null }) {
  if (!notice) return null
  return (
    <div className={`notice ${notice.tone}`} role="status">
      <span>{notice.text}</span>
      {notice.hash && <a href={`https://explorer-studio.genlayer.com/tx/${notice.hash}`} target="_blank" rel="noreferrer">View transaction ↗</a>}
    </div>
  )
}

function LedgerCard({ bundle, compact = false }: { bundle: LedgerBundle; compact?: boolean }) {
  const { ledger, entries } = bundle
  const changedTotal = BigInt(ledger.total) !== BigInt(ledger.total_at_base)
  return (
    <article className={`ledger-card ${compact ? 'compact' : ''}`}>
      <header>
        <div>
          <p className="eyebrow">{ledger.reach ? `${ledger.outcome} · ${ledger.resolved_by}` : 'OPEN LEDGER'}</p>
          <h2>{ledger.title}</h2>
        </div>
        <span className={`reach-pill ${ledger.reach.toLowerCase() || 'open'}`}>{ledger.reach || 'NOT AMENDED'}</span>
      </header>

      {ledger.reach && <p className="scope-line">Applies from entry {String(ledger.effective_from)}</p>}
      {ledger.resolved_by === 'AGAINST_DRAFTER' && <p className="against">Decided against the drafter: the text did not settle it.</p>}

      <dl className="ledger-meta">
        <div><dt>Author</dt><dd title={ledger.author}>{short(ledger.author)}</dd></div>
        <div><dt>{ledger.other_label || 'Other side'}</dt><dd title={ledger.other_wallet}>{short(ledger.other_wallet)}</dd></div>
        <div><dt>Base rate</dt><dd>{formatNumber(ledger.base_rate)}</dd></div>
        <div><dt>Current rate</dt><dd>{ledger.reach ? formatNumber(ledger.new_rate) : '—'}</dd></div>
      </dl>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Entry</th><th>Quantity</th><th>Current amount</th><th>Old amount</th></tr></thead>
          <tbody>
            {entries.length === 0 && <tr><td colSpan={4} className="empty">No entries recorded yet.</td></tr>}
            {entries.map((entry) => (
              <tr key={String(entry.index)} className={entry.uses_new_rate ? 'recalculated' : ''}>
                <td>#{String(entry.index)}</td>
                <td>{formatNumber(entry.quantity)}</td>
                <td>{formatNumber(entry.amount)}</td>
                <td>{entry.uses_new_rate && BigInt(entry.amount) !== BigInt(entry.amount_at_base) ? <s>{formatNumber(entry.amount_at_base)}</s> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="total-line">
        Total {formatNumber(ledger.total)}
        {changedTotal && <span> (was {formatNumber(ledger.total_at_base)} at the old rate)</span>}
      </p>
      <details>
        <summary>Immutable details</summary>
        <p><b>Ledger ID:</b> <code>{ledger.ledger_id}</code></p>
        {ledger.amendment_text && <p><b>Amendment:</b> {ledger.amendment_text}</p>}
        {ledger.objection_note && <p><b>Objection:</b> {ledger.objection_note}</p>}
      </details>
    </article>
  )
}

function CreateLedger({ account, onLoaded }: { account: Address; onLoaded: (author: string, title: string) => Promise<void> }) {
  const [other, setOther] = useState('')
  const [label, setLabel] = useState('')
  const [title, setTitle] = useState('')
  const [rate, setRate] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const cleanTitle = pyStrip(title)
    const cleanLabel = pyStrip(label)
    if (!isWallet(other)) return setNotice({ tone: 'bad', text: 'Invalid wallet address' })
    if (same(account, other)) return setNotice({ tone: 'bad', text: 'The other side cannot be the author' })
    if (!cleanLabel) return setNotice({ tone: 'bad', text: 'Label is empty' })
    if (pyLen(cleanLabel) > 80) return setNotice({ tone: 'bad', text: 'Label is too long' })
    if (!cleanTitle) return setNotice({ tone: 'bad', text: 'Title is empty' })
    if (pyLen(cleanTitle) > 24) return setNotice({ tone: 'bad', text: 'Title is too long' })
    if (hasReserved(cleanLabel)) return setNotice({ tone: 'bad', text: 'Text or label contains a reserved token' })
    const parsedRate = Number(rate)
    if (!Number.isInteger(parsedRate) || parsedRate <= 0 || parsedRate > 1_000_000_000_000) return setNotice({ tone: 'bad', text: 'The rate is out of range' })
    setBusy(true); setNotice(null)
    try {
      const expectedId = ledgerIdFor(account, cleanTitle)
      const result = await openLedger(account, other, cleanLabel, cleanTitle, parsedRate)
      if (result.state === 'confirmed') await onLoaded(account, cleanTitle)
      setNotice(outcomeNotice(result, `Ledger opened. Its locally verified ID is ${expectedId}.`))
    } catch (error) { setNotice({ tone: 'bad', text: normalizeError(error) }) }
    finally { setBusy(false) }
  }

  return (
    <section className="paper form-panel">
      <p className="eyebrow">NEW RECORD</p><h2>Open a ledger</h2>
      <form onSubmit={submit}>
        <label>Other wallet<input value={other} onChange={(e) => setOther(e.target.value)} placeholder="0x…" /></label>
        <label>How this side is described<input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. the other side" /></label>
        <label>Ledger title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Maximum 24 Python characters" /></label>
        <label>Base rate<input inputMode="numeric" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Positive whole number" /></label>
        <button className="primary" disabled={busy}>{busy ? 'Waiting for consensus…' : 'Open ledger'}</button>
      </form>
      <TxNotice notice={notice} />
    </section>
  )
}

function LedgerActions({ account, bundle, refresh }: { account: Address; bundle: LedgerBundle; refresh: () => Promise<void> }) {
  const { ledger, entries } = bundle
  const isAuthor = same(account, ledger.author)
  const isOther = same(account, ledger.other_wallet)
  const [quantity, setQuantity] = useState('')
  const [newRate, setNewRate] = useState('')
  const [text, setText] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)
  const rate = /^\d+$/.test(newRate) ? BigInt(newRate) : 0n
  const preview = useMemo(() => amendmentPreview(entries, rate), [entries, rate])
  const amendmentBytes = useMemo(() => {
    try { return encodedWriteBytes('amend_rate', [ledger.title, Number(newRate || 0), text]) } catch { return 0 }
  }, [ledger.title, newRate, text])
  const noteBytes = useMemo(() => {
    try { return encodedWriteBytes('object_to_amendment', [ledger.author, ledger.title, note]) } catch { return 0 }
  }, [ledger.author, ledger.title, note])

  async function run(key: string, action: () => Promise<WriteOutcome>, success: string) {
    setBusy(key); setNotice(null)
    try {
      const result = await action()
      if (result.state === 'confirmed') await refresh()
      setNotice(outcomeNotice(result, success))
    } catch (error) { setNotice({ tone: 'bad', text: normalizeError(error) }) }
    finally { setBusy('') }
  }

  const recordError = !isAuthor ? 'No ledger with this title' : Number(ledger.entry_count) >= 30 ? 'The ledger is full' : ''
  const amendError = !isAuthor ? 'No ledger with this title' : ledger.reach ? 'This ledger has already been amended' : ''
  const objectError = !isOther ? 'Only the named other side may object' : !ledger.reach ? 'There is no amendment to object to' : ledger.objection_note ? 'An objection has already been recorded' : ''

  return (
    <section className="paper actions-panel">
      <p className="eyebrow">NEXT ACTION</p><h2>Move the ledger</h2>
      <div className="action-grid">
        <form onSubmit={(e) => {
          e.preventDefault(); const value = Number(quantity)
          if (!Number.isInteger(value) || value <= 0 || value > 1_000_000) return setNotice({ tone: 'bad', text: 'The quantity is out of range' })
          void run('record', () => recordEntry(account, ledger.title, value), 'Entry recorded and accepted state reloaded.')
        }}>
          <h3>Record an entry</h3>
          <label>Quantity<input inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></label>
          {recordError && <p className="exact-error">{recordError}</p>}
          <button disabled={Boolean(recordError || busy)}>{busy === 'record' ? 'Waiting…' : 'Record entry'}</button>
        </form>

        <form onSubmit={(e) => {
          e.preventDefault(); const clean = pyStrip(text); const value = Number(newRate)
          if (!Number.isInteger(value) || value <= 0 || value > 1_000_000_000_000) return setNotice({ tone: 'bad', text: 'The rate is out of range' })
          if (!clean) return setNotice({ tone: 'bad', text: 'Text is empty' })
          if (pyLen(clean) > 600) return setNotice({ tone: 'bad', text: 'Text is too long' })
          if (hasReserved(clean)) return setNotice({ tone: 'bad', text: 'Text or label contains a reserved token' })
          if (amendmentBytes > 255) return setNotice({ tone: 'bad', text: 'Encoded calldata exceeds the 255-byte StudioNet safety limit.' })
          void run('amend', () => amendRate(account, ledger.title, value, clean), 'Amendment finalized and accepted state reloaded.')
        }}>
          <h3>Amend the rate</h3>
          <label>New rate<input inputMode="numeric" value={newRate} onChange={(e) => setNewRate(e.target.value)} /></label>
          <label>Amendment text<textarea value={text} onChange={(e) => setText(e.target.value)} /></label>
          <div className={`meter ${amendmentBytes > 255 ? 'over' : ''}`}><span>{amendmentBytes}/255 encoded bytes</span><span>{pyLen(text)}/600 Python characters</span></div>
          <p className="preview">If this amendment reaches back, the total becomes {formatNumber(preview.retroactive)}; if not, it stays {formatNumber(preview.current)}.</p>
          {amendError && <p className="exact-error">{amendError}</p>}
          <button disabled={Boolean(amendError || amendmentBytes > 255 || busy)}>{busy === 'amend' ? 'Waiting…' : 'Submit one-time amendment'}</button>
        </form>

        <form onSubmit={(e) => {
          e.preventDefault(); const clean = pyStrip(note)
          if (!clean) return setNotice({ tone: 'bad', text: 'Note is empty' })
          if (pyLen(clean) > 60) return setNotice({ tone: 'bad', text: 'Note is too long' })
          if (noteBytes > 255) return setNotice({ tone: 'bad', text: 'Encoded calldata exceeds the 255-byte StudioNet safety limit.' })
          void run('object', () => objectToAmendment(account, ledger.author, ledger.title, clean), 'Objection recorded; reach and effective entry are unchanged.')
        }}>
          <h3>Record an objection</h3>
          <label>Objection note<textarea value={note} onChange={(e) => setNote(e.target.value)} /></label>
          <div className={`meter ${noteBytes > 255 ? 'over' : ''}`}><span>{noteBytes}/255 encoded bytes</span><span>{pyLen(note)}/60 Python characters</span></div>
          {objectError && <p className="exact-error">{objectError}</p>}
          <button disabled={Boolean(objectError || noteBytes > 255 || busy)}>{busy === 'object' ? 'Waiting…' : 'Record objection'}</button>
        </form>
      </div>
      <TxNotice notice={notice} />
    </section>
  )
}

function Finder({ onLoad, initialAuthor = '', initialTitle = '' }: { onLoad: (author: string, title: string) => void; initialAuthor?: string; initialTitle?: string }) {
  const [author, setAuthor] = useState(initialAuthor)
  const [title, setTitle] = useState(initialTitle)
  return (
    <form className="finder" onSubmit={(e) => { e.preventDefault(); onLoad(pyStrip(author), pyStrip(title)) }}>
      <label>Author wallet<input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="0x…" /></label>
      <label>Ledger title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Exact title" /></label>
      <button>Load accepted state</button>
    </form>
  )
}

function Compare({ load }: { load: (author: string, title: string) => Promise<LedgerBundle | null> }) {
  const [left, setLeft] = useState<LedgerBundle | null>(null)
  const [right, setRight] = useState<LedgerBundle | null>(null)
  const [error, setError] = useState('')
  async function pick(side: 'left' | 'right', author: string, title: string) {
    try {
      const found = await load(author, title)
      if (!found) throw new Error('No ledger with this title')
      side === 'left' ? setLeft(found) : setRight(found)
      setError('')
    } catch (e) { setError(normalizeError(e)) }
  }
  return (
    <section className="compare-section">
      <div className="compare-finders"><Finder onLoad={(a, t) => void pick('left', a, t)} /><Finder onLoad={(a, t) => void pick('right', a, t)} /></div>
      {error && <p className="exact-error">{error}</p>}
      <div className="compare-grid">
        {left ? <LedgerCard bundle={left} compact /> : <div className="empty-card">Choose the first ledger.</div>}
        {right ? <LedgerCard bundle={right} compact /> : <div className="empty-card">Choose the second ledger.</div>}
      </div>
    </section>
  )
}

export default function App() {
  const [account, setAccount] = useState<Address | null>(null)
  const [tab, setTab] = useState<'workspace' | 'discover' | 'compare'>('workspace')
  const [bundle, setBundle] = useState<LedgerBundle | null>(null)
  const [pointers, setPointers] = useState<LedgerPointer[]>([])
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const configured = /^0x[0-9a-fA-F]{40}$/.test(CONTRACT_ADDRESS)

  const load = useCallback(async (author: string, title: string) => {
    if (!isWallet(author)) throw new Error('Invalid wallet address')
    if (!pyStrip(title)) throw new Error('Title is empty')
    return getLedgerBundle(author, title)
  }, [])

  const loadIntoWorkspace = useCallback(async (author: string, title: string) => {
    setBusy(true); setNotice(null)
    try {
      let found: LedgerBundle | null = null
      let lastError: unknown
      // A StudioNet leader receipt can arrive just before the accepted read
      // replica exposes the new state. Retry reads only; never resend the write.
      for (let attempt = 0; attempt < 8 && !found; attempt += 1) {
        try {
          found = await load(author, title)
        } catch (error) {
          lastError = error
          if (attempt === 0 && /Invalid wallet address|Title is empty/.test(normalizeError(error))) throw error
        }
        if (!found && attempt < 7) {
          await new Promise((resolve) => setTimeout(resolve, 1_500))
        }
      }
      if (!found && lastError) throw lastError
      if (!found) throw new Error('No ledger with this title')
      setBundle(found); setTab('workspace')
    } catch (error) { setNotice({ tone: 'bad', text: normalizeError(error) }) }
    finally { setBusy(false) }
  }, [load])

  useEffect(() => {
    void currentAccount().then(setAccount).catch(() => undefined)
    const handler = () => void currentAccount().then((next) => { setAccount(next); setBundle(null) })
    window.ethereum?.on?.('accountsChanged', handler)
    window.ethereum?.on?.('chainChanged', handler)
    return () => {
      window.ethereum?.removeListener?.('accountsChanged', handler)
      window.ethereum?.removeListener?.('chainChanged', handler)
    }
  }, [])

  async function connect() {
    setBusy(true); setNotice(null)
    try { setAccount(await connectWallet()) }
    catch (error) { setNotice({ tone: 'bad', text: normalizeError(error) }) }
    finally { setBusy(false) }
  }

  async function discover() {
    if (!account) return
    setBusy(true); setNotice(null)
    try { setPointers(await getLedgersFor(account)); setTab('discover') }
    catch (error) { setNotice({ tone: 'bad', text: normalizeError(error) }) }
    finally { setBusy(false) }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top"><span className="brand-mark">↶</span><span><b>Backdate</b><small>ReachBack ledger explorer</small></span></a>
        <nav>
          <button className={tab === 'workspace' ? 'active' : ''} onClick={() => setTab('workspace')}>Workspace</button>
          <button className={tab === 'discover' ? 'active' : ''} onClick={() => void discover()} disabled={!account}>My ledgers</button>
          <button className={tab === 'compare' ? 'active' : ''} onClick={() => setTab('compare')}>Compare</button>
        </nav>
        <button className="wallet" onClick={() => void connect()} disabled={busy}>{account ? short(account) : 'Connect MetaMask'}</button>
      </header>

      <main id="top">
        <section className="hero">
          <div><p className="eyebrow">THE STARTING POINT IS THE DECISION</p><h1>See exactly where a changed rate begins.</h1></div>
          <p>Backdate reads accepted on-chain state and shows whether an amendment recalculates earlier entries or begins with the next one. The contract holds no funds.</p>
        </section>

        {!configured && <div className="config-warning"><b>Project contract not configured.</b> Deploy the frozen ReachBack source again for Backdate, then set <code>VITE_CONTRACT_ADDRESS</code>. The Intelligent Contract submission address is intentionally not reused.</div>}
        <TxNotice notice={notice} />

        {tab === 'workspace' && (
          <>
            <section className="paper lookup"><div><p className="eyebrow">ACCEPTED STATE</p><h2>Open an existing ledger</h2></div><Finder onLoad={(a, t) => void loadIntoWorkspace(a, t)} /></section>
            {busy && <p className="loading">Reading accepted state…</p>}
            {bundle && <><LedgerCard bundle={bundle} />{account && <LedgerActions account={account} bundle={bundle} refresh={() => loadIntoWorkspace(bundle.ledger.author, bundle.ledger.title)} />}</>}
            {!bundle && account && configured && <CreateLedger account={account} onLoaded={loadIntoWorkspace} />}
            {!account && <section className="empty-card large"><h2>Connect one wallet to begin</h2><p>One wallet is enough to create, record, amend, and explore. The named other wallet is only needed to record an objection.</p></section>}
          </>
        )}

        {tab === 'discover' && (
          <section className="paper discovery"><p className="eyebrow">DISCOVERY INDEX</p><h2>Ledgers linked to {account ? short(account) : 'your wallet'}</h2>
            {pointers.length === 0 ? <p>No linked ledgers were found in accepted state.</p> : <div className="pointer-list">{pointers.map((item) => <button key={item.ledger_id} onClick={() => void loadIntoWorkspace(item.author_wallet, item.title)}><span>{item.title}</span><small>by {short(item.author_wallet)}</small></button>)}</div>}
          </section>
        )}

        {tab === 'compare' && <Compare load={load} />}

        <section className="how"><p className="eyebrow">HOW TO TRY IT</p><h2>A fresh proof in three moves</h2><ol><li>Connect MetaMask on StudioNet and open your own ledger with an empty form.</li><li>Record two entries, then submit one rate amendment.</li><li>Read the scope line, recalculated rows, accepted total, and optional side-by-side comparison.</li></ol></section>
      </main>
      <footer><span>Backdate · StudioNet 61999</span><span title={CONTRACT_ADDRESS}>{configured ? `Contract ${short(CONTRACT_ADDRESS)}` : 'Awaiting Project contract'}</span></footer>
    </div>
  )
}
