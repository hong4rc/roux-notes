// Checks the edge-story model (shared/lse-trace.ts) against the real cube engine.
import { applyAlg, solvedState } from "../shared/cube";
import { EDGE_POS, badEdges, edgeColours, flipEdges } from "../shared/lse-space";
import { traceEdges, pieceEffect } from "../shared/lse-trace";
import { DRILL_PIECES } from "../shared/lse-drill";
import data from "../src/data/lse-data.json";

const S = solvedState();
let fails = 0;
const check = (ok: boolean, msg: string) => {
  if (!ok) { fails++; console.log("FAIL", msg); }
};

// 1. where every edge ends up and how often it is flipped must agree with the engine, for many algorithms
const algs = new Set<string>();
for (const e of data.eo) { if (e.alg) algs.add(e.alg); for (const k of e.known) algs.add([k.pre, k.alg].filter(Boolean).join(" ")); }
for (const e of data.eoAll) { if (e.alg) algs.add(e.alg); for (const k of e.known) algs.add([k.pre, k.alg].filter(Boolean).join(" ")); }
for (const c of data.l4e) if (c.alg) algs.add(c.alg);
for (const c of data.ulur) if (c.alg) algs.add(c.alg);
let n = 0;
for (const alg of algs) {
  if (/[^MU2' ]/.test(alg)) continue;
  n++;
  const tr = traceEdges(alg, []);
  const after = applyAlg(S, alg);
  for (const l of tr.ledger) {
    const now = EDGE_POS.find((p) => edgeColours(after, p) === edgeColours(S, l.edge));
    check(now === l.endsAt, `${alg}: edge ${l.edge} model ${l.endsAt} engine ${now}`);
  }
  const bad = badEdges(after);
  for (const l of tr.ledger) check((l.flips % 2 === 1) === bad.includes(l.endsAt), `${alg}: flip parity of ${l.edge}`);
}
console.log(`checked ${n} algorithms against the engine`);

// 2. every EO case: each bad edge is swept by the slice an odd number of times, each good one an even number
let eoCases = 0;
for (const e of [...data.eoAll, ...data.eo]) {
  if (!e.alg) continue;
  eoCases++;
  const tr = traceEdges(e.alg, e.bad);
  check(tr.ledger.every((l) => l.ok), `EO ${e.bad.join("/")} with ${e.alg}: ledger not all ok`);
  check(badEdges(applyAlg(flipEdges(S, e.bad), e.alg)).length === 0, `EO ${e.bad.join("/")}: engine still has bad edges`);
}
console.log(`checked ${eoCases} EO cases`);
// 3. the building-block table: flips and travelling edges of every block agree with the engine
const blocks = new Set(Object.values(DRILL_PIECES).flatMap((h) => Object.values(h).flat()));
for (const alg of blocks) {
  const fx = pieceEffect(alg);
  const after = applyAlg(S, alg);
  const trace = traceEdges(alg, []);
  const flippedNow = new Set(trace.ledger.filter((l) => fx.flipped.includes(l.edge)).map((l) => l.endsAt));
  check(badEdges(after).length === flippedNow.size && badEdges(after).every((p) => flippedNow.has(p)), `block ${alg}: flipped edges`);
  for (const cyc of fx.cycles)
    cyc.forEach((from, i) => {
      const to = cyc[(i + 1) % cyc.length];
      check(edgeColours(after, to) === edgeColours(S, from), `block ${alg}: edge at ${from} should end at ${to}`);
    });
}
console.log(`checked ${blocks.size} building blocks`);
if (fails) { console.log(`${fails} failures`); process.exit(1); }
console.log("lse-trace OK");
