// tools/solve.mjs — solve & verify every authored puzzle with the shared solver.
// We ship a robust set of FIXED puzzles (no runtime generation); this tool computes
// par + the optimal line and verifies each puzzle's baked-in par/opt are optimal and
// that opt wins at par. It also doubles as the authoring aid:
//
//   node tools/solve.mjs            verify every puzzle (CI gate)
//   node tools/solve.mjs --print    print par/opt for each (paste into puzzles.js)

import { solve, replay } from '../src/solver.js';
import { PUZZLES } from '../src/puzzles.js';
import { freshState, pull, canKick } from '../src/model.js';
import { TRACK_IDS } from '../src/geometry.js';

const PRINT = process.argv.includes('--print');
let fail = 0;

console.log(`\nswitch-list — ${PUZZLES.length} puzzle(s)\n`);
for (const p of PUZZLES) {
  const sol = solve(p);
  if (!sol) { console.log(`  ✗ ${p.id} "${p.title}" — NO SOLUTION within caps`); fail++; continue; }

  const notes = [];
  let ok = true;
  if (typeof p.par === 'number' && p.par !== sol.par) { ok = false; notes.push(`declared par ${p.par} ≠ solver ${sol.par}`); }
  if (p.opt) {
    const rep = replay(p, p.opt);
    if (!rep.ok) { ok = false; notes.push(`opt fails: ${rep.msg}`); }
    else if (rep.moves !== sol.par) { ok = false; notes.push(`opt wins in ${rep.moves}, not par ${sol.par}`); }
  }
  if (typeof p.par !== 'number' || !p.opt) notes.push('AUTHORING — bake par/opt in');
  if (!ok) fail++;

  console.log(`  ${ok ? '✓' : '✗'} ${p.id} "${p.title}" — par ${sol.par}, ${sol.joints} joints (${sol.explored} states)${notes.length ? '  · ' + notes.join('; ') : ''}`);
  if (PRINT || typeof p.par !== 'number' || !p.opt || !ok) {
    console.log(`      par: ${sol.par},`);
    console.log(`      opt: ${JSON.stringify(sol.opt)},`);
  }
}

// --- kick rules proven as law (negative + positive tests) -----------------
const aLine = (s, id) => { for (const t of TRACK_IDS) s.lined[t] = t === id ? 'reverse' : 'normal'; };
const refused = (label, fn) => { const r = fn(); const ok = !r.ok; console.log(`  ${ok ? '✓' : '✗'} kick-law: ${label} — ${ok ? 'refused: ' + r.msg.slice(0, 56) : 'WAS ALLOWED (should refuse)'}`); if (!ok) fail++; };
const allowed = (label, fn) => { const r = fn(); console.log(`  ${r.ok ? '✓' : '✗'} kick-law: ${label} — ${r.ok ? 'allowed' : 'refused (should allow): ' + r.msg}`); if (!r.ok) fail++; };

console.log('kick rules (proven as law):');
const kp = {
  kickable: ['AS73', 'AS72'],
  start: { AS73: [200, 'A', 'B'], AS72: [200, 'C'], AS71: [140, 'X', 'Y'], AS75: [140, ['T1', 'tank'], ['T2', 'tank']] },
  goal: { track: 'AS73', cars: ['A', 'B'] },
};
const sBox = freshState(kp); aLine(sBox, 'AS71'); pull(sBox, 'AS71', 2);   // hold 2 box cars
refused('kick onto a non-kickable track (AS75)', () => { aLine(sBox, 'AS75'); return canKick(sBox, 'AS75', 2); });
refused('kick onto an unsecured / short cut (AS72)', () => { aLine(sBox, 'AS72'); return canKick(sBox, 'AS72', 2); });
allowed('kick box cars onto a secured kickable cut (AS73)', () => { aLine(sBox, 'AS73'); return canKick(sBox, 'AS73', 2); });
const sTank = freshState(kp); aLine(sTank, 'AS75'); pull(sTank, 'AS75', 2);  // hold 2 tank cars
refused('kick TANK cars (not kickable type)', () => { aLine(sTank, 'AS73'); return canKick(sTank, 'AS73', 2); });

console.log('loads/empties kick rules (proven as law):');
const lp = {
  kickable: ['AS73'],
  start: {
    AS73: [200, ['E1', 'box', 'E'], ['E2', 'box', 'E']],                                            // secured EMPTY cut
    AS72: [200, ['L1', 'box'], ['L2', 'box'], ['L3', 'box'], ['L4', 'box']],                         // 4 loaded
    AS71: [140, ['M1', 'box', 'E'], ['M2', 'box', 'E']],                                             // 2 empties
    AS75: [120, ['N1', 'box', 'E'], ['N2', 'box', 'E'], ['N3', 'box', 'E'], ['N4', 'box', 'E'], ['N5', 'box', 'E'], ['N6', 'box', 'E']], // 6 empties
  },
  goal: { track: 'AS73', cars: ['E1', 'E2'] },
};
const sL = freshState(lp); aLine(sL, 'AS72'); pull(sL, 'AS72', 4);
refused('kick more than 3 LOADED at once', () => { aLine(sL, 'AS73'); return canKick(sL, 'AS73', 4); });
const sL3 = freshState(lp); aLine(sL3, 'AS72'); pull(sL3, 'AS72', 3);
refused('kick a LOADED car onto an empty cut', () => { aLine(sL3, 'AS73'); return canKick(sL3, 'AS73', 3); });
const sCap = freshState(lp); aLine(sCap, 'AS75'); pull(sCap, 'AS75', 6);
refused('kick more than 5 cars at once', () => { aLine(sCap, 'AS73'); return canKick(sCap, 'AS73', 6); });
const sOk = freshState(lp); aLine(sOk, 'AS71'); pull(sOk, 'AS71', 2);
allowed('kick empties onto an empty cut (within limits)', () => { aLine(sOk, 'AS73'); return canKick(sOk, 'AS73', 2); });

console.log(fail ? `\n${fail} check(s) FAILED ❌\n` : `\nAll ${PUZZLES.length} puzzles + kick/load rules verified ✓\n`);
process.exit(fail ? 1 : 0);
