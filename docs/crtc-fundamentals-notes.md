# Canadian Rail Traffic Control — fundamentals digest

Digest of **`reference/2015_04_10-Robitaille-presentation-with-intro-slide.pdf`** — *Canadian Rail
Traffic Control Fundamentals*, Sean Robitaille (CN Transportation Engineer), William W. Hay Railroad
Engineering Seminar, University of Illinois, **April 10 2015**.

**Why it's here:** it nails the *operating language* and how the Canadian control methods fit
together — useful for getting the trainer's wording right. The PDF itself is **gitignored / local
only** (same policy as the rulebook). This file is a text digest so the value lives in the repo.

> ⚠️ **2015 — some facts are point-in-time.** Verify anything time-sensitive against the current
> CROR / CN GOI before repeating in the app. Flagged below with **[dated]**.

---

## The framework
- Canada runs on a **single national rulebook, the CROR (Canadian Rail Operating Rules)**, overseen
  by **Transport Canada** — one rule book for the whole country (evolved from the Uniform Code of
  Operating Rules, 1962).
- On top of the CROR, each railway issues **Railway Specific Instructions** — a company-tailored
  rulebook + the **Employee Time Table** — covering its own **subdivisions**, yards, and terminals,
  and naming the **method of control** in force on each.

## Control methods (the spine of the deck)
- **Non-main track** — governed by **CROR 105**; movement at **reduced speed** (able to stop in half
  the range of vision of equipment / red flag / end-of-track). A main track can be designated
  **Cautionary Limits (CROR 94)** and worked like yard track. Non-main-track switches are marked with
  **yellow targets** (yellow target = switch lined for the diverging route).
- **OCS — Occupancy Control System** (**CROR 301–315**): the most basic main-track authority; run
  trains at main-track speed with **no signal protection**. The **Rail Traffic Controller (RTC)**
  issues authority to occupy the main track; authority holds until the clearance is **fulfilled,
  cancelled, or superseded**. Limits are defined by identifiable features — **milepost, station sign,
  marked turnouts** (ends of sidings, junctions). Turnouts usually **hand-operated**. (CN's US
  equivalent: "Track Authority"; elsewhere "TWC".)
- **Signal overlay** — three signalled methods layer on top:
  - **ABS — Automatic Block Signals** (**CROR 505–515**): provides **broken-rail + following / head-on
    protection**; OCS still provides the *authority*. All signals carry **number plates**.
    **[dated]** deck says ABS was then used **only by CP** (single track ON/AB, double track ON/QC).
  - **CTC — Centralized Traffic Control** (**CROR 560–578**): **controlled signals** (RTC can hold at
    Stop) and **power switches** at **controlled locations**, with **intermediate signals** between.
    **Written authority** required to: **pass a controlled signal at Stop (CROR 564)**, work between
    defined signals, or enter the main track at a hand-operated switch. All signals **number-plated**.
  - **Interlocking** (**CROR 601–620**): four types — **manual** (special instruction), **locally
    controlled** (tower), **remotely controlled** (RTC), **automatic** (simple diamonds). **CROR 620**
    covers non-interlocked crossings / movable bridges.
- **SCS — Special Control System** (**CROR 351–353**): the framework for implementing *new* control
  methods (OCS itself was first introduced this way). **[dated]** no PTC mandate in Canada as of 2015.

## Signal aspects (ties straight into the Signal Reading module)
- Aspects & indications are **CROR 405–440 — a speed-signal system**.
- **Letter markers "L", "DV", "R"** are used to **upgrade certain indications**. This independently
  **confirms there is no "A" (absolute) plate** in Canada — the markers are L / DV / R only.

## Terms worth matching in the app's voice
RTC (Rail Traffic Controller) · subdivision · Employee Time Table · clearance (fulfilled / cancelled /
superseded) · controlled vs intermediate signal · number plate · controlled location · reduced speed ·
Cautionary Limits · hand-operated / power switch.
