# Security model

## Contract boundary

Amendment text and side labels are untrusted content. The frozen contract encloses them in explicit tags, removes tag-like material before prompting, rejects reserved control tokens, asks one narrow semantic question, and validates the output against three allowed outcomes. The model never receives rates, wallets, entries, or downstream consequences.

`UNRESOLVED` is converted by deterministic arithmetic into the direction that disadvantages the drafter: a lower rate reaches back, while an equal/higher rate starts forward. Both the raw outcome and `resolved_by` remain public.

## Frontend boundary

- No `dangerouslySetInnerHTML`; React escapes every contract-derived string.
- Wallet routing is allowlisted to six EIP-1193 account/sign methods.
- All non-wallet RPC calls use the same-origin `/genlayer-rpc` path.
- Writes use accepted-state preflight and exact role/state guards.
- Full serialized calldata above 255 bytes is blocked.
- Only leader `SUCCESS` confirms a write. Leader `ERROR` exposes its recursive rollback reason; absent execution remains delayed.
- The client never automatically retries a submitted write.
- Production forms and discovery data are empty until read from the configured contract.

## Remaining limitations

The author supplies the other wallet; Sybil resistance is out of scope. The contract keeps numeric ledgers, not funds. A new ledger permits new wording even though each individual ledger allows one amendment. StudioNet availability and validator semantics remain external dependencies.

