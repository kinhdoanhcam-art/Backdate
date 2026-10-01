# Backdate test plan

## Automated gates

1. Build with `tsc -b && vite build`.
2. Verify 12 Python-strip whitespace cases, including U+001C–U+001F and U+0085.
3. Verify Python code-point length with a non-BMP character.
4. Match the live Ledger A Keccak ID.
5. Extract every contract UserError through nested provider/rollback shapes.
6. Accept only a leader `SUCCESS` receipt.
7. Treat leader `ERROR` as failure.
8. Treat missing execution result as pending.
9. Ignore validator success without a leader result.
10. Preserve bigint precision in amendment previews.
11. Measure full serialized calldata rather than text length.
12. Verify the frozen contract source hash.
13. Verify one deduplicated `viem` version.

## Manual Project runtime checks

Only wallet signing, live StudioNet consensus, and three visual screenshots require the user. See [`RUNTIME_EVIDENCE.md`](RUNTIME_EVIDENCE.md). The manual run should not repeat deterministic validation already covered above.

