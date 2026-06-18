// solver.js — the move-first solver, shared by the Node harness (tools/solve.mjs)
// and the browser (compute par + optimal line for a freshly-generated yard).
// Dijkstra over states, cost = (moves, then joints). It applies the REAL engine
// moves, so solver and game can never disagree. Lining is auto-satisfied per move.

import { freshState, pull, spot, kick, checkWin } from './model.js';
import { TRACK_IDS } from './geometry.js';

function clone(s) {
  const tracks = {}, pos = {}, secured = {}, lined = {};
  for (const t of TRACK_IDS) { tracks[t] = s.tracks[t].slice(); pos[t] = s.pos[t].slice(); secured[t] = s.secured[t]; lined[t] = s.lined[t]; }
  return { tracks, pos, type: s.type, kickable: s.kickable, engine: s.engine.slice(), secured, lined, moves: s.moves, joints: s.joints, msg: '', won: s.won };
}
function autoLine(s, id) { for (const t of TRACK_IDS) s.lined[t] = (t === id) ? 'reverse' : 'normal'; }
function key(s) { return TRACK_IDS.map((t) => s.tracks[t].join(',') + '@' + s.pos[t].join(',')).join(';') + '#' + s.engine.join(','); }

// binary min-heap on (moves, joints) — keeps the browser solve fast on full yards
class Heap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  _lt(x, y) { return x.s.moves < y.s.moves || (x.s.moves === y.s.moves && x.s.joints < y.s.joints); }
  push(x) { const a = this.a; a.push(x); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (this._lt(a[i], a[p])) { [a[i], a[p]] = [a[p], a[i]]; i = p; } else break; } }
  pop() { const a = this.a, top = a[0], last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && this._lt(a[l], a[m])) m = l; if (r < a.length && this._lt(a[r], a[m])) m = r; if (m === i) break; [a[i], a[m]] = [a[m], a[i]]; i = m; } } return top; }
}

// Returns { par, joints, opt, explored } for the fewest-moves (then fewest-joints)
// line, or null if unsolvable within the caps (caller can re-seed).
// Sound prune for BUILD-A-TRACK goals (collect a set onto the goal track, possibly
// CLEARING blockers off it and stashing them on scratch tracks):
//   • PULL only from a track that holds a goal car, or the goal track when it still
//     holds a non-goal car (a blocker to clear).
//   • SPOT to the goal track always; to any other track only while the engine holds a
//     non-goal car (i.e. you're stashing a blocker). Pure gathers stay tiny; clearing
//     puzzles open up just enough. (Distractor-only tracks are never pulled.)
export function solve(puzzle, { maxMoves = 10, maxStates = 120000 } = {}) {
  const goalTrack = puzzle.goal.track;
  const goalCars = new Set(puzzle.goal.cars);
  const start = freshState(puzzle);
  const h = new Heap(); h.push({ s: start, path: [] });
  const best = new Map([[key(start), [0, 0]]]);
  let explored = 0;
  while (h.size) {
    const cur = h.pop();
    if (++explored > maxStates) return null;
    if (checkWin(cur.s, puzzle)) return { par: cur.s.moves, joints: cur.s.joints, opt: cur.path, explored };
    if (cur.s.moves >= maxMoves) continue;

    for (const T of TRACK_IDS) {
      const hasGoalCar = cur.s.tracks[T].some((c) => goalCars.has(c));
      const goalHasBlocker = T === goalTrack && cur.s.tracks[T].some((c) => !goalCars.has(c));
      if (hasGoalCar || goalHasBlocker)
        for (let n = 1; n <= cur.s.tracks[T].length; n++) step(cur, 'pull', T, n, h, best);
    }
    const stashing = cur.s.engine.some((c) => !goalCars.has(c));
    for (const D of TRACK_IDS) {
      if (D === goalTrack || stashing)
        for (let n = 1; n <= cur.s.engine.length; n++) step(cur, 'spot', D, n, h, best);
    }
    // KICK onto the goal (when kickable + secured + kickable types) — same moves as
    // a spot but 0 joints, so the solver picks it for the cleaner line.
    for (let n = 1; n <= cur.s.engine.length; n++) step(cur, 'kick', goalTrack, n, h, best);
  }
  return null;
}
const MOVE_FN = { pull, spot, kick };
function step(cur, act, T, n, h, best) {
  const s = clone(cur.s); autoLine(s, T);
  if (!MOVE_FN[act](s, T, n).ok) return;
  const k = key(s), c = [s.moves, s.joints], b = best.get(k);
  if (!b || c[0] < b[0] || (c[0] === b[0] && c[1] < b[1])) { best.set(k, c); h.push({ s, path: cur.path.concat([[act, T, n]]) }); }
}

// Replay a line through a fresh engine; report whether it wins and in how many moves.
export function replay(puzzle, line) {
  const s = freshState(puzzle);
  for (const [act, T, n] of line) {
    autoLine(s, T);
    const r = MOVE_FN[act](s, T, n);
    if (!r.ok) return { ok: false, where: `${act} ${T} ${n}`, msg: r.msg };
  }
  return { ok: checkWin(s, puzzle), moves: s.moves, joints: s.joints };
}
