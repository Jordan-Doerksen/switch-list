# switch-list

**A free, open training simulator for railway conductors** — learn to work a yard the way the rulebook actually requires.

> Command‑and‑watch: **line the switches, call the moves, watch the engineer work it.** Built on the Canadian Rail Operating Rules (CROR).

---

## Status

Design complete — **building from the ground up.** Start here:

- **[`docs/HANDOFF.md`](docs/HANDOFF.md)** — the build kickoff: architecture, phased build order, the metric, definition of done, verified rule‑citation table.
- **[`docs/SPEC.md`](docs/SPEC.md)** — the full design: mechanics, every CROR citation, loads/empties + blocking, the progressive‑rule curriculum, and the tech spec / data model.

## What it is

A browser game (vanilla JS + Canvas 2D, **no build step**) that teaches yard switching: lining switches, PULL / SPOT / KICK, securing, fouling/clearance, loads vs empties + blocking, and building & departing trains. Inbound road trains arrive, set out cars, and run through; you build the outbound and depart.

## Design principles

- **Two scores: Moves (the goal) and Joints (couplings — also good).** Fewest moves is the objective; couplings are a secondary quality stat — *never add a move just to save a joint.*
- **Ramp the rules** — start dead simple (every car the same, no kicking) and introduce one rule at a time, so a trainee is never overwhelmed.
- **Every mechanic cites a CROR rule** (switches 104, yard speed 105, securing 112, coupling/kicking 113.x, fouling 114, shoving 115).
- **Every puzzle is machine‑verified** solvable at par before it ships (solver + replay harness).

## Source of truth

Operating rules come from the **`cn-conductor-trainer`** project (the January 2025 CROR + the signal data). Special instructions (kick limits, kickable tracks, yard speed specifics) are labelled as such.

## License

Intended to be **free and open** — add a permissive `LICENSE` (MIT suggested) before publishing.

---

*A personal study aid for conductors and trainees — not affiliated with or endorsed by CN; the official CROR and CN special instructions govern.*
