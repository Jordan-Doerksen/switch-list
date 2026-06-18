# Switching Sim — Specification & Tech Spec

> A browser-based yard‑switching trainer for CN freight conductors and trainees.
> This document is the **source design** for a clean, ground‑up rebuild in its own repo.
> Status: drafted 2026‑06‑18 from the working prototype in `cn-conductor-trainer/modules/GP Switching Sim.html`.
> Home repo: **`switch-list`** (this is where it’s built, ground‑up). Rules source of truth: the **`cn-conductor-trainer`** repo.

---

## 0. Source of truth

All operating rules in this game come from the **CN Conductor Trainer** repo, which is the authoritative source:

- **CROR** — `reference/Jan_2025_Canadian_rail_operating_rules_EN.pdf` (Canadian Rail Operating Rules, January 2025). **Never invent rule content — cite the rule and verify against this PDF.**
- **Signals** — the *Signal Reading* module + `reference/signal-questions.md` (CROR 405–440, aspect renderer).
- **Citation index** — `reference/citation-index.md` (every rule the trainer cites).
- **Working notes** — `HANDOFF.md` (the prototype's living design log).

Caveat baked into the UI everywhere: *“A personal study aid — the official CROR and CN special instructions govern.”* Some limits below (kick tonnage, yard speed specifics) are **special instructions**, not numbered CROR rules — they are labelled as such.

---

## 1. Vision

You are the **conductor**, not the engineer. You **line the road** and **call the moves**; the engineer works the engine. The game makes the invisible logic of a switching job visible and repeatable, so a trainee can build the right instincts in a safe place to make mistakes.

It is a **command‑and‑watch** game (call PULL/SPOT/KICK, watch it animate) — deliberately *not* a drive‑it‑yourself arcade, because the conductor's skill is **planning and protecting the move**, not throttle control.

The tool should feel **tight, honest, and a little fun**, and every mechanic should map to a real rule a trainee will be tested on.

---

## 2. The scoring objective ⚠ (corrected — read this first)

The prototype optimized for **joints** (couplings). **That is wrong as the primary score.** It produces wasteful lines — e.g. *kick two cars onto a standing cut, then pull them back and leave* — which is **zero joints but pure wasted movement**.

**Primary metric = fewest MOVES.** A “move” is one engine trip / one called command (PULL, SPOT, or KICK). A conductor minimizes total work = total moves.

- **Par = the minimum number of moves** to satisfy the job.
- **Joints (couplings) are a secondary quality stat**, shown but not the target. Lower is better (kicking onto a tied cut saves a coupling), **but you never add a move just to save a joint.**

**Two on‑screen counters, always both visible:**

| Counter | Meaning | Role |
|---|---|---|
| **Moves** | PULL / SPOT / KICK called so far, vs **par** | **The goal** — beat/match par |
| **Joints** | couplings made (pull +1; spot onto cars +1; kick 0) | **Also good** — efficiency / craft |

- Live readout: `Moves 7 / par 6 · Joints 3`. On a win, grade the **moves** (`Par! 6 moves` / `7 moves — par 6`) and praise low joints as a bonus (`…and only 3 couplings — clean`).
- A puzzle stores **both** a `par` (min moves) and the **joint count of the best min‑move line** (the “clean” benchmark). The solver ranks by **moves, then joints** so the benchmark line is the fewest‑moves, then fewest‑couplings line.
- Never let a hint, the solver, or “Watch optimal” prefer a longer (more‑moves) line because it has fewer joints — that was the prototype’s kick‑then‑pull‑back bug.

**Solver rule:** rank solutions by **moves first, joints second**. (See §8.) This single change removes every kick‑then‑pull‑back artifact.

---

## 3. The yard (geometry)

A schematic ladder yard rendered on a `<canvas>` with a game loop. Everything is positioned as **arclength `s` along a polyline route**; `polyAt(route, s)` returns `{x, y, angle}` and **extrapolates for `s < 0`** so trains can be off‑frame.

```
                                              ↗ MAIN LINE (out top‑right, off frame)
                                         ●  AS76  ───────────────
                                      ●     AS75  ───────────────
                                   ●        AS74  ───────────────
                                ●           AS73  ───────────────
                             ●              AS72  ───────────────
                          ●                 AS71  ───────────────
   (off bottom‑left) ◄── ENG ══ LEAD / DRILL ══●  (ladder foot)
```

- **Lead / drill track** — bottom‑left, horizontal. Where the engine works (pulls cuts to clear the switches). Dead‑ends to a bumper on the far left **off‑frame** (departures roll out this way).
- **Ladder** — a diagonal line off the drill; each body track diverges from it at a **switch (junction)**.
- **Six body tracks** — `AS71…AS76` (AS71 nearest the drill, AS76 at the top). Where cars are stored / built.
- **Main line** — the ladder/lead **continues past AS76 out the top‑right, off frame.** This is the road. **Inbound trains arrive from the top‑right; the through portion exits bottom‑left.**
- **Departure** — built outbound trains leave **out the bottom‑left** (down the lead, off frame).
- **Kickable tracks** — a subset (prototype: AS72, AS73), modeling the north‑end grade tracks where kicking is permitted (CROR 113.4 lists where kicking is allowed; **GP special instruction** designates them).

Tunable constants (prototype values): canvas `W≈1340 × H≈460`; track length fills the frame; `CARLEN` (standard car) ≈ 42 px ≈ 50 ft (so ~0.84 px/ft).

---

## 4. Cars

- **Variable length.** Standard ≈ 50 ft; **lumber / centerbeam ≈ 73 ft; autorack / car‑carrier ≈ 89 ft.** Most cars standard. Cars lay out by **cumulative real length** (a car’s neighbours never overlap; adjacent centres differ by half the sum of the two lengths).
- **Loaded vs empty.** Each car is loaded or empty. **Visual: loaded = solid/filled body, empty = hollow/dark.** Loaded/empty drives blocking and kick limits (§5, §6).
- A car is just a label + `{length, loaded}`. Position is derived, never stored per‑car (it’s `track head + cumulative` or `engine head + cumulative`).

---

## 5. Moves & rules (with CROR citations)

Three moves, each one “move” for scoring:

| Move | What it is | Couplings (joints) |
|---|---|---|
| **PULL** *n* from *T* | Back in, couple the throat‑end cut, pull *n* cars out onto the lead. | +1 (you coupled on) |
| **SPOT** *n* to *T* | Shove *n* cars in and leave them. 2+ cars left ⇒ the cut is **tied down** and becomes kickable. | +1 if you couple onto cars already there, else 0 |
| **KICK** *n* to *T* | Shove and cut away rolling; the cars coast on by themselves onto a **secured 2+ cut** on a kickable track. | 0 |

### Rule citations (verified against the Jan 2025 CROR)

- **Switches / lining — Rule 104 (Hand Operated Switches).**
  - 104(b): after a switch is turned, **examine the points and check the target** to confirm it’s lined for the route in use.
  - 104(c): **must not turn a switch while any car/engine is between the points and the fouling point** (except a running switch or the Rule 114 exception). → the clearance mechanic.
  - 104(h): a main‑track switch’s **normal position is the main route; main‑track switches must be left lined and locked normal**, except the 104(i) cases (occupied by equipment, attended, by GBO/clearance/special instruction). → restore switches to normal (good practice in the yard; required on the main).
- **Securing — Rule 112 (Securing unattended equipment).** Hand‑brake chart + effectiveness test. In this game: any standing cut of **2+ cars is tied down** (hand brake on); a tied 2+ cut is what a kick can roll onto.
- **Coupling — Rule 113.0 / 113.2.** Couple, then **stretch to verify the joint** before relying on it.
- **Kicking — Rule 113.4 / 113.5.**
  - 113.4 lists where kicking is **prohibited**; kicking is only allowed on listed tracks (here: the kickable subset).
  - 113.5(a): walkway clear; track flat/descending so cars don’t roll back and foul; equipment prevented from exiting either end; routing must prevent fouling a main track/siding/high‑risk location.
  - 113.5(a)(v): **the maximum that may be kicked at once is set by special instructions** (“maximum tonnage … by a Company‑approved process”). → the **GP limit modeled here: kick at most 5 empties, or 3 if any are loaded** (special instruction; confirm exact figures with the SME).
  - 113.5(b): hand brakes used to control kicked cars must first be **verified operational**.
  - You only kick onto a **secured standing cut of 2+ cars** — never an empty or short track.
- **Fouling — Rule 114 (Fouling other tracks).** Equipment left standing must be **clear of the clearance (foul) point**; a cut parked too close to its switch fouls the converging route. → the per‑track clearance point + the lead clearance.
- **Shoving — Rule 115.** Point protection / line and protect the route before shoving.
- **Speed — Rule 105 (Operation on non‑main track).** Movements on non‑main track operate at **REDUCED speed**, prepared to stop short of the end of track; **105(b): must not exceed 15 MPH** unless special instructions provide otherwise. (Definitions: *REDUCED* = stop within ½ the range of vision; *RESTRICTED* = also stop short of a switch not properly lined, never exceeding SLOW = 15 MPH.) → label the yard as **15 MPH / Reduced speed**; the engineer never runs faster than that.
- **Running switch — Rule 113.6** (≥ 3 crew) — out of scope for v1, note for later.

### Clearance / foul model
- Each body track has a **clearance point** a short distance out from its switch (drawn as a small tick). A cut whose throat car would sit closer than that **fouls** — the move is refused (CROR 114).
- The **lead/drill holds a limited length** of cars clear of the ladder. A PULL that wouldn’t clear the switch is refused (“not enough room to clear the switch”). The engine parks the cut clear of the points (CROR 104(c)/114).

---

## 6. Loaded / empty & blocking (the “don’t mix” rules)

Real classification: **loads and empties don’t mix.** Loads go to a destination/customer; empties go to an industry to be filled. A properly built outbound is **blocked** — loads together, empties together (and in station/track order on the road).

Rules this game teaches (some are operating practice / special instructions — **confirm exact wording with the SME**, do not present as numbered CROR unless verified):

- **Keep loaded and empty separate when you can** — build the outbound as clean blocks.
- **Kick limits by load state** — at most **5 empties / 3 loaded** kicked at once (special instruction under 113.5(a)(v)).
- **No kicking loaded cars into empty cars** *(SME rule, to confirm and pin down precisely)* — loaded equipment has handling restrictions; the game should enforce and explain it once specified. Until confirmed, treat as a curriculum rule to be added with its exact wording + citation.

The win condition for outbound jobs is the **correct block** (set of cars first; later, exact order — see curriculum).

---

## 7. Inbound / outbound (road jobs)

- **Inbound:** a long road train (~20 cars) **arrives from the top‑right** on the main line, **sets out a couple of cars** to a yard track (ties them down), and **runs through, exiting bottom‑left.** It does *not* leave its whole consist — just the block destined here.
- **You are the waiting outbound:** you already hold a partial consist on a track. You **pick up the set‑out cars**, add them to your cut (blocking loads/empties correctly), **finish the build**, and **depart out the bottom‑left.**
- The arrival and the departure are animations; the switching in between is the normal game. The set‑out is the seed; the departure is the win.

---

## 8. The curriculum — ramp the rules (KEY design)

The game **starts dead simple and introduces one rule at a time.** Each new rule gets a teaching puzzle, then reinforcement. A puzzle (or tier) declares which rules are **active**; inactive rules are hidden from the UI and the scorer so a beginner isn’t overwhelmed.

Suggested ramp (each stage = a tier; cite the rule when it’s introduced):

0. **The yard & the move** — *every car identical (treat all as loaded; no empty distinction), no kicking, no clearance refusals beyond the obvious.* Learn: line a switch (104), PULL, SPOT, read the ladder, and **fewest moves**. One engine, one cut, set a car out.
1. **Digging & order** — buried cars, build a specific set on a track; the lead only holds so much (clearance, 114) so you stage it. Still no kicking.
2. **Securing & kicking** — 2+ cuts tie down (112); introduce KICK onto a tied cut (113.4/113.5); kicking saves a coupling but **never costs a move**.
3. **Don’t foul the points** — the clearance point becomes strict (114 / 104(c)); over‑stuffing a track is refused; restore switches to normal (104(h)).
4. **Loads & empties** — introduce the loaded/empty distinction (solid vs hollow); **keep them separate / block them**; **kick limits 5 empties / 3 loaded** (113.5 s.i.); **no kicking loaded into empty** (SME rule). 
5. **Car types & length** — autoracks/lumber are longer; the lead holds fewer; clearance is length‑aware.
6. **Road jobs** — inbound sets out, you build the outbound and depart (§7).
7. **Outbound manifest** — build the outbound in **exact blocking order** (loads block, then empties; or station order), not just the right set.

Always present in the chrome (cite, don’t quiz): **yard speed 15 MPH / Reduced (105)**, **clearance points (114)**, **switches lined & restored normal (104)**.

---

## 9. Data model & tech spec

Single‑file (or small) vanilla‑JS + Canvas 2D. No framework, no build step (GitHub Pages friendly). Web Audio for sound (no asset files).

### State
```
state = {
  tracks: { AS71:[label,…], … },   // throat→deep order
  engine: [label,…],               // last = working/coupler end
  secured:{ AS71:bool, … },         // a 2+ cut left standing is tied (112)
  head:   { AS71:px, … },           // distance from the junction to the throat car's near edge
  loaded: { label:bool },           // load state per car
}
carLen(label)  // px from a type map: standard / lumber / autorack
```
Positions are derived: track car *k* centre = `junction + head + Σlen(0..k-1) + len(k)/2`; engine car *q* centre = `engS + ENGLEN/2 + Σlen(0..q-1) + len(q)/2`.

### Puzzle schema
```
{
  tier, title, hint,
  rules: ['line','pull','spot','kick','foul','loads','length','depart'],  // which rules are active
  start:  { AS73:['A','B'], … },          // pre-placed yard cars (your held consist + strays)
  loads:  ['A','B','C'],                  // which cars are loaded (deterministic); omit ⇒ all loaded (tier 0) or random
  inbound:{ cars:['C','D'], length:20, to:'AS74' },  // optional road set-out
  goal:   { track:'AS73', cars:[…], ordered?:true, depart?:true },
  par:    <min MOVES>,                    // computed by the solver
  opt:    [['pull','AS74',2], …],         // the min-move (then min-joint) line, for "Watch optimal"
}
```
`KICKABLE = {AS72:1, AS73:1}` (special instruction).

### Moves (pure functions on state)
`pull(T,n)`, `spot(T,n)`, `kick(T,n)` — each validates (lining, clearance/foul, lead length, kick legality + load limits) then mutates `tracks/engine/secured/head`. Securing: spotting a 2+ cut sets `secured`; pulling clears it. Joint cost per §5.

### Rendering
- One `draw()` from the model every frame: tracks, ladder, **main‑line extension to OUT (top‑right)**, switches (lined normal/reverse + clearance tick), standing cars (cumulative), engine + coupled cars (along `engRoute` at `engS`), and transient overlays (a kicked cut coasting; the inbound through‑train).
- Routes: drill route `[A,B,Jᵢ,bodyEnd]`; main route `[OUT,Jᵢ,bodyEnd]`; through route `[OUT,B,OFFLEFT]`. `polyAt` extrapolates `s<0`.
- Animations via `requestAnimationFrame`; a small step driver (`play([{dur,fn,done}], onAllDone)`). Slow‑mo factor for the “Watch optimal” replay.

### Solver & verification (do this for every puzzle)
- **Solver = BFS/Dijkstra over states, cost = (moves, then joints).** Returns **par (min moves)** and the optimal line (`opt`). Mirrors the *exact* engine rules (lining always satisfiable so it’s ignored for solvability; respects clearance/foul, lead length, kick legality + load limits, securing, the win rule).
- **Harness:** replay every puzzle’s `opt` through the live engine across many random rolls (offsets, load assignment) and assert it **wins at exactly par** with no foul/lead/kick‑limit violation. (Prototype ran 40 rolls × N puzzles, 0 failures.)
- Keep the solver as a throwaway Node script checked into `/tools`, rebuilt from the model when rules change.

### Sound
Synthesized Web Audio: coupling clunk, kick roll, points click, win chime, refusal buzz, train horn. Lazy `AudioContext` resumed on first gesture; 🔊/🔇 toggle persisted in `localStorage`.

### UI
Tier‑grouped puzzle picker; the **work order inside the top of the yard frame**; switch chips (touch‑friendly); move builder (act / count / track / Work it); **▶ Watch optimal** (auto‑lines + plays the min‑move line in slow motion); Reset; a one‑line note legend (clearance tick, loaded/empty, kick limit, yard speed); a How‑to‑play modal that **cites the rules it follows and why**.

---

## 10. Open questions / SME confirmations

1. **“No kicking loaded into empty”** — exact wording, scope (loads into empties? empties into loads? both?), and citation (CROR vs GP special instruction).
2. **Kick tonnage/car limits** — confirm 5 empties / 3 loaded for GP (113.5(a)(v) defers to special instruction).
3. **Kickable tracks** at GP — confirm the exact set + north/south end behaviour.
4. **Yard speed** — confirm 15 MPH / Reduced and any GP‑specific reductions; whether to surface speed as a mechanic or just a label.
5. **Outbound manifest order** — what blocking order a real GP outbound uses (loads/empties, station order).
6. **Securing specifics** — the hand‑brake chart (112) as an explicit mechanic later?

> Build it to the curriculum, verify every puzzle with the solver+harness, cite every rule, and keep the official CROR (this repo) as the source of truth.
