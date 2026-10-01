# Backdate Project runtime evidence

The frozen ReachBack Intelligent Contract source previously passed the three semantic Must-Verify gates at IC address `0xD37AA0Fa3FD7348b8391b968E5F3f1fe58389D3C`. That address is background evidence only and must **not** be configured as Backdate's Project contract.

## Project deployment

| Field | Value |
|---|---|
| Network | GenLayer StudioNet, chain 61999 |
| Frozen source SHA-256 | `8f1d187bae8025e146d5af90dfbd09f508667b2af5082be2294288918484fd35` |
| Backdate Project contract | `0x3866657F0A1b467a4868eD7C1Bc0eEC4af98314a` |
| Deploy transaction | `0xa535a8d792860bc3b34036972800d32754cefaeb97fc1ea16f0061e41ae4386d` — `FINALIZED / SUCCESS` |
| Frontend URL | `TBD` |

Test wallets supplied for the Project runtime run:

- Author: `0x3065E31B1D993d7C0D59E6786844cBa56780B2d3`
- Other: `0x5a52d040581A76e2C032542855D31480f2ea7097`

## Project transaction evidence

| Flow | Transaction hashes | FINALIZED + leader SUCCESS | Accepted postcondition |
|---|---|---|---|
| Open/entries/retroactive amendment | TBD | TBD | `BACK`, entry 1, total 2400 |
| Open/entries/forward amendment | TBD | TBD | `FORWARD`, entry 3, total 2000 |
| Other-side objection | TBD | TBD | objection stored; scope unchanged |

## Required screenshots

1. `docs/evidence/01-retroactive.png` — large scope line, recalculated rows, total.
2. `docs/evidence/02-forward-only.png` — scope starts after existing entries, unchanged total.
3. `docs/evidence/03-compare.png` — both profiles side by side.

No `TBD` row is claimed as tested. Build success is not runtime success.
