# Backdate locked specification

## Novel output

Backdate visualizes one narrow fact from ReachBack: the starting index at which a changed rate applies on an existing ledger. It does not decide authority, fairness, ownership, payment, or whether a rate amendment exists.

- `effective_from = 1` means earlier entries are recalculated.
- `effective_from = entry_count + 1` means earlier entries retain the base rate.
- Entries recorded after either amendment use the new rate.

## Identity and text parity

Ledger identity is Keccak-256 of `REACH_BACK:LEDGER:V1|lower(author)|len(normalized title)|normalized title` without a `0x` prefix. Frontend `pyStrip`, `pyNormalize`, and `pyLen` mirror Python 3, including U+001C–U+001F and U+0085. Keccak is provided locally by the pinned `viem`; NIST SHA3-256 and CDN scripts are forbidden.

## Contract teeth

- One amendment per ledger; the second reverts exactly `This ledger has already been amended`.
- `effective_from`, `reach`, and `resolved_by` are stored once.
- Amounts are derived at read time from quantity, base rate, new rate, and `effective_from`.
- Only the named other wallet may object, only once, after an amendment.
- An objection cannot change `reach` or `effective_from`.
- Both wallets receive a discovery index through `get_ledgers_for`.
- No public preview/classification call exists; the UI preview is deterministic arithmetic only.

## Frontend invariants

1. Forms start empty; production code contains no test wallet or seeded ledger.
2. Every write first reads accepted state and every confirmed handler reloads accepted state.
3. Predictable reverts are disabled and displayed with the contract's exact message.
4. Only a `mode=leader` receipt with `execution_result=SUCCESS` is confirmed.
5. `ERROR` exposes the recursive rollback/UserError reason. Missing result is delayed, never success.
6. Contract text is rendered as escaped React text.
7. The full serialized calldata size is measured and blocked above 255 bytes.
8. Integer state is retained as string/bigint for arithmetic; it is never rounded through unsafe JavaScript numbers.
9. Read and write clients share the same proxied chain.
10. The Project address must be different from the ReachBack Intelligent Contract submission address while using the identical frozen source.

