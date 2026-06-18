// model.js — the rules brain. State + moves (PULL / SPOT), switch lining (CROR
// 104), securing (112), win + grading. Score = MOVES (the goal); JOINTS =
// couplings (a second "also good" stat).
//
// Cars carry an explicit near-edge position (px from their switch), so a car only
// moves when it's physically pulled or pushed — never on its own — and a track can
// hold separated cuts (gaps between groups), not one block jammed at the throat.

import {
  TRACK_IDS, NTRACK, CARLEN, CLEAR, SPOT_CLEAR, LEAD_CAP, TRACK_RIGHT, switchPos,
} from './geometry.js';

// puzzle.start[id] is a layout list: strings are cars (throat→deep), numbers are
// gaps in px. A leading number sets the first car's near-edge offset from the
// switch (else SPOT_CLEAR). e.g. [200,'A','B'] = two cars sitting deep;
// [60,'A',90,'B'] = a car, a 90px gap, then another car (two separated cuts).
function layout(entries) {
  const cars = [], pos = [];
  let cursor = null;
  for (const e of entries) {
    if (typeof e === 'number') cursor = (cursor == null ? e : cursor + e);
    else { if (cursor == null) cursor = SPOT_CLEAR; cars.push(e); pos.push(cursor); cursor += CARLEN; }
  }
  return { cars, pos };
}

export function freshState(puzzle) {
  const tracks = {}, pos = {}, secured = {}, lined = {};
  for (let i = 0; i < NTRACK; i++) {
    const id = TRACK_IDS[i];
    const L = layout((puzzle.start && puzzle.start[id]) || []);
    tracks[id] = L.cars; pos[id] = L.pos;       // parallel arrays, throat→deep
    secured[id] = (puzzle.startSecured && puzzle.startSecured[id]) || tracks[id].length >= 2;
    lined[id] = 'normal';
  }
  return { tracks, pos, engine: [], secured, lined, moves: 0, joints: 0, msg: '', won: false };
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

// --- Spot planning (pure) -------------------------------------------------
// Where your n cars land, and how the standing cut shifts. Onto a standing cut:
// couple in front if there's room clear of the foul point; otherwise SHOVE the cut
// deeper just enough (cascading into deeper cuts only where it actually contacts
// them — separations that aren't touched are preserved).
export function spotPlan(state, id, n) {
  const P = state.pos[id];
  if (P.length === 0) {
    const yourPos = Array.from({ length: n }, (_, k) => SPOT_CLEAR + k * CARLEN);
    return { yourPos, newStanding: [], shove: false, deepEdge: SPOT_CLEAR + n * CARLEN };
  }
  const p0 = P[0];
  if (p0 - n * CARLEN >= CLEAR) {                          // room in front — cut stays put
    const yourPos = Array.from({ length: n }, (_, k) => p0 - (n - k) * CARLEN);
    return { yourPos, newStanding: P.slice(), shove: false, deepEdge: P[P.length - 1] + CARLEN };
  }
  const yourPos = Array.from({ length: n }, (_, k) => SPOT_CLEAR + k * CARLEN);
  const newStanding = []; let prevFar = SPOT_CLEAR + n * CARLEN;
  for (const op of P) { const np = Math.max(op, prevFar); newStanding.push(np); prevFar = np + CARLEN; }
  return { yourPos, newStanding, shove: true, deepEdge: newStanding[newStanding.length - 1] + CARLEN };
}

// --- Validators (no mutation) ---------------------------------------------
export function canPull(state, id, n) {
  const r = routeReady(state, id);
  if (!r.ok) return r;
  const have = state.tracks[id].length;
  if (n < 1) return { ok: false, msg: 'Pull at least one car.' };
  if (n > have) return { ok: false, msg: `${id} only has ${have} car${have === 1 ? '' : 's'} to pull.` };
  if (state.engine.length + n > LEAD_CAP)                  // CROR 114 — lead foul (dead-ends, can't shove)
    return { ok: false, msg: `The lead won't hold ${state.engine.length + n} cars clear of the ladder — won't clear the switch (CROR 114).` };
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
// PULL n: couple the throat cut, pull n cars onto the lead. Cars left behind keep
// their exact positions (they're not touched). +1 joint.
export function pull(state, id, n) {
  const v = canPull(state, id, n);
  if (!v.ok) return refuse(state, v.msg);
  const taken = state.tracks[id].splice(0, n);
  state.pos[id].splice(0, n);                              // remaining cars stay put
  state.engine.push(...taken);
  state.joints += 1;                                       // coupled on (CROR 113.0/113.2)
  if (state.tracks[id].length < 2) state.secured[id] = false;
  return commit(state, `Pulled ${n} from ${id}.`);
}

// SPOT n: shove the far n cars of the cut in at the throat (shoving any standing
// cut back only as far as needed). +1 joint if coupling onto standing cars.
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

function refuse(state, msg) { state.msg = msg; return { ok: false, msg }; }
function commit(state, msg) { state.moves += 1; state.msg = msg; return { ok: true, msg }; }

// --- Win + grade ----------------------------------------------------------
export function checkWin(state, puzzle) {
  const g = puzzle.goal;
  if (state.engine.length > 0) return false;
  const have = state.tracks[g.track].slice().sort();
  const want = g.cars.slice().sort();
  const same = have.length === want.length && have.every((c, k) => c === want[k]);
  if (same) state.won = true;
  return state.won;
}

export function grade(state, puzzle) {
  const par = puzzle.par;
  const m = state.moves, j = state.joints;
  const head = m <= par ? `Par! ${m} move${m === 1 ? '' : 's'}` : `${m} moves — par ${par}`;
  const bonus = `${j} coupling${j === 1 ? '' : 's'}`;
  return { head, bonus, beatPar: m <= par };
}
