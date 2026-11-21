// Checks the claim made on the EOLR page: every case that has work to do can be derived by laying the building blocks of the
// EO and UL/UR steps one after another (a U turn allowed before each) until no edge is bad and both the left and the right edge
// are at the bottom, then finishing with M2 and U turns. Slow (about two minutes): not part of verify-all.
import { applyAlg, solvedState } from "../shared/cube";
import { DRILL_PIECES, bothDown, stepDone } from "../shared/lse-drill";
import { badEdges } from "../shared/lse-space";
import data from "../src/data/lse-data.json";

const S = solvedState();
const key = (s: Uint8Array) => Array.from(s).join(",");
const len = (a: string) => (a ? a.split(" ").length : 0);
const UTURNS = ["", "U", "U'", "U2"];
const MAX_BLOCKS = 4;
const pieces = [...new Set([...DRILL_PIECES.std.eo, ...DRILL_PIECES.std.ulur])];
const ready = (s: Uint8Array) => badEdges(s).length === 0 && bothDown(s);

function blocksTo(start: Uint8Array) {
  let layer = [{ s: start, parts: [] as string[], moves: 0 }];
  const seen = new Set([key(start)]);
  for (let depth = 0; depth <= MAX_BLOCKS; depth++) {
    let best: (typeof layer)[number] | null = null;
    for (const n of layer) if (ready(n.s) && (!best || n.moves < best.moves)) best = n;
    if (best) return best;
    const next = new Map<string, (typeof layer)[number]>();
    for (const n of layer)
      for (const u of UTURNS)
        for (const p of pieces) {
          const a = `${u} ${p}`.trim();
          const s = applyAlg(n.s, a);
          const k = key(s);
          if (seen.has(k)) continue;
          const m = n.moves + len(a);
          const old = next.get(k);
          if (!old || m < old.moves) next.set(k, { s, parts: [...n.parts, a], moves: m });
        }
    for (const k of next.keys()) seen.add(k);
    layer = [...next.values()];
  }
  return null;
}

let n = 0, missed = 0, total = 0, optimal = 0, maxBlocks = 0;
for (const c of data.eolr) {
  if (!c.alg) continue;
  const start = applyAlg(S, c.scramble);
  const found = blocksTo(start);
  let tail = 99;
  if (found) {
    const mid = applyAlg(start, found.parts.join(" "));
    for (const a of ["M2", "U M2", "U' M2", "U2 M2"])
      for (const b of UTURNS) if (stepDone("ulur", applyAlg(mid, `${a} ${b}`.trim()), S)) tail = Math.min(tail, len(a) + len(b));
  }
  if (!found || tail === 99) {
    missed++;
    console.log("NOT DERIVED:", c.bad.join("/"), c.left, c.right);
    continue;
  }
  n++;
  total += found.moves + tail;
  optimal += c.len;
  maxBlocks = Math.max(maxBlocks, found.parts.length);
}
console.log(`derived ${n} of ${n + missed} cases; at most ${maxBlocks} blocks; average ${(total / n).toFixed(1)} moves against ${(optimal / n).toFixed(1)} for the shortest`);
if (missed) process.exit(1);
console.log("lse-derive OK");
