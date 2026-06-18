// puzzles.js — the rule registry (CROR vs Special Instruction) and the P0 puzzles.
// Each puzzle declares which rules are ACTIVE so a beginner isn't overwhelmed
// (SPEC §8). par is hand-set for P0; the solver/harness will own par from P1 on.

// kind drives the visual badge: 'cror' = neutral, 'si' = loud amber (must learn
// for YOUR yard). The taxonomy is taught from the very first puzzle (SPEC §11.1).
export const RULES = {
  line:   { kind: 'cror', cite: 'CROR 104',          label: 'Line & examine the switch for your route' },
  speed:  { kind: 'cror', cite: 'CROR 105',          label: 'Yard speed — REDUCED, ≤ 15 MPH' },
  couple: { kind: 'cror', cite: 'CROR 113.0 / 113.2', label: 'Couple, then stretch to verify the joint' },
  shove:  { kind: 'cror', cite: 'CROR 115',          label: 'Shove only with the route lined & protected' },
  // later tiers: secure (CROR 112), kick (113.4/113.5) — kickable set is an S.I.
};

export const PUZZLES = [
  {
    id: 'p0-1',
    tier: 0,
    title: 'First job — line, pull, spot',
    hint: 'Line AS72 reverse (the rest stay normal), PULL both cars onto the lead, then line AS74 and SPOT them. Two moves is par.',
    rules: ['line', 'speed', 'couple', 'shove'],
    start: { AS72: [110, 'BNSF 4471', 'CN 219003'] },   // sitting back off the switch
    goal: { track: 'AS74', cars: ['BNSF 4471', 'CN 219003'] },
    par: 2,
    opt: [['pull', 'AS72', 2], ['spot', 'AS74', 2]],   // fewest-moves line (lining auto)
  },
  {
    id: 'p0-2',
    tier: 0,
    title: 'Add to the cut',
    hint: 'AS73 already holds a cut, sitting deep. Read the markings — the two cars for it are on AS71. PULL them, then SPOT onto AS73 (you can spot in front of a standing cut; the engine shoves it back if it needs room). Two moves. The rest of the yard is not your problem.',
    rules: ['line', 'speed', 'couple', 'shove'],
    // A working yard — cuts of varied size sitting deep, a separation, an empty
    // track. Numbers are gaps in px (a leading number sets how far off the switch
    // the first car sits). The job is small; the skill is picking the right two.
    start: {
      AS71: [120, 'BNSF 7244', 'CP 388190'],                                   // your two cars
      AS72: [360, 'UTLX 647122', 'GATX 90113', 'TILX 300214', 'CN 411552', 'PROX 44120'], // one long cut, deep
      AS73: [200, 'CN 198450', 'CN 198212'],                                   // the cut you're adding to
      AS74: [180, 'CEFX 2019', 'CN 76610', 160, 'CN 80214'],                   // two separated cuts
      AS75: [300, 'DTTX 728140', 'CN 8021'],                                   // a pair, sitting deep
      // AS76 left empty
    },
    goal: { track: 'AS73', cars: ['CN 198450', 'CN 198212', 'BNSF 7244', 'CP 388190'] },
    par: 2,
    opt: [['pull', 'AS71', 2], ['spot', 'AS73', 2]],
  },
];
