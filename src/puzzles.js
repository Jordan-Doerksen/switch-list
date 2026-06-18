// puzzles.js — rule registry + the authored puzzle set. Fixed puzzles (no runtime
// generation); every par/opt is solver-verified by tools/solve.mjs.
//
// Layout DSL (start[id]): number = gap px (leading number = how far off the switch
// the first car sits); 'MARK' = a box car; ['MARK','type'] = a typed car. Car types
// have real lengths (box 42 / hopper 47 / tank 50 / centerbeam 61 / autorack 75 px ≈
// their real footage) — like cars are grouped in cuts, the way a yard blocks them.

export const RULES = {
  line:   { kind: 'cror', cite: 'CROR 104',          label: 'Line & examine the switch for your route' },
  speed:  { kind: 'cror', cite: 'CROR 105',          label: 'Yard speed — REDUCED, ≤ 15 MPH' },
  couple: { kind: 'cror', cite: 'CROR 113.0 / 113.2', label: 'Couple, then stretch to verify the joint' },
  shove:  { kind: 'cror', cite: 'CROR 115',          label: 'Shove only with the route lined & protected' },
  verify: { kind: 'si',   cite: 'Switch list',        label: 'Verify cars by their markings — the list can be wrong' },
  secure: { kind: 'cror', cite: 'CROR 112',           label: 'A standing cut of 2+ cars is tied down (secured)' },
  kick:   { kind: 'cror', cite: 'CROR 113.4 / 113.5', label: 'Kick only onto a secured cut; not every car can be kicked' },
  kickable: { kind: 'si', cite: 'Kickable tracks',    label: 'Kick only where the special instruction allows (⚡)' },
  loads:    { kind: 'si', cite: 'Loads & empties',     label: 'Solid = loaded, hollow = empty. Don’t kick a load into empties; kick ≤5 (≤3 loaded)' },
  order:    { kind: 'si', cite: 'Manifest / blocking', label: 'Build the outbound in order, then DEPART out the lead' },
};

export const PUZZLES = [
  {
    id: 'p0-1', tier: 0,
    title: 'First job — line, pull, spot',
    hint: 'Line AS72 reverse (the rest stay normal), PULL both cars onto the lead, then line AS74 and SPOT them. Two moves is par.',
    rules: ['line', 'speed', 'couple', 'shove'],
    start: { AS72: [110, 'BNSF 4471', 'CN 219003'] },
    goal: { track: 'AS74', cars: ['BNSF 4471', 'CN 219003'] },
    par: 2,
    opt: [['pull', 'AS72', 2], ['spot', 'AS74', 2]],
  },
  {
    id: 'p0-2', tier: 0,
    title: 'Add to the cut',
    hint: 'AS73 already holds a cut, sitting deep. Read the markings — your two cars are on AS71. PULL them, then SPOT onto AS73. Two moves.',
    rules: ['line', 'speed', 'couple', 'shove'],
    start: {
      AS71: [120, 'BNSF 7244', 'CP 388190'],
      AS72: [360, ['UTLX 647122', 'tank'], ['UTLX 90113', 'tank'], ['GATX 300214', 'tank'], ['PROX 44120', 'tank']],
      AS73: [200, 'CN 198450', 'CN 198212'],
      AS74: [180, ['CEFX 2019', 'autorack'], 170, ['ETTX 80214', 'autorack']],
      AS75: [280, ['CN 728140', 'hopper'], ['CN 8021', 'hopper']],
    },
    goal: { track: 'AS73', cars: ['CN 198450', 'CN 198212', 'BNSF 7244', 'CP 388190'] },
    par: 2,
    opt: [['pull', 'AS71', 2], ['spot', 'AS73', 2]],
  },
  {
    id: 'p1-find', tier: 1,
    title: 'Find them in the yard',
    hint: 'Read the markings — the yard is full of look-alikes. You need CN 411552 and BNSF 7244 onto AS73. They are NOT the only "CN 4115xx" / "BNSF 7xxx" cars out there.',
    rules: ['verify', 'line', 'speed', 'couple', 'shove'],
    start: {
      AS71: [150, 'CN 411552', 'GATX 88012'],
      AS72: [200, ['CN 411562', 'tank'], ['UTLX 41155', 'tank'], ['PROX 90183', 'tank']],
      AS74: [220, 'BNSF 7244', 'CEFX 2019'],
      AS75: [200, ['BNSF 7424', 'hopper'], ['CN 411525', 'hopper'], ['BNSF 2744', 'hopper']],
      AS76: [160, ['TILX 30021', 'autorack'], ['TILX 30012', 'autorack']],
    },
    goal: { track: 'AS73', cars: ['CN 411552', 'BNSF 7244'] },
    par: 3,
    opt: [['pull', 'AS71', 1], ['pull', 'AS74', 1], ['spot', 'AS73', 2]],
  },
  {
    id: 'p1-clear', tier: 1,
    title: 'Clear the track, then build',
    hint: 'AS72 is your build track but two autoracks are sitting on it. Pull them off and stash them clear, then bring CN 244180 and CN 244205 from AS74 and build AS72.',
    rules: ['line', 'speed', 'couple', 'shove'],
    start: {
      AS72: [120, ['DTTX 651020', 'autorack'], ['TTGX 984112', 'autorack']],
      AS74: [140, 'CN 244180', 'CN 244205'],
      AS71: [200, ['GATX 88140', 'hopper'], ['UTLX 31207', 'hopper']],
      AS75: [240, ['PROX 7720', 'tank'], ['CEFX 41190', 'tank'], ['CN 90183', 'tank']],
    },
    goal: { track: 'AS72', cars: ['CN 244180', 'CN 244205'] },
    par: 4,
    opt: [['pull', 'AS72', 2], ['spot', 'AS76', 2], ['pull', 'AS74', 2], ['spot', 'AS72', 2]],
  },
  {
    id: 'p1-dig', tier: 1,
    title: 'Dig one out',
    hint: 'CN 502019 is buried behind WFRX 8830 on AS71 — pull the WFRX off and stash it before you can get your car. Then add CN 502044 from AS73 and build AS75.',
    rules: ['line', 'speed', 'couple', 'shove'],
    start: {
      AS71: [160, ['WFRX 8830', 'hopper'], 'CN 502019'],
      AS73: [180, 'CN 502044', 'GATX 71200'],
      AS72: [260, ['TILX 5510', 'tank'], ['CN 6033', 'tank'], ['UTLX 88123', 'tank']],
      AS76: [220, ['CEFX 41020', 'autorack'], ['PROX 9981', 'autorack']],
    },
    goal: { track: 'AS75', cars: ['CN 502019', 'CN 502044'] },
    par: 4,
    opt: [['pull', 'AS71', 2], ['pull', 'AS73', 1], ['spot', 'AS75', 2], ['spot', 'AS71', 1]],
  },
  {
    id: 'p2-list', tier: 2,
    title: 'Trust the marks, not the list',
    hint: 'The switch list is wrong somewhere. Walk the yard, check each listed car against what is actually on the track, flag the bad lines, then work the real cars onto AS73.',
    rules: ['verify', 'line', 'speed', 'couple', 'shove'],
    listed: [
      { listedMark: 'CN 318044', listedTrack: 'AS75', trueMark: 'CN 318044', trueTrack: 'AS71', error: 'location' },
      { listedMark: 'BNSF 5512', listedTrack: 'AS74', trueMark: 'BNSF 5521', trueTrack: 'AS74', error: 'mark' },
    ],
    start: {
      AS71: [150, 'CN 318044', 'GATX 6610'],
      AS74: [170, 'BNSF 5521', 'CEFX 9981'],
      AS72: [240, ['UTLX 70012', 'tank'], ['TILX 4408', 'tank'], ['CN 90231', 'tank']],
      AS75: [200, ['PROX 33120', 'hopper'], ['BNSF 5215', 'hopper']],
      AS76: [180, ['CN 318404', 'autorack'], ['DTTX 5012', 'autorack']],
    },
    goal: { track: 'AS73', cars: ['CN 318044', 'BNSF 5521'] },
    par: 3,
    opt: [['pull', 'AS71', 1], ['pull', 'AS74', 1], ['spot', 'AS73', 2]],
  },
  {
    id: 'p2-kick', tier: 2,
    title: 'Kick it on clean',
    hint: 'AS73 already holds a tied-down cut, and it is a kickable track (⚡). Bring the two box cars off AS71 and KICK them onto the cut — a kick makes no coupling, so it is the clean way to do it. (The tankers and autoracks on the other tracks can NOT be kicked.)',
    rules: ['kickable', 'secure', 'kick', 'line', 'speed', 'couple', 'shove'],
    kickable: ['AS73'],
    start: {
      AS73: [200, 'CN 445010', 'CN 445028'],                         // secured 2-car cut (kickable track)
      AS71: [140, 'CN 661012', 'CN 661140'],                         // your two box cars
      AS72: [260, ['UTLX 70210', 'tank'], ['GATX 4408', 'tank']],    // can't be kicked
      AS75: [220, ['ETTX 90120', 'autorack'], ['BNSF 5012', 'autorack']], // can't be kicked
      AS76: [180, ['CN 33120', 'hopper'], ['CN 33148', 'hopper']],
    },
    goal: { track: 'AS73', cars: ['CN 445010', 'CN 445028', 'CN 661012', 'CN 661140'] },
    par: 2,
    opt: [['pull', 'AS71', 2], ['kick', 'AS73', 2]],
  },
  {
    id: 'p4-loads', tier: 4,
    title: 'Loads & empties',
    hint: 'Solid cars are loaded, hollow are empty. AS73 holds a tied-down cut of EMPTIES (kickable ⚡). Bring the two empty box cars off AS71 and KICK them on. The loaded cars around the yard can’t be kicked into those empties — and you never kick more than 5 (max 3 loaded).',
    rules: ['loads', 'kickable', 'secure', 'kick', 'line', 'speed', 'couple', 'shove'],
    kickable: ['AS73'],
    start: {
      AS73: [200, ['CN 70010', 'hopper', 'E'], ['CN 70028', 'hopper', 'E']],   // secured EMPTY cut
      AS71: [140, ['CN 81002', 'box', 'E'], ['CN 81044', 'box', 'E']],         // your two empties
      AS72: [240, 'CN 55120', 'CN 55148'],                                     // loaded box (solid)
      AS75: [220, ['ETTX 9001', 'autorack']],                                  // loaded autorack
      AS76: [200, ['UTLX 3300', 'tank']],                                      // loaded tank
    },
    goal: { track: 'AS73', cars: ['CN 70010', 'CN 70028', 'CN 81002', 'CN 81044'] },
    par: 2,
    opt: [['pull', 'AS71', 2], ['kick', 'AS73', 2]],
  },
  {
    id: 'p6-road', tier: 6,
    title: 'Build the outbound & depart',
    hint: 'A road train set out CN 401002 & 401003 on AS73. Build your outbound in MANIFEST ORDER — CN 401001 (head), then 401002, then 401003 — so pick them up in that order onto your train. It stays coupled to you; don’t set it back down — just call Depart ▸ to leave out the lead.',
    rules: ['order', 'line', 'speed', 'couple', 'shove'],
    inbound: { cars: ['CN 401002', 'CN 401003'], to: 'AS73' },    // road train sets these out before you start
    start: {
      AS72: [180, 'CN 401001'],                                   // your head-end car
      AS73: [200, 'CN 401002', 'CN 401003'],                      // set out by the inbound (a block)
      AS71: [160, ['GATX 5510', 'tank'], ['GATX 5528', 'tank']],
      AS75: [220, ['CN 88010', 'hopper', 'E'], ['CN 88028', 'hopper', 'E']],
      AS76: [180, ['ETTX 7001', 'autorack']],
    },
    goal: { cars: ['CN 401001', 'CN 401002', 'CN 401003'], ordered: true, depart: true },
    par: 2,
    opt: [['pull', 'AS72', 1], ['pull', 'AS73', 2]],
  },
];
