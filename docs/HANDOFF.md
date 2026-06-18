# Switching Sim — Build Handoff (ground‑up, standalone repo)

> Read [`SPEC.md`](SPEC.md) first — it’s the full design, the rules, and the tech spec.
> This file is the **kickoff**: how to stand up the new repo and build it phase by phase.
> Home repo: **`switch-list`** (`C:\projects\switch-list`) — these docs live there under `/docs`.
> Rules source of truth: the **`cn-conductor-trainer`** repo (the Jan 2025 CROR PDF + the signal data).

---

## What you’re building

A standalone, single‑page **yard‑switching trainer** for CN conductors, on its own GitHub Pages site. Same engine as the `cn-conductor-trainer` prototype, but **built clean** with two corrections and a real teaching arc:

1. **Score = fewest MOVES** (joints are a secondary quality stat). See SPEC §2 — this is the most important change.
2. **Rules ramp** — start with the simplest model and introduce one rule at a time (SPEC §8).

And it cites every rule, with the **CN Conductor Trainer repo as the source of truth** (the Jan 2025 CROR PDF + the signal data). SPEC §0.

---

## Stand up the repo

1. **Repo: `switch-list`** (created local at `C:\projects\switch-list`). It’s a **free, open** tool. When you publish: enable **GitHub Pages** (serve from `main` / root or `/docs`) → `<user>.github.io/switch-list`; add a permissive `LICENSE` (MIT suggested).
2. Pure static — **no build step, no framework.** `index.html` + a `/src` of vanilla JS (or one file to start) + `/docs` (this folder) + `/tools` (the solver).
3. Copy in from `cn-conductor-trainer` (as reference, then rewrite — don’t fork the prototype HTML wholesale; the prototype carries the old joint‑par metric and accreted state):
   - the **CROR PDF** (or link to it) for citation checking,
   - the **rules brain** logic as a *reference* (securing, kick legality, joints) — but re‑implement against the move‑first metric,
   - the **palette / charcoal theme** and the chrome conventions.
4. Footer + How‑to must keep the honest disclaimer (SPEC §0) and **cite the rules** (SPEC §5).

---

## Architecture (keep it boring)

- `index.html` — shell + styles.
- `src/geometry.js` — routes, `polyAt` (extrapolates s<0), car layout, clearance/lead constants.
- `src/model.js` — state, `carLen`, `pull/spot/kick`, securing, foul/lead/kick‑limit checks, win.
- `src/render.js` — `draw()` from the model (tracks, ladder, main‑line extension, switches+clearance ticks, cars by length, loaded/empty, engine, overlays).
- `src/anim.js` — `play()` step driver, arrival/departure, Watch‑optimal.
- `src/sound.js` — Web Audio sfx + mute.
- `src/puzzles.js` — the puzzle list (schema in SPEC §9), grouped by tier/rule.
- `tools/solve.mjs` — the move‑first solver + the verification harness (Node).

(Start as one file if you like; split when it hurts.)

---

## Build order (phased — mirrors the curriculum)

Each phase ships something playable and **every puzzle is solver‑verified before it lands**.

**P0 — skeleton + the move.** Canvas yard (lead + ladder + 6 tracks, drawn from geometry). Switch lining (tap to throw; route check, CROR 104). PULL + SPOT animated. One “every car identical, no kicking” puzzle. **Score = moves.** Watch‑optimal plays the min‑move line. → *Rules active: line, pull, spot.*

**P1 — digging & lead room.** Buried‑car digs; lead clearance/length (114) refuses over‑pulls. A few tier‑1 puzzles. *(+ no new visible rule beyond clearance.)*

**P2 — securing & kicking.** 2+ cuts tie down (112); KICK onto a tied cut (113.4/113.5). Kicking saves a coupling but never a move — verify the solver never emits a kick that adds a move. *(+ kick)*

**P3 — clearance/foul + restore switches.** Strict clearance point (114 / 104(c)); over‑stuffing refused; restore‑to‑normal nudge (104(h)). *(+ foul)*

**P4 — loads & empties.** Loaded/empty (solid/hollow); blocking (“don’t mix”); kick limits 5 empties / 3 loaded (113.5 s.i.); **no kicking loaded into empty** (pin the SME wording first — SPEC §10.1). *(+ loads)*

**P5 — car types & length.** Autorack/lumber longer; length‑aware lead + clearance. *(+ length)*

**P6 — road jobs.** Inbound arrives top‑right, sets out a couple from a ~20‑car train, runs off bottom‑left; you build the outbound and depart bottom‑left (SPEC §7). *(+ depart)*

**P7 — outbound manifest.** Build in exact blocking order (ordered goal). *(+ ordered)*

---

## The metric, concretely (don’t repeat the prototype’s mistake)

- A **move** = one PULL / SPOT / KICK. **Par = the minimum number of moves.**
- The solver ranks by **(moves, then joints)**. The Watch‑optimal line is the fewest‑moves line (then cleanest on couplings).
- **Joints/couplings are displayed, not optimized.** Never let the solver (or a hint) prefer a longer line because it has fewer couplings — that was the kick‑then‑pull‑back bug.
- Show: `N moves (par M) · K couplings`.

---

## Definition of done (per puzzle)

1. Solver returns a finite **par (moves)** + an `opt` line.
2. The harness replays `opt` through the live engine across ≥ 40 random rolls and wins at exactly par with **no** foul / lead / kick‑limit violation.
3. Only the puzzle’s **active rules** are surfaced in the UI/score.
4. Every rule referenced in the puzzle’s hint/how‑to **cites a CROR number** (or is labelled a special instruction).

---

## Rule citation quick‑reference (verified, Jan 2025 CROR)

| Mechanic | Rule |
|---|---|
| Hand switches: examine after turning; don’t throw under cars to the foul point; leave main switches normal | **104(b), 104(c), 104(h)/(i)** |
| Operation on non‑main track: Reduced speed, **≤ 15 MPH** | **105 / 105(b)** (defs: REDUCED, RESTRICTED, SLOW=15) |
| Securing unattended equipment (hand brakes) | **112** |
| Coupling + stretch to verify | **113.0 / 113.2** |
| Kicking: prohibited tracks / where allowed | **113.4** |
| Kicking: conditions; **max kicked set by special instruction**; brakes verified | **113.5 (a)(v), (b)** |
| Fouling other tracks (clearance point) | **114** |
| Shoving / point protection | **115** |
| Running switch (≥3 crew) — later | **113.6** |

Special instructions (confirm with SME, not numbered CROR): kickable track set; kick limit 5 empties / 3 loaded; “no kicking loaded into empty”; GP yard speed.

---

## Things the prototype got right (keep)

- Command‑and‑watch feel; line → call → watch.
- Cumulative car layout (no overlap), loaded/empty visual, clearance ticks.
- Inbound through‑train (top‑right → set out → off bottom‑left); outbound departs bottom‑left.
- Solver + harness discipline (every puzzle proven solvable/par).
- Sound + mute; tiered picker; work order inside the yard frame; Watch‑optimal slow‑mo.

## Things to fix in the rebuild (don’t carry over)

- **Joint‑based par** → move‑based par.
- Rules all‑on from the start → **rule ramp** (active‑rules gating).
- One giant HTML file with accreted edits → small modules, solver in `/tools`.

---

*Built on the January 2025 CROR. A personal study aid — not affiliated with or endorsed by CN; the official CROR and CN special instructions govern.*
