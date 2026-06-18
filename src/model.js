// model.js — the rules brain. State + moves (PULL / SPOT), switch lining (CROR
// 104), securing (112), win + grading. Score = MOVES (the goal); JOINTS = couplings.
//
// Cars carry an explicit near-edge position (px from their switch) AND a TYPE with a
// real length — so a yard of mixed sizes (box / hopper / tank / centerbeam / autorack)
// lays out and works correctly, a car only moves when pushed, and tracks can hold
// separated cuts.

import { TRACK_IDS, NTRACK, CLEAR, SPOT_CLEAR, LEAD_CLEAR, TRACK_RIGHT, switchPos, carLen, kickableType } from './geometry.js';

export const lenOf = (state, label) => carLen(state.type[label]);
export const loadedOf = (state, label) => state.loaded[label] !== false;   // default loaded

// puzzle.start[id] is a layout list: a number = a gap in px (a leading number =
// how far off the switch the first car sits); a string = a box car by that mark;
// an [mark, type] pair = a car of that type. e.g.
//   AS72: [200, 'CN 41', ['GATX 90','tank'], ['TTGX 5','autorack']]
function layout(entries) {
  const cars = [], pos = [], types = {}, loads = {};
  let cursor = null;
  for (const e of entries) {
    if (typeof e === 'number') { cursor = cursor == null ? e : cursor + e; continue; }
    const mark = Array.isArray(e) ? e[0] : e;
    const type = Array.isArray(e) ? (e[1] || 'box') : 'box';
    const empty = Array.isArray(e) && (e[2] === 'E' || e[2] === 'empty');   // 3rd entry 'E' = empty
    if (cursor == null) cursor = SPOT_CLEAR;
    cars.push(mark); pos.push(cursor); types[mark] = type; loads[mark] = !empty;
    cursor += carLen(type);
  }
  return { cars, pos, types, loads };
}

export function freshState(puzzle) {
  const tracks = {}, pos = {}, secured = {}, lined = {}, type = {}, loaded = {};
  for (let i = 0; i < NTRACK; i++) {
    const id = TRACK_IDS[i];
    const L = layout((puzzle.start && puzzle.start[id]) || []);
    tracks[id] = L.cars; pos[id] = L.pos; Object.assign(type, L.types); Object.assign(loaded, L.loads);
    secured[id] = (puzzle.startSecured && puzzle.startSecured[id]) || tracks[id].length >= 2;
    lined[id] = 'normal';
  }
  // kickable tracks are a SPECIAL INSTRUCTION, per puzzle (may be none). The kick
  // count limit is also an S.I. — per puzzle, but the ceiling is always 5 total / 3
  // loaded (a puzzle may be stricter, never looser; Jordan's call).
  const kickable = puzzle.kickable ? puzzle.kickable.slice() : [];
  const kl = puzzle.kickLimit || {};
  const kickLimit = { total: Math.min(5, kl.total ?? 5), loaded: Math.min(3, kl.loaded ?? 3) };
  return { tracks, pos, type, loaded, engine: [], secured, lined, kickable, kickLimit, moves: 0, joints: 0, msg: '', won: false };
}

// --- Switch lining / route check (CROR 104) -------------------------------
export function lineSwitch(state, id) {
  state.lined[id] = state.lined[id] === 'reverse' ? 'normal' : 'reverse';
}

export function routeReady(state, id) {
  const i = TRACK_IDS.indexOf(id);
  if (state.lined[id] !== 'reverse')
    return { ok: false, msg: `${id} is lined normal — line its switch reverse for the track (CROR 104).` };
  for (let j = 0; j < i; j++) {
    if (state.lined[TRACK_IDS[j]] === 'reverse')
      return { ok: false, msg: `${TRACK_IDS[j]} is lined reverse — you'd divert into it before reaching ${id}. Line the intermediate switches normal (CROR 104).` };
  }
  return { ok: true, msg: '' };
}

// --- Spot planning (pure, length-aware) -----------------------------------
// Where your n cars land and how a standing cut shifts. Couple in front if there's
// room clear of the foul point, else SHOVE the cut deeper just enough (cascading
// only where it actually contacts cars — separations that aren't touched are kept).
export function spotPlan(state, id, n) {
  const P = state.pos[id], T = state.tracks[id];
  const yourCars = state.engine.slice(state.engine.length - n);
  const yourLens = yourCars.map((c) => lenOf(state, c));
  const yourTotal = yourLens.reduce((a, b) => a + b, 0);
  const placeYour = (nearEdge) => { const out = []; let c = nearEdge; for (const L of yourLens) { out.push(c); c += L; } return out; };
  const standingDeepEdge = (posArr) => (T.length ? posArr[T.length - 1] + lenOf(state, T[T.length - 1]) : 0);

  if (T.length === 0) {
    const yourPos = placeYour(SPOT_CLEAR);
    return { yourPos, newStanding: [], shove: false, deepEdge: SPOT_CLEAR + yourTotal };
  }
  const p0 = P[0];
  if (p0 - yourTotal >= CLEAR) {                       // room in front — cut stays put
    return { yourPos: placeYour(p0 - yourTotal), newStanding: P.slice(), shove: false, deepEdge: standingDeepEdge(P) };
  }
  const yourPos = placeYour(SPOT_CLEAR);               // shove the cut back
  const newStanding = []; let prevFar = SPOT_CLEAR + yourTotal;
  for (let k = 0; k < T.length; k++) { const np = Math.max(P[k], prevFar); newStanding.push(np); prevFar = np + lenOf(state, T[k]); }
  return { yourPos, newStanding, shove: true, deepEdge: standingDeepEdge(newStanding) };
}

// --- Validators (no mutation) ---------------------------------------------
export function canPull(state, id, n) {
  const r = routeReady(state, id);
  if (!r.ok) return r;
  const have = state.tracks[id].length;
  if (n < 1) return { ok: false, msg: 'Pull at least one car.' };
  if (n > have) return { ok: false, msg: `${id} only has ${have} car${have === 1 ? '' : 's'} to pull.` };
  const cutLen = [...state.engine, ...state.tracks[id].slice(0, n)].reduce((a, c) => a + lenOf(state, c), 0);
  if (cutLen > LEAD_CLEAR)                              // CROR 114 — lead foul (lead dead-ends, can't shove)
    return { ok: false, msg: `That cut is too long for the lead to hold clear of the ladder — won't clear the switch (CROR 114).` };
  return { ok: true, msg: '' };
}

export function canSpot(state, id, n) {
  const r = routeReady(state, id);
  if (!r.ok) return r;
  const have = state.engine.length;
  if (n < 1) return { ok: false, msg: 'Spot at least one car.' };
  if (n > have) return { ok: false, msg: `You're only holding ${have} car${have === 1 ? '' : 's'}.` };
  const plan = spotPlan(state, id, n);
  if (switchPos(TRACK_IDS.indexOf(id)).x + plan.deepEdge > TRACK_RIGHT)
    return { ok: false, msg: `${id} is too full to take ${n} more — no room to shove the cut back (CROR 114).` };
  return { ok: true, msg: '' };
}

// --- Moves ----------------------------------------------------------------
export function pull(state, id, n) {
  const v = canPull(state, id, n);
  if (!v.ok) return refuse(state, v.msg);
  const taken = state.tracks[id].splice(0, n);
  state.pos[id].splice(0, n);                          // remaining cars stay put
  state.engine.push(...taken);
  state.joints += 1;
  if (state.tracks[id].length < 2) state.secured[id] = false;
  return commit(state, `Pulled ${n} from ${id}.`);
}

export function spot(state, id, n) {
  const v = canSpot(state, id, n);
  if (!v.ok) return refuse(state, v.msg);
  const onto = state.tracks[id].length > 0;
  const plan = spotPlan(state, id, n);
  const taken = state.engine.splice(state.engine.length - n, n);
  state.tracks[id] = taken.concat(state.tracks[id]);
  state.pos[id] = plan.yourPos.concat(plan.newStanding);
  if (onto) state.joints += 1;
  if (state.tracks[id].length >= 2) state.secured[id] = true;
  return commit(state, `Spotted ${n} to ${id}.`);
}

// KICK n to T — shove and cut away; the cars coast onto a SECURED standing 2+ cut on
// a KICKABLE track. Same landing physics as SPOT but 0 joints (the efficiency win).
// Legal only where the rules allow it (CROR 113.4/113.5 + the yard's special instruction).
export function canKick(state, id, n) {
  const r = routeReady(state, id);
  if (!r.ok) return r;
  const have = state.engine.length;
  if (n < 1) return { ok: false, msg: 'Kick at least one car.' };
  if (n > have) return { ok: false, msg: `You're only holding ${have} car${have === 1 ? '' : 's'}.` };
  if (!state.kickable.includes(id))
    return { ok: false, msg: `${id} isn't a kickable track here — kicking is only allowed where the special instruction says (CROR 113.4).` };
  if (state.tracks[id].length < 2 || !state.secured[id])
    return { ok: false, msg: `You can only kick onto a secured standing cut of 2+ cars — ${id} isn't tied down (CROR 113.4/113.5).` };
  const kicked = state.engine.slice(state.engine.length - n);
  const bad = kicked.find((c) => !kickableType(state.type[c]));
  if (bad)
    return { ok: false, msg: `${bad} can't be kicked — that car type isn't kicked here (CROR 113.4 + special instruction).` };
  if (n > state.kickLimit.total)
    return { ok: false, msg: `Too many to kick at once — the limit here is ${state.kickLimit.total} (special instruction, CROR 113.5(a)(v)).` };
  if (kicked.filter((c) => loadedOf(state, c)).length > state.kickLimit.loaded)
    return { ok: false, msg: `Too many LOADED cars in one kick — at most ${state.kickLimit.loaded} loaded (special instruction).` };
  if (!loadedOf(state, state.tracks[id][0]) && kicked.some((c) => loadedOf(state, c)))
    return { ok: false, msg: `Don't kick a loaded car onto an empty cut — ${id}'s standing car is empty (special instruction).` };
  const plan = spotPlan(state, id, n);
  if (switchPos(TRACK_IDS.indexOf(id)).x + plan.deepEdge > TRACK_RIGHT)
    return { ok: false, msg: `${id} is too full to take ${n} more.` };
  return { ok: true, msg: '' };
}

export function kick(state, id, n) {
  const v = canKick(state, id, n);
  if (!v.ok) return refuse(state, v.msg);
  const plan = spotPlan(state, id, n);
  const taken = state.engine.splice(state.engine.length - n, n);
  state.tracks[id] = taken.concat(state.tracks[id]);
  state.pos[id] = plan.yourPos.concat(plan.newStanding);
  // no joint — the kicked cars coast on by themselves (that's the win vs spotting)
  state.secured[id] = true;                            // still a standing 2+ cut
  return commit(state, `Kicked ${n} to ${id}.`);
}

function refuse(state, msg) { state.msg = msg; return { ok: false, msg }; }
function commit(state, msg) { state.moves += 1; state.msg = msg; return { ok: true, msg }; }

// --- Win + grade ----------------------------------------------------------
const sameSet = (a, b) => { const x = a.slice().sort(), y = b.slice().sort(); return x.length === y.length && x.every((c, k) => c === y[k]); };
const sameOrder = (a, b) => a.length === b.length && a.every((c, k) => c === b[k]);

// "Complete":
//  • DEPART goal — the outbound rides on the ENGINE (you leave with it coupled, no
//    final spot). Engine holds the consist (in manifest order if `ordered`).
//  • otherwise — the consist is built on the goal track and the loco is empty.
// goal.ordered ⇒ exact order (manifest / blocking); else set. The Depart call is UI.
export function checkWin(state, puzzle) {
  const g = puzzle.goal;
  if (g.depart) return g.ordered ? sameOrder(state.engine, g.cars) : sameSet(state.engine, g.cars);
  if (state.engine.length > 0) return false;
  const have = state.tracks[g.track];
  return g.ordered ? sameOrder(have, g.cars) : sameSet(have, g.cars);
}

export function grade(state, puzzle) {
  const par = puzzle.par;
  const m = state.moves, j = state.joints;
  const head = m <= par ? `Par! ${m} move${m === 1 ? '' : 's'}` : `${m} moves — par ${par}`;
  const bonus = `${j} coupling${j === 1 ? '' : 's'}`;
  return { head, bonus, beatPar: m <= par };
}
