// tools/solve.mjs — the move-first solver + replay harness.
//
// It imports the REAL game engine (../src/model.js) and applies the actual
// pull/spot, so there's zero divergence between solver and game. For each puzzle
// it finds par (fewest moves, then fewest joints) and verifies the declared
// par/opt are optimal and that opt wins at par.
//
//   node tools/solve.mjs            verify every puzzle
//   node tools/solve.mjs --print    also print the solver's optimal line
//
// Lining (CROR 104) is auto-satisfied per move (ignored for solvability); foul /
// lead / capacity and the win rule come for free from the real engine.

import { freshState, pull, spot, checkWin } from '../src/model.js';
import { TRACK_IDS } from '../src/geometry.js';
import { PUZZLES } from '../src/puzzles.js';

const PRINT = process.argv.includes('--print');
const MAX_MOVES = 16;

function clone(s) {
  const tracks = {}, pos = {}, secured = {}, lined = {};
  for (const t of TRACK_IDS) { tracks[t] = s.tracks[t].slice(); pos[t] = s.pos[t].slice(); secured[t] = s.secured[t]; lined[t] = s.lined[t]; }
  return { tracks, pos, engine: s.engine.slice(), secured, lined, moves: s.moves, joints: s.joints, msg: '', won: s.won };
}

function autoLine(s, id) { for (const t of TRACK_IDS) s.lined[t] = (t === id) ? 'reverse' : 'normal'; }

// canonical state key (what matters for future legality + the win)
function key(s) {
  return TRACK_IDS.map((t) => s.tracks[t].join(',') + '@' + s.pos[t].join(',')).join(';') + '#' + s.engine.join(',');
}

const better = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);   // (moves, joints)

// Dijkstra over states; pop the lexicographically smallest (moves, joints).
// The first WIN popped is optimal: fewest moves, then fewest joints.
function solve(puzzle) {
  const start = freshState(puzzle);
  const pq = [{ s: start, path: [] }];
  const best = new Map([[key(start), [0, 0]]]);
  let explored = 0;
  while (pq.length) {
    let mi = 0;
    for (let i = 1; i < pq.length; i++) {
      const a = pq[i].s, b = pq[mi].s;
      if (a.moves < b.moves || (a.moves === b.moves && a.joints < b.joints)) mi = i;
    }
    const cur = pq.splice(mi, 1)[0];
    explored++;
    if (checkWin(cur.s, puzzle)) return { par: cur.s.moves, joints: cur.s.joints, opt: cur.path, explored };
    if (cur.s.moves >= MAX_MOVES) continue;

    for (const T of TRACK_IDS) {
      for (let n = 1; n <= cur.s.tracks[T].length; n++) tryMove(cur, 'pull', T, n);
      for (let n = 1; n <= cur.s.engine.length; n++) tryMove(cur, 'spot', T, n);
    }

    function tryMove(cur, act, T, n) {
      const s = clone(cur.s);
      autoLine(s, T);
      const r = (act === 'pull' ? pull : spot)(s, T, n);
      if (!r.ok) return;
      const k = key(s), cost = [s.moves, s.joints], b = best.get(k);
      if (!b || better(cost, b)) { best.set(k, cost); pq.push({ s, path: cur.path.concat([[act, T, n]]) }); }
    }
  }
  return null;
}

// Replay a line through a fresh engine; report whether it wins and in how many moves.
function replay(puzzle, line) {
  const s = freshState(puzzle);
  for (const [act, T, n] of line) {
    autoLine(s, T);
    const r = (act === 'pull' ? pull : spot)(s, T, n);
    if (!r.ok) return { ok: false, where: `${act} ${T} ${n}`, msg: r.msg };
  }
  return { ok: checkWin(s, puzzle), moves: s.moves, joints: s.joints };
}

let fail = 0;
console.log(`\nswitch-list — solving ${PUZZLES.length} puzzle(s)\n`);
for (const p of PUZZLES) {
  const sol = solve(p);
  if (!sol) { console.log(`  ✗ ${p.id} "${p.title}" — NO SOLUTION within ${MAX_MOVES} moves`); fail++; continue; }

  const parOk = p.par === sol.par;
  const rep = replay(p, p.opt || []);
  const optOk = rep.ok && rep.moves === p.par;
  const ok = parOk && optOk;
  if (!ok) fail++;

  console.log(`  ${ok ? '✓' : '✗'} ${p.id} "${p.title}"`);
  console.log(`      solver: par ${sol.par} moves, ${sol.joints} joints  (${sol.explored} states)`);
  console.log(`      declared par ${p.par} ${parOk ? 'OK' : '❌ MISMATCH'} · declared opt → ${rep.ok ? `win in ${rep.moves} moves, ${rep.joints} joints` : `❌ ${rep.msg || 'does not win'}`} ${rep.ok && !optOk ? '(not at par!)' : ''}`);
  if (PRINT || !ok) console.log(`      solver opt: ${JSON.stringify(sol.opt)}`);
}

console.log(fail ? `\n${fail} puzzle(s) FAILED ❌\n` : `\nAll ${PUZZLES.length} puzzles verified ✓\n`);
process.exit(fail ? 1 : 0);
