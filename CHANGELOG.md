# Changelog

## Final project evidence and branding

- Added the Backdate PNG logo and integrated it into the header and favicon.
- Added accepted-state screenshots for retroactive, forward-only, and side-by-side comparison outcomes.
- Updated runtime documentation to the completed three-entry StudioNet run.
- Added a complete copy-paste Project submission form and reusable Project submission rules.

## Accepted-state synchronization fix

- Read StudioNet's latest accepted snapshot instead of the lagging final snapshot.
- After a confirmed write, keep reading until the expected entry, amendment, or objection change is visible.
- Never resend a write while the accepted-state replica catches up.

## 1.0.0 — 2026-10-01

- Built the Backdate Vite/React/TypeScript Project around the frozen ReachBack source.
- Added accepted-state preflight, MetaMask-only signing routes, same-origin RPC proxy, leader receipt confirmation, and recursive rollback extraction.
- Added Python-compatible normalization, local Keccak ledger IDs, bigint-safe arithmetic, and encoded-calldata guard.
- Added ledger discovery, entry visualization, dual-total amendment preview, and two-ledger comparison.
- Added 46 automated assertions, CI, source hash verification, runtime evidence template, and submission template.
- Bound the production build to separately deployed Project contract `0x3866657F0A1b467a4868eD7C1Bc0eEC4af98314a`.
- Added accepted-state read retries after confirmed writes to tolerate StudioNet replica lag without resending transactions.
