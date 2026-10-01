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
- Post-write refresh retries accepted-state reads for up to about 12 seconds; it never retries or resends the write transaction.

## CẦN NGƯỜI DÙNG CHẠY

### Phiên Project — sau khi có địa chỉ deploy mới và URL Vercel

1. **Deployment already complete:** `0x3866657F0A1b467a4868eD7C1Bc0eEC4af98314a`, tx `0xa535a8d792860bc3b34036972800d32754cefaeb97fc1ea16f0061e41ae4386d`, `FINALIZED / SUCCESS`.
2. **Author `0x3065…B2d3` → core retroactive flow:** open one fresh ledger, record two quantity-10 entries at base 100, amend to 120 with clear retroactive wording; expect leader success, `Applies from entry 1`, total 2400 and two old amounts struck through; record write tx hashes.
3. **Author `0x3065…B2d3` → core forward flow:** open a second fresh ledger, record the same two entries, amend to 120 with clear future-only wording; expect leader success, `Applies from entry 3`, total 2000 and no prior rows changed; record write tx hashes.
4. **Other `0x5a52…7097` → objection:** discover the first ledger in **My ledgers**, record one objection; expect reach/effective entry unchanged; record tx hash.
5. **Visual evidence:** capture exactly three images: retroactive ledger card, forward-only ledger card, and two-ledger Compare view.

## What this run does NOT prove

- A local build does not prove StudioNet execution.
- A submitted hash does not prove leader success or accepted post-state.
- The previous ReachBack IC address does not prove the separately deployed Backdate Project address.
- The UI preview does not predict the model verdict; it shows deterministic totals for both possible reach directions.
