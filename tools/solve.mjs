// tools/solve.mjs — solve & verify every authored puzzle with the shared solver.
// We ship a robust set of FIXED puzzles (no runtime generation); this tool computes
// par + the optimal line and verifies each puzzle's baked-in par/opt are optimal and
// that opt wins at par. It also doubles as the authoring aid:
//
//   node tools/solve.mjs            verify every puzzle (CI gate)
//   node tools/solve.mjs --print    print par/opt for each (paste into puzzles.js)

import { solve, replay } from '../src/solver.js';
import { PUZZLES } from '../src/puzzles.js';

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

console.log(fail ? `\n${fail} puzzle(s) FAILED ❌\n` : `\nAll ${PUZZLES.length} puzzles verified ✓\n`);
process.exit(fail ? 1 : 0);
