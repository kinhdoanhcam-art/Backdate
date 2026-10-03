# Testing

## Accepted-state synchronization

After each confirmed write, Backdate reloads read-only state until the specific expected change is visible: `entry_count` increases, `reach` is set, or `objection_note` is populated. A stale ledger snapshot is not treated as a successful refresh, and the write is never resent.

## ĐÃ TỰ CHẠY

- `npm run build`: PASS, TypeScript project build plus Vite production bundle.
- `npm test`: PASS, 46/46 assertions across 4 files.
- Python text parity: 16 tests including 12 whitespace fixtures, U+001C–U+001F, U+0085, code-point length, live ID, and normalized ID.
- Error extraction: 23 tests, covering every predictable contract message plus nested wallet rejection.
- Receipt/calldata gate: 5 tests; leader success/error/missing/validator-only and full serialized byte measurement.
- Ledger arithmetic: 2 tests, including bigint precision beyond `Number.MAX_SAFE_INTEGER`.
- `npm run verify:source`: PASS, SHA-256 `8f1d187bae8025e146d5af90dfbd09f508667b2af5082be2294288918484fd35`.
- `npm ls genlayer-js viem --all`: PASS, `genlayer-js@1.1.8` and one deduplicated `viem@2.56.8`.
- Post-write refresh reads the latest accepted StudioNet snapshot and retries for up to about 30 seconds until the expected entry, amendment, or objection state change is visible. It never retries or resends the write transaction.

## COMPLETED STUDIONET PROJECT RUN

- Deployment: `0x3866657F0A1b467a4868eD7C1Bc0eEC4af98314a`, transaction `0xa535a8d792860bc3b34036972800d32754cefaeb97fc1ea16f0061e41ae4386d`, `FINALIZED / SUCCESS`.
- Author: `0x3065E31B1D993d7C0D59E6786844cBa56780B2d3`.
- Other side: `0x5a52d040581A76e2C032542855D31480f2ea7097`.
- `Project Retro`: three quantity-10 entries at base rate 100, amended to 120 with `The new rate applies to every order already placed.` Accepted result: `RETROACTIVE`, effective from entry 1, three recalculated amounts of 1200, total 3600, old total 3000.
- `Project Forward`: the same three entries and new rate with `The new rate applies to orders placed after today.` Accepted result: `FORWARD_ONLY`, effective from entry 4, three unchanged amounts of 1000, total 3000.
- Visual proof: `docs/screenshots/01-retroactive.png`, `02-forward-only.png`, and `03-compare.png`.

## OPTIONAL FOLLOW-UP

The role-restricted objection method is covered by contract logic and UI guards but was not required for the completed core comparison. A reviewer may optionally switch to the declared other-side wallet and record one objection; this does not alter reach, effective entry, or totals.

## What this run does NOT prove

- A local build does not prove StudioNet execution.
- A submitted hash does not prove leader success or accepted post-state.
- The previous ReachBack IC address does not prove the separately deployed Backdate Project address.
- The UI preview does not predict the model verdict; it shows deterministic totals for both possible reach directions.
