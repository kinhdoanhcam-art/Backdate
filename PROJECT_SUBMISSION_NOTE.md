# Backdate Project submission copy

Replace every `TBD` only after the Project deployment and live frontend run.

## Title

Backdate — See Exactly Where a Rate Amendment Begins

## Changes & Improvements (under 1000 characters)

Backdate turns ReachBack's semantic verdict into a visible, auditable ledger. A user opens a numeric ledger, records quantities, and submits one rate amendment. The frozen GenLayer contract decides whether the new rate reaches back to existing entries or begins with the next entry, while deterministic code fixes the effective index and totals. The UI reads accepted state, shows “Applies from entry 1/3,” strikes old amounts only when entries were recalculated, previews both possible totals before submission, and compares two ledgers side by side. It also exposes other-wallet discovery and one-time objections without changing the result. Safety work includes Python-exact title normalization, local Keccak IDs, bigint arithmetic, accepted-state preflight, exact revert messages, a 255-byte calldata guard, leader-receipt confirmation, and no blind resend. The contract holds no funds.

## Evidence links

- GitHub Repository: `TBD`
- Live Project: `TBD`
- GenLayer Explorer Contract: https://explorer-studio.genlayer.com/address/0x3866657F0A1b467a4868eD7C1Bc0eEC4af98314a
- Deploy transaction: https://explorer-studio.genlayer.com/tx/0xa535a8d792860bc3b34036972800d32754cefaeb97fc1ea16f0061e41ae4386d
- GitHub Compare: `TBD — final reviewed project commit...submitted commit`
- Runtime evidence: `TBD — GitHub link to RUNTIME_EVIDENCE.md`
- Testing: `TBD — GitHub link to TESTING.md`
- Screenshot 1 retroactive: `TBD`
- Screenshot 2 forward-only: `TBD`
- Screenshot 3 compare: `TBD`

## What did you change? (for a revision/resubmission only)

Added an immutable GitHub comparison from the last reviewed commit to this submission, completed the separately deployed Backdate Project evidence, and linked leader-success transactions plus accepted-state screenshots for both retroactive and forward-only totals.
