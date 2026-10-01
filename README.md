Backdate makes the starting index of a rate amendment visible: the same recorded entries can keep their old amounts or be recalculated from entry 1.

# Backdate

Backdate is the Project/dApp for the frozen ReachBack GenLayer Intelligent Contract. A ledger author records quantities at a base rate, submits one natural-language amendment, and GenLayer classifies whether the new rate is `RETROACTIVE`, `FORWARD_ONLY`, or unresolved. Deterministic contract code converts that result into a permanent `effective_from` index.

The contract does not hold, transfer, or claim money. All ledger amounts are numbers only.

## Project deployment

- Network: GenLayer StudioNet, chain ID `61999`
- Project contract: [`0x3866657F0A1b467a4868eD7C1Bc0eEC4af98314a`](https://explorer-studio.genlayer.com/address/0x3866657F0A1b467a4868eD7C1Bc0eEC4af98314a)
- Deploy transaction: [`0xa535a8d7…ae4386d`](https://explorer-studio.genlayer.com/tx/0xa535a8d792860bc3b34036972800d32754cefaeb97fc1ea16f0061e41ae4386d)
- Frozen source SHA-256: `8f1d187bae8025e146d5af90dfbd09f508667b2af5082be2294288918484fd35`

This Project address is separate from the earlier ReachBack Intelligent Contract submission address.

## What the interface proves

- a large `Applies from entry …` scope line;
- current and old amounts on every entry, with recalculated old amounts struck through;
- the accepted total and the total at the old rate;
- an amendment preview showing both possible totals before submission;
- two-ledger comparison mode for the strongest `2400` versus `2000` proof;
- accepted-state preflight, exact predictable-revert messages, leader-receipt confirmation, and delayed-confirmation handling;
- local Python-compatible title normalization and Keccak-256 ledger IDs.

## Run locally

Requirements: Node.js 22+ and MetaMask.

```bash
npm ci
cp .env.example .env.local
# .env.production already contains Backdate's public Project contract address.
npm run build
npm test
npm run dev
```

The frozen source is [`contracts/ReachBack.py`](contracts/ReachBack.py). Its normalized SHA-256 must remain `8f1d187bae8025e146d5af90dfbd09f508667b2af5082be2294288918484fd35`.

## Deploy

1. Deploy the repository. `.env.production` already identifies the separately deployed Project contract and `vercel.json` forwards same-origin `/genlayer-rpc` requests to StudioNet.
2. On a Vercel redeploy, clear **Use existing Build Cache** in the redeploy dialog.
3. If the contract is ever redeployed again, update `VITE_CONTRACT_ADDRESS` before rebuilding.

## How to try it

The steward does not need shared seeded state.

1. Connect MetaMask and open a fresh ledger with a different `other_wallet`.
2. Record two entries with quantity `10` at base rate `100`.
3. Submit one amendment to rate `120` using text that clearly applies either to earlier entries or only future entries.
4. Wait for the leader receipt. Read the scope line, entry table, and accepted total.
5. Optionally repeat with the opposite wording and compare the two ledgers side by side.

One wallet is enough for the core flow. The named second wallet is required only to record an objection.

## Network and transaction safety

- `genlayer-js` is pinned to `1.1.8`; `viem` is pinned and deduplicated at `2.56.8`.
- The app never calls `client.connect('studionet')` and does not require a Snap.
- Only six signing/account methods are routed to MetaMask; all other JSON-RPC calls use `/genlayer-rpc`.
- A missing leader execution result is never treated as success. After about 60 seconds the app reports delayed confirmation and does not resubmit.
- React renders contract text as escaped text; no contract value is inserted with raw HTML.
- The live calldata meter blocks writes above the conservative 255-byte StudioNet safety threshold.

## Honest limitations

1. The contract holds no funds and makes no payment claim; its ledger contains numbers.
2. It does not determine whether an author has authority to change a rate. It records the amendment and an objection; authority is a separate question.
3. The other side discovers relevant ledgers through `get_ledgers_for` before objecting.
4. A ledger can be amended only once, but an author can open another ledger and try different wording. Every ledger linked to the other wallet remains discoverable.
5. `UNRESOLVED` is settled by deterministic arithmetic against the drafter. The original outcome and `resolved_by` remain visible.
6. The author supplies the other wallet, a second wallet is cheap, entry amounts are computed at read time, and a ledger accepts at most 30 entries.

## Verification

```bash
npm run check
npm ls genlayer-js viem --all
```

See [`TESTING.md`](TESTING.md), [`RUNTIME_EVIDENCE.md`](RUNTIME_EVIDENCE.md), and [`SECURITY.md`](SECURITY.md).
