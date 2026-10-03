# Backdate Project runtime evidence

The frozen ReachBack Intelligent Contract source previously passed the three semantic Must-Verify gates at IC address `0xD37AA0Fa3FD7348b8391b968E5F3f1fe58389D3C`. That address is background evidence only and must **not** be configured as Backdate's Project contract.

## Project deployment

| Field | Value |
|---|---|
| Network | GenLayer StudioNet, chain 61999 |
| Frozen source SHA-256 | `8f1d187bae8025e146d5af90dfbd09f508667b2af5082be2294288918484fd35` |
| Backdate Project contract | `0x3866657F0A1b467a4868eD7C1Bc0eEC4af98314a` |
| Deploy transaction | `0xa535a8d792860bc3b34036972800d32754cefaeb97fc1ea16f0061e41ae4386d` — `FINALIZED / SUCCESS` |
| Frontend URL | See `PROJECT_SUBMISSION_NOTE.md`; paste the current Vercel production URL before submission. |

Test wallets supplied for the Project runtime run:

- Author: `0x3065E31B1D993d7C0D59E6786844cBa56780B2d3`
- Other: `0x5a52d040581A76e2C032542855D31480f2ea7097`

## Project transaction evidence

| Flow | Runtime status | Accepted postcondition |
|---|---|---|
| `Project Retro`: open, three entries, amendment | Completed | `RETROACTIVE / BACK`, entry 1, total 3600, old total 3000 |
| `Project Forward`: open, three entries, amendment | Completed | `FORWARD_ONLY / FORWARD`, entry 4, total 3000 |
| Side-by-side comparison | Completed | Same wallets, base rate, quantities, and new rate; different accepted scope and totals |
| Other-side objection | Not run; optional | Contract and UI support it, but it is not claimed as runtime-tested |

## Required screenshots

1. `docs/screenshots/01-retroactive.png` — entry 1 scope, three recalculated rows, total 3600.
2. `docs/screenshots/02-forward-only.png` — entry 4 scope, three unchanged rows, total 3000.
3. `docs/screenshots/03-compare.png` — both accepted profiles side by side.

The screenshots display accepted contract state. Build success alone is not treated as runtime success.
