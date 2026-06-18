// puzzles.js — rule registry + the authored puzzle set. Fixed puzzles (no runtime
// generation); every par/opt is solver-verified by tools/solve.mjs.
//
// Layout DSL (start[id]): number = gap px (leading number = how far off the switch
// the first car sits); 'MARK' = box car; ['MARK','type'] = typed; ['MARK','type','E']
// = empty. Like cars grouped in cuts. Difficulty ramps: Tier 0 modest intros
// (gathers, 4-6 car cuts), Tier 1+ meaty (dig / sort / clear / messy yards).

export const RULES = {
  line:   { kind: 'cror', cite: 'CROR 104',          label: 'Line & examine the switch for your route' },
  speed:  { kind: 'cror', cite: 'CROR 105',          label: 'Yard speed — REDUCED, ≤ 15 MPH' },
  couple: { kind: 'cror', cite: 'CROR 113.0 / 113.2', label: 'Couple, then stretch to verify the joint' },
  shove:  { kind: 'cror', cite: 'CROR 115',          label: 'Shove only with the route lined & protected' },
  verify: { kind: 'si',   cite: 'Switch list',        label: 'Verify cars by their markings — the list can be wrong' },
  secure: { kind: 'cror', cite: 'CROR 112',           label: 'A standing cut of 2+ cars is tied down (secured)' },
  kick:   { kind: 'cror', cite: 'CROR 113.4 / 113.5', label: 'Kick only onto a secured cut; not every car can be kicked' },
  kickable: { kind: 'si', cite: 'Kickable tracks',    label: 'Kick only where the special instruction allows (⚡)' },
  loads:  { kind: 'si',   cite: 'Loads & empties',     label: 'Solid = loaded, hollow = empty. Don’t kick a load into empties; kick ≤5 (≤3 loaded)' },
  order:  { kind: 'si',   cite: 'Manifest / blocking', label: 'Build the outbound in order, then DEPART out the lead' },
};

export const PUZZLES = [
  // ---- Tier 0 — learn the move (modest gathers, bigger cuts) ----
  {
    id: 'p0-1', tier: 0,
    title: 'Make up the cut',
    hint: 'Your four cars are split across AS72 and AS73. PULL one pair, PULL the other onto the same cut, then SPOT all four onto AS75. Three moves.',
    rules: ['line', 'speed', 'couple', 'shove'],
    start: {
      AS72: [180, 'CN 411002', 'CN 411040'],
      AS73: [200, 'GATX 88110', 'GATX 88128'],
      AS76: [200, 'TILX 66108', 'TILX 66280'],
    },
    goal: { track: 'AS75', cars: ['CN 411002', 'CN 411040', 'GATX 88110', 'GATX 88128'] },
    par: 3,
    opt: [['pull', 'AS73', 2], ['pull', 'AS72', 2], ['spot', 'AS75', 4]],
  },
  {
    id: 'p0-2', tier: 0,
    title: 'Add to the cut',
    hint: 'AS73 already holds a three-car cut sitting deep. Bring the two off AS71 and the one off AS72 onto your engine, then SPOT all three in front of it. Three moves.',
    rules: ['line', 'speed', 'couple', 'shove'],
    start: {
      AS73: [260, 'CN 198450', 'CN 198212', 'CN 198330'],
      AS71: [180, 'BNSF 7244', 'CP 388190'],
      AS72: [200, 'UTLX 90113'],
      AS75: [220, ['CEFX 2019', 'autorack'], ['CEFX 2044', 'autorack']],
    },
    goal: { track: 'AS73', cars: ['CN 198450', 'CN 198212', 'CN 198330', 'BNSF 7244', 'CP 388190', 'UTLX 90113'] },
    par: 3,
    opt: [['pull', 'AS71', 2], ['pull', 'AS72', 1], ['spot', 'AS73', 3]],
  },
  {
    id: 'p0-3', tier: 0,
    title: 'Across the ladder',
    hint: 'Three cars up on AS76, two on AS72 — all five build on AS71. Line each route (the deep switch reverse, the rest normal), gather them, and SPOT. Three moves.',
    rules: ['line', 'speed', 'couple', 'shove'],
    start: {
      AS76: [180, 'CN 210044', 'CN 210052', 'CN 210066'],
      AS72: [200, 'GATX 55110', 'GATX 55308'],
      AS74: [220, ['TILX 4410', 'tank'], ['TILX 4428', 'tank']],
    },
    goal: { track: 'AS71', cars: ['CN 210044', 'CN 210052', 'CN 210066', 'GATX 55110', 'GATX 55308'] },
    par: 3,
    opt: [['pull', 'AS72', 2], ['pull', 'AS76', 3], ['spot', 'AS71', 5]],
  },
  {
    id: 'p0-4', tier: 0,
    title: 'Make up the train',
    hint: 'Five cars on three tracks all go to AS74. Gather them onto your engine — fewest trips — then SPOT the whole cut. Four moves.',
    rules: ['line', 'speed', 'couple', 'shove'],
    start: {
      AS71: [180, 'BNSF 8801', 'BNSF 8829'],
      AS72: [200, 'CP 77012', 'CP 77040'],
      AS75: [220, 'CN 41002'],
      AS76: [200, ['ETTX 9001', 'autorack']],
    },
    goal: { track: 'AS74', cars: ['BNSF 8801', 'BNSF 8829', 'CP 77012', 'CP 77040', 'CN 41002'] },
    par: 4,
    opt: [['pull', 'AS75', 1], ['pull', 'AS72', 2], ['pull', 'AS71', 2], ['spot', 'AS74', 5]],
  },

  // ---- Tier 1 — work it (dig / sort / clear / messy) ----
  {
    id: 'p1-dig', tier: 1,
    title: 'Dig out the block',
    hint: 'CN 720019 and 720037 are buried behind two cars on AS71. Pull the blockers off and stash them clear, get your cars, add CN 720055 from AS73, and build AS75.',
    rules: ['line', 'speed', 'couple', 'shove'],
    start: {
      AS71: [160, 'TILX 4410', 'TILX 4428', 'CN 720019', 'CN 720037'],
      AS73: [200, 'CN 720055', 'GATX 9100'],
      AS72: [240, ['UTLX 5511', 'tank'], ['UTLX 5528', 'tank'], ['UTLX 5544', 'tank']],
      AS76: [200, ['CEFX 4410', 'autorack'], ['CEFX 4428', 'autorack']],
    },
    goal: { track: 'AS75', cars: ['CN 720019', 'CN 720037', 'CN 720055'] },
    par: 4,
    opt: [['pull', 'AS71', 4], ['pull', 'AS73', 1], ['spot', 'AS75', 3], ['spot', 'AS71', 2]],
  },
  {
    id: 'p1-sort', tier: 1,
    title: 'Build it in order',
    hint: 'AS72 holds four cars in the WRONG order for your manifest. Build AS74 in order — CN 305001, 305002, 305003, 305004 (front to back) — which means handling them one at a time.',
    rules: ['order', 'line', 'speed', 'couple', 'shove'],
    start: {
      AS72: [200, 'CN 305004', 'CN 305003', 'CN 305002', 'CN 305001'],
      AS71: [200, ['GATX 6610', 'hopper'], ['GATX 6628', 'hopper']],
      AS76: [200, ['UTLX 8810', 'tank'], ['UTLX 8828', 'tank']],
    },
    goal: { track: 'AS74', cars: ['CN 305001', 'CN 305002', 'CN 305003', 'CN 305004'], ordered: true },
    par: 8,
    opt: [['pull', 'AS72', 1], ['spot', 'AS74', 1], ['pull', 'AS72', 1], ['spot', 'AS74', 1], ['pull', 'AS72', 1], ['spot', 'AS74', 1], ['pull', 'AS72', 1], ['spot', 'AS74', 1]],
  },
  {
    id: 'p1-clear', tier: 1,
    title: 'Clear the build track',
    hint: 'AS74 is your build track, but a three-car cut is sitting on it. Pull it off and stash it clear, then bring CN 480012 / 480044 (AS72) and CN 480066 (AS73) and build AS74.',
    rules: ['line', 'speed', 'couple', 'shove'],
    start: {
      AS74: [140, ['DTTX 9001', 'autorack'], ['DTTX 9028', 'autorack'], ['DTTX 9044', 'autorack']],
      AS72: [180, 'CN 480012', 'CN 480044'],
      AS73: [200, 'CN 480066'],
      AS71: [200, ['UTLX 7120', 'tank'], ['UTLX 7148', 'tank']],
    },
    goal: { track: 'AS74', cars: ['CN 480012', 'CN 480044', 'CN 480066'] },
    par: 5,
    opt: [['pull', 'AS74', 3], ['pull', 'AS73', 1], ['pull', 'AS72', 2], ['spot', 'AS74', 3], ['spot', 'AS76', 3]],
  },
  {
    id: 'p1-messy', tier: 1,
    title: 'Work the yard',
    hint: 'Busy yard. CN 501001 is buried behind a car on AS72; CN 501002 and 501003 sit at the throats of AS73 and AS71 (each with a stray behind it). Dig the buried one out, gather the others, and build AS75 — leave the strays be.',
    rules: ['line', 'speed', 'couple', 'shove'],
    start: {
      AS72: [180, 'WFRX 3300', 'CN 501001'],
      AS73: [220, 'CN 501002', 'GATX 1120'],
      AS71: [180, 'CN 501003', 'TILX 8800'],
      AS76: [200, ['CEFX 9001', 'autorack']],
    },
    goal: { track: 'AS75', cars: ['CN 501001', 'CN 501002', 'CN 501003'] },
    par: 5,
    opt: [['pull', 'AS72', 2], ['pull', 'AS71', 1], ['pull', 'AS73', 1], ['spot', 'AS75', 3], ['spot', 'AS72', 1]],
  },

  // ---- mechanic demos (kept compact; their tiers get the meaty pass later) ----
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
    hint: 'AS73 holds a tied-down cut and is a kickable track (⚡). Bring the two box cars off AS71 and KICK them onto the cut — a kick makes no coupling. (The tankers/autoracks can NOT be kicked.)',
    rules: ['kickable', 'secure', 'kick', 'line', 'speed', 'couple', 'shove'],
    kickable: ['AS73'],
    start: {
      AS73: [200, 'CN 445010', 'CN 445028'],
      AS71: [140, 'CN 661012', 'CN 661140'],
      AS72: [260, ['UTLX 70210', 'tank'], ['GATX 4408', 'tank']],
      AS75: [220, ['ETTX 90120', 'autorack'], ['BNSF 5012', 'autorack']],
      AS76: [180, ['CN 33120', 'hopper'], ['CN 33148', 'hopper']],
    },
    goal: { track: 'AS73', cars: ['CN 445010', 'CN 445028', 'CN 661012', 'CN 661140'] },
    par: 2,
    opt: [['pull', 'AS71', 2], ['kick', 'AS73', 2]],
  },
  {
    id: 'p4-loads', tier: 4,
    title: 'Loads & empties',
    hint: 'Solid cars are loaded, hollow are empty. AS73 holds a tied cut of EMPTIES (kickable ⚡). Bring the two empty box cars off AS71 and KICK them on. The loaded cars can’t be kicked into empties — and never kick more than 5 (max 3 loaded).',
    rules: ['loads', 'kickable', 'secure', 'kick', 'line', 'speed', 'couple', 'shove'],
    kickable: ['AS73'],
    start: {
      AS73: [200, ['CN 70010', 'hopper', 'E'], ['CN 70028', 'hopper', 'E']],
      AS71: [140, ['CN 81002', 'box', 'E'], ['CN 81044', 'box', 'E']],
      AS72: [240, 'CN 55120', 'CN 55148'],
      AS75: [220, ['ETTX 9001', 'autorack']],
      AS76: [200, ['UTLX 3300', 'tank']],
    },
    goal: { track: 'AS73', cars: ['CN 70010', 'CN 70028', 'CN 81002', 'CN 81044'] },
    par: 2,
    opt: [['pull', 'AS71', 2], ['kick', 'AS73', 2]],
  },
  {
    id: 'p6-road', tier: 6,
    title: 'Build the outbound & depart',
    hint: 'A road train set out CN 401002 & 401003 on AS73. Build your outbound in MANIFEST ORDER — CN 401001 (head), then 401002, then 401003 — onto your train. It stays coupled; don’t set it down — just call Depart ▸ to leave out the lead.',
    rules: ['order', 'line', 'speed', 'couple', 'shove'],
    inbound: { cars: ['CN 401002', 'CN 401003'], to: 'AS73' },
    start: {
      AS72: [180, 'CN 401001'],
      AS73: [200, 'CN 401002', 'CN 401003'],
      AS71: [160, ['GATX 5510', 'tank'], ['GATX 5528', 'tank']],
      AS75: [220, ['CN 88010', 'hopper', 'E'], ['CN 88028', 'hopper', 'E']],
      AS76: [180, ['ETTX 7001', 'autorack']],
    },
    goal: { cars: ['CN 401001', 'CN 401002', 'CN 401003'], ordered: true, depart: true },
    par: 2,
    opt: [['pull', 'AS72', 1], ['pull', 'AS73', 2]],
  },
];
