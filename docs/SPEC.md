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

- **Car TYPES with real lengths (built 2026‑06‑18).** Each car has a type → length (px ≈ ft·0.84): **box ≈50 ft (42px) · hopper ≈56 (47) · tank ≈60 (50) · centerbeam/lumber ≈73 (61) · autorack/car‑carrier ≈89 (75).** Defined in `geometry.TYPES` (length + fill colour + tag); a car renders at its real size and is colour‑coded by type. Variety across the set (not every type on every puzzle), and **like cars grouped** in cuts (a string of tankers, a pair of autoracks…) the way a yard blocks them.
- **All position/foul/lead/spot maths are length‑aware** — `pos[]` near‑edges advance by each car's length; spot fit / shove cascade / capacity / lead‑clear all sum per‑car lengths. `state.type[label]` holds the type; `carLen(type)` the px. Layout DSL: `'MARK'` = box, `['MARK','type']` = typed (SPEC §9).
- **Loaded vs empty** (P4) — solid vs hollow; drives blocking and kick limits (§5, §6).
- **Car‑type kicking (P2, BUILT 2026‑06‑18):** **box & hopper are kickable; tank, autorack/car‑carrier, and centerbeam/lumber are NOT** (Jordan's SME call — high COG / dangerous goods / long loads). Enforced by `canKick` (`geometry.TYPES[t].kick`) and proven by the harness. *(Precise CROR/S.I. wording still good to confirm with the SME, but the practice is confirmed.)*

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

### State  *(as built 2026‑06‑18 — per‑car positions)*
```
state = {
  tracks: { AS71:[label,…], … },   // throat→deep order
  pos:    { AS71:[px,…],   … },     // PARALLEL to tracks: each car's near‑edge offset
                                    //   from the switch. Lets a track hold SEPARATED
                                    //   cuts (gaps), and a car only moves when pushed.
  engine: [label,…],               // cars held with the loco; [0] = nearest loco
  secured:{ AS71:bool, … },         // a 2+ cut left standing is tied (112)
  lined:  { AS71:'normal'|'reverse', … },
  moves, joints, msg, won,
  // loaded:{label:bool} added at the loads tier (P4)
}
```
**Why per‑car `pos` (not a single `head`):** the earlier single‑gap model re‑laid every car from the throat each move, so cars *teleported* and you couldn't leave separations. With explicit positions a car moves **only when physically pulled or pushed** — PULL leaves the rest exactly where they sat; SPOT shoves only the cut it actually contacts. Track car *k* near‑edge = `switchX + pos[id][k]`; engine car *q* centre = `engS + ENGLEN/2 + Σlen(0..q-1) + len(q)/2` along the engine route.

### Puzzle schema
```
{
  tier, title, hint,
  rules: ['line','pull','spot','kick','foul','loads','length','depart'],  // which rules are active
  start:  { AS73:[200,'A','B'], … },      // LAYOUT DSL: strings = cars (throat→deep),
                                          //   numbers = gaps in px. A leading number =
                                          //   how far off the switch the first car sits.
                                          //   [200,'A','B'] = a cut sitting deep;
                                          //   [60,'A',90,'B'] = a car, a 90px gap, a car
                                          //   (two separated cuts). Use it to place cuts
                                          //   DEEP and varied — never stacked at the throat.
  loads:  ['A','B','C'],                  // which cars are loaded (P4); omit ⇒ all loaded
  inbound:{ cars:['C','D'], length:20, to:'AS74' },  // optional road set-out (P6)
  goal:   { track:'AS73', cars:[…], ordered?:true, depart?:true },  // cars = the TRUTH
  listed: [{ listedMark, listedTrack, trueMark, trueTrack, error:'location'|'mark'|null }],
                                          // optional #7 switch list. What the paper says
                                          // (may be wrong); player flags bad lines + certifies
                                          // before moves unlock. The yard (start/goal) is truth.
  par:    <min MOVES>,                    // VERIFIED by the solver (see below)
  opt:    [['pull','AS74',2], …],         // the min-move (then min-joint) line, for "Watch optimal"
}
```
`KICKABLE` is a **special instruction**, declared **per puzzle** (a puzzle may shuffle it or have none) — see §11.1.

### Moves (operate on state)
`pull(T,n)`, `spot(T,n)`, `kick(T,n)` (kick = P2). Each is guarded by a **validator** (`canPull`/`canSpot`) that runs in `precheck` **before any animation**, so an illegal/fouling move is refused up front with a cited reason (the engineer protects the move — it never animates then fails).
- **PULL n:** couple the throat cut, pull n onto the lead. The cars left behind **keep their exact `pos`**. Refused if the cut won't clear the lead (lead foul, CROR 114 — the lead dead‑ends, can't shove back; cap = `LEAD_CAP`).
- **SPOT n:** shove the far n cars in at the throat. If there's room clear of the foul point, they couple in front of the standing cut (which **does not move**); otherwise the engine **shoves the standing cut deeper** just enough (`spotPlan()` cascades the push, preserving untouched separations). You **can** spot onto a standing/tied cut — refused only when the track is genuinely too full to shove back. Securing: a standing 2+ cut sets `secured`; pulling clears it. Joint cost per §5.

### Rendering
- One `draw()` from the model every frame: tracks, ladder, **main‑line extension to OUT (top‑right)**, switches (lined normal/reverse + clearance tick), standing cars (cumulative), engine + coupled cars (along `engRoute` at `engS`), and transient overlays (a kicked cut coasting; the inbound through‑train).
- Routes: drill route `[A,B,Jᵢ,bodyEnd]`; main route `[OUT,Jᵢ,bodyEnd]`; through route `[OUT,B,OFFLEFT]`. `polyAt` extrapolates `s<0`.
- Animations via `requestAnimationFrame`; a small step driver (`play([{dur,fn}], {onFrame,onDone})`). Slow‑mo factor for the “Watch optimal” replay.
- **No overlap / no magic sliding (as built):** the loco always trails on the *lead* side of its cut and **stops at the coupling point** — it never drives past it into standing cars. A cut being shoved by a SPOT is **contact‑gated**: the standing cars don't start sliding until the loco's cut actually reaches them. At rest the loco backs off via `restS(cutLen)` so its held cut stays clear of the ladder foot. Labels render on dark pills so nothing on the canvas obscures them.

### Solver & verification (do this for every puzzle)
- **Robust set of FIXED, authored puzzles — NOT runtime generation.** We abandoned par‑per‑seed / random generation (2026‑06‑18, Jordan's call): it forced a search prune that made *clear‑a‑track* puzzles impossible, and par‑per‑seed was hard to verify reliably. Instead we ship many hand‑authored puzzles, each with `par`/`opt` baked in and **solver‑verified**.
- **Solver (`src/solver.js`, shared by browser‑none + the Node harness) = Dijkstra over states, cost = (moves, then joints).** It **imports the real `src/model.js`** (Node ESM, no DOM) and applies the actual `pull`/`spot` — zero divergence from the game. Sound prune for **build‑a‑track** goals: only pull tracks holding a goal car (or the goal track when it still holds a blocker), and only spot to the goal *or* (while stashing a non‑goal car) anywhere — so it solves **gather, clear‑a‑track, and dig** puzzles fast without exploring every distractor.
- **Authoring + CI:** `node tools/solve.mjs` solves & verifies every puzzle; `--print` prints `par`/`opt` to bake into `puzzles.js`. It fails (exit 1) if any baked par/opt isn't optimal or `opt` doesn't win at par. Repo has `package.json {"type":"module"}` for ESM imports (static site unaffected).

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

---

## 11. Decisions locked — 2026‑06‑18 build interview

First ground‑up build = **polished P0–P2 vertical slice** (not the full P0–P7 arc): yard, switch lining (104), PULL/SPOT/KICK, securing (112), move‑first score + joints counter, solver + replay‑harness, ~4–6 verified puzzles. Then extend tier by tier.

- **Yard:** simplified single‑lead 6‑track teaching ladder (AS71–76), labelled honestly as a teaching schematic. Faithful GP yard (AS65–78) = optional later tier.
- **Identity:** fresh rail‑ops look (charcoal schematic, **yellow diverging target**, signal‑style accents). **Desktop‑first** — this is a professional training tool, not a phone game.
- **Architecture:** ES modules from day one, no build step (GitHub Pages friendly).

### 11.1 Rule taxonomy — CROR vs Special Instruction (KEY — Jordan's call)
Every rule the game surfaces is tagged as one of two kinds, **visually distinct**, and the difference is taught from the **very first puzzle**:

- **CROR** — the national rulebook (104, 105, 112, 113.x, 114, 115). Universal, applies everywhere.
- **SPECIAL INSTRUCTION (S.I.)** — yard‑specific, issued per terminal; **must be learned for YOUR yard.** Examples here: kickable‑track set, kick limits, yard‑speed specifics, the 2‑hand‑brake‑to‑kick rule.

Special instructions are **hammered in** (loud amber badge, called out the first time they appear) but **not overused** — reserved for the genuinely yard‑specific.

**Kickable tracks are a special instruction**, so they are **per‑puzzle configurable**: a puzzle can shuffle the kickable set or have **none at all** (no kicking permitted here). This is deliberate — the player must **read the S.I. each puzzle**, never assume "AS72/73 = kickable" as if it were a rule.

### 11.2 §10 open questions — resolved
1. **Kick limit (5 empties / 3 loaded):** **deferred to P4** (loaded/empty doesn't exist until then). Confirmed by the CSV — limits are **local special instructions** (some yards "2 loads, empties unrestricted"; others "5, max 3 loads"; outposts "4 regardless"). Apply via the per‑puzzle S.I., never hardcoded.
2. **Kickable tracks:** **special instruction, per‑puzzle** (§11.1).
3. **Yard speed:** **not a mechanic** — but **listed / visually represented** in the chrome.
4. **2‑hand‑brake‑to‑kick:** **cited S.I. note** for the slice; explicit mechanic later.

### 11.3 Speeds to represent (list + animation feel, NOT a control)
- **Yard / non‑main track: REDUCED, ≤ 15 MPH** — **CROR 105** (verified).
- **Kicking: ≤ 10 MPH** — ⚠ **verify exact CROR citation** against the Jan 2025 PDF before showing as cited (CSV/forum‑sourced; not yet rulebook‑verified — keep out of player UI until verified).
- **Coupling impact: ≤ 4 MPH** — ⚠ same caveat (verify before citing).
- **Never kick uphill** — **CROR 113.5(a)** (track flat/descending so cars don't roll back/foul); reinforced by CN's post‑Melville‑Yard prohibition (TSB).
- **Some cars can't be kicked at all** (car‑type/equipment restriction) — P4+/car‑types tier; **CROR 113.4** + S.I.

> **Source discipline:** cite the **CROR** for what the game enforces; label **S.I.** clearly; **never** put forum/Reddit text in the player‑facing UI. Verify every speed/figure against the Jan 2025 CROR PDF before it ships as a citation.

---

## 12. The instinct curriculum — what the game is really building (Jordan's call)

Every mechanic exists to drill a **conductor's instinct**. This is the spine; the tiers (§8) and the rules (§5) are how each instinct gets taught and reinforced.

1. **Identify the car by its marking — don't trust the switch list.** The work order / switch list will sometimes be **wrong**; you go by the equipment actually on the ground, not the paper. → *yards are full of look‑alike cars (the difficulty is reading them); the switch list is deliberately wrong sometimes and you must catch it* (mechanic #7).
2. **Always know the special instructions.** S.I. are yard‑specific and you must learn YOUR yard's — they're visually distinct and per‑puzzle (kickable tracks, kick limits, yard speed). → §11.1.
3. **Never foul a switch — especially the lead.** Use all the space; don't leave a cut close to a foul point. → foul refusal before the move; shove the cut back to make room; the lead foul can't be shoved (CROR 114).
4. **Use as few MOVES as possible.** Moves are the score; par is the minimum. → §2.
5. **Minimize JOINTS, but they're often unavoidable** (especially in setups). Couplings cost time; fewer is cleaner, but you never add a *move* to save a joint. → §2, second counter.

## 13. As‑built rules & constants (2026‑06‑18)

- **Cars only move when pushed/pulled.** Per‑car positions (§9). PULL leaves the rest put; SPOT shoves only the cut it contacts (contact‑gated animation).
- **Shove‑back (SME rule, Jordan):** you *can* spot onto a standing/tied cut — the engine shoves it deeper to make room. It's poor practice to leave cars near the foul point; **use all the space.** Refused only when the track is too full to shove back.
- **Foul refused before animating** via `canPull`/`canSpot` in `precheck` (cited reason). Lead foul = `LEAD_CAP` (lead dead‑ends).
- **Full, varied yards from the 2nd level on:** cuts sitting deep; mix of empty / a pair / a long cut / separated cuts; never stacked at the throat. Authored via the layout DSL (§9).
- **Constants (px):** `CARLEN 42` (≈50 ft), `ENGLEN 64`, `CLEAR 30` (foul point), `TRACK_HEAD / SPOT_CLEAR 44` (clears the foul point), `LEAD_CAP 12` cars.
- **#7 "don't trust the switch list" (built 2026‑06‑18):** puzzles can carry a `listed` order that's wrong (**wrong location** or **look‑alike number**). The work‑order panel becomes an interactive checklist — the player taps the bad lines and **certifies** before any move unlocks ("Both": flag *then* work). A blind/incorrect certify is refused with the reason (e.g. "AS75 has no CN 318044"); a correct one reveals the truth and enables the job. Read the equipment, not the paper.
- **KICK (P2, BUILT 2026‑06‑18) — proven as law.** `kick(T,n)` / `canKick`: legal iff route lined (104) + T is a **kickable track** (per‑puzzle S.I., `state.kickable`, marked ⚡) + T holds a **secured 2+ cut** (112) + every kicked car is a **kickable type** (box/hopper). Kick = **0 joints**, 1 move — the clean way to build, so the solver picks it. No count limit yet (P4, load‑based). The Node harness asserts illegal kicks (non‑kickable track / unsecured cut / tank car) are **refused**, and that the solver chooses kick (p2‑kick: par 2, 1 joint).
- **Status (2026‑06‑18):** P0 + clear/dig + #7 + car types + **kicking** playable & verified. **7 authored puzzles**, all solver‑verified + kick‑rule tests pass. Runtime generation abandoned. Pending mechanics to flesh out before the big puzzle push: **loads/empties + blocking (P4)**, **road jobs (P6)**, **manifest order (P7)**. Then expand to ~4 puzzles per layer. GitHub Pages: enabled (push to go live).
