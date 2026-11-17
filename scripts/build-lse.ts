import { writeFileSync } from "node:fs";
import { applyAlg, solvedState } from "../shared/cube";
import {
  EDGE_POS, buildSpace, badEdges, centresAligned, cornersAligned, distToGoal, edgeColours, eoDone, flipEdges, pathFrom, scrambleTo, ulurDone,
} from "../shared/lse-space";

const sp = buildSpace();
const S = solvedState();
const eoD = distToGoal(sp, eoDone);
const ulD = distToGoal(sp, ulurDone);
const fullD = distToGoal(sp, (s) => s.every((v, i) => v === S[i]));

// ---- EO: group the 32 patterns into orbits under U turns (U sends UF -> UL -> UB -> UR)
const RING = ["UF", "UL", "UB", "UR"];
const rot = (name: string) => (RING.includes(name) ? RING[(RING.indexOf(name) + 1) % 4] : name);
const patKey = (bad: string[]) => EDGE_POS.map((p) => (bad.includes(p) ? "1" : "0")).join("");
const orbitKey = (bad: string[]) => {
  let cur = bad, best = patKey(bad);
  for (let k = 0; k < 3; k++) { cur = cur.map(rot); best = best < patKey(cur) ? best : patKey(cur); }
  return best;
};
const patterns = new Map<string, number>();
sp.states.forEach((s, i) => {
  if (!cornersAligned(s) || !centresAligned(s)) return;
  const k = patKey(badEdges(s));
  const cur = patterns.get(k);
  if (cur === undefined || eoD.dist[i] < eoD.dist[cur]) patterns.set(k, i);
});
const orbits = new Map<string, { size: number; i: number }>();
for (const [, i] of patterns) {
  const bad = badEdges(sp.states[i]);
  const k = orbitKey(bad);
  const o = orbits.get(k);
  if (!o) orbits.set(k, { size: 1, i });
  else { o.size++; if (eoD.dist[i] < eoD.dist[o.i]) o.i = i; }
}
const eo = [...orbits.values()].map(({ size, i }) => {
  const bad = badEdges(sp.states[i]) as string[];
  const alg = pathFrom(sp, eoD, i);
  const top = bad.filter((p) => p.startsWith("U"));
  const bottom = bad.filter((p) => p.startsWith("D"));
  // verification on the orientation-only picture state (flipped in place, permutation solved)
  const pic = flipEdges(S, bad);
  if (!eoDone(applyAlg(pic, alg))) throw new Error(`EO alg fails on picture state: ${bad} ${alg}`);
  const adjacent = top.length === 2 ? (Math.abs(RING.indexOf(top[0]) - RING.indexOf(top[1])) % 2 === 1 ? "a" : "o") : "";
  return { bad, top: top.length, bottom, shape: adjacent, alg, len: alg ? alg.split(" ").length : 0, rotations: size };
}).sort((a, b) => a.len - b.len || a.top - b.top);

// ---- EO algorithms published by community sources. Each one is tried on the picture of every pattern (with a U turn first if
// needed); it counts when afterwards no edge is bad and the centres are lined up or half a turn off (M2), the usual end of EO.
const SOURCES = {
  rouxvolution: { name: "Rouxvolution", url: "https://rouxvolution.pages.dev/guides/eo" },
  cubetools: { name: "CubeTools", url: "https://bradleykh.github.io/CubeTools/tutorials/roux/lse-edge-orientation/" },
} as const;
const KNOWN: { source: keyof typeof SOURCES; name: string; alg: string }[] = [
  { source: "rouxvolution", name: "Arrow", alg: "M' U' M" },
  { source: "rouxvolution", name: "Arrow (mirror)", alg: "M U' M'" },
  { source: "rouxvolution", name: "2a/2", alg: "M2 U' M U' M" },
  { source: "rouxvolution", name: "2a/0", alg: "M U M' U2 M U' M'" },
  { source: "rouxvolution", name: "2o/0", alg: "M U M' U' M U' M'" },
  { source: "rouxvolution", name: "4/0", alg: "M U2 M' U2 M U' M'" },
  { source: "rouxvolution", name: "2o/2", alg: "M U2 M' U2 M' U' M" },
  { source: "rouxvolution", name: "1/1", alg: "M U M' U M U' M'" },
  { source: "rouxvolution", name: "1/1 (mirror)", alg: "M' U' M U' M' U M" },
  { source: "rouxvolution", name: "0/2", alg: "M U M U' M' U' M'" },
  { source: "rouxvolution", name: "4/2 (6-flip)", alg: "M U M U M' U M' U2 M U' M'" },
  { source: "cubetools", name: "Cradle", alg: "M U2 M' U2 M' U' M'" },
  { source: "cubetools", name: "Cross", alg: "M' U2 M' U2 M' U' M'" },
  { source: "cubetools", name: "Stinger", alg: "M2 U' M' U' M'" },
  { source: "cubetools", name: "Neighbors", alg: "M' U M' U2 M' U' M'" },
  { source: "cubetools", name: "Front Diagonal", alg: "M' U' M U' M' U' M'" },
  { source: "cubetools", name: "Back Diagonal", alg: "M' U' M' U' M U' M'" },
  { source: "cubetools", name: "Top Pair", alg: "M' U M U' M' U' M'" },
  { source: "cubetools", name: "Bottom Pair", alg: "M' U M' U' M U' M'" },
  { source: "cubetools", name: "All Bad", alg: "M' U' M' U2 M' U' M U' M' U' M'" },
  { source: "cubetools", name: "Front Arrow", alg: "M' U' M'" },
  { source: "cubetools", name: "Back Arrow", alg: "M U' M'" },
];
const eoEnd = (s: Uint8Array) => badEdges(s).length === 0 && (centresAligned(s) || centresAligned(applyAlg(s, "M2")));
const AUF = ["", "U", "U'", "U2"];
type Known = { source: string; url: string; name: string; alg: string; pre: string; centresHalfOff: boolean };
function knownFor(bad: string[]): Known[] {
  const pic = flipEdges(S, bad);
  const out: Known[] = [];
  for (const k of KNOWN)
    for (const pre of AUF) {
      const after = applyAlg(pic, `${pre} ${k.alg}`);
      if (!eoEnd(after)) continue;
      out.push({ source: SOURCES[k.source].name, url: SOURCES[k.source].url, name: k.name, alg: k.alg, pre, centresHalfOff: !centresAligned(after) });
      break;
    }
  return out;
}
const used = new Set<string>();
for (const e of eo) {
  (e as typeof e & { known: Known[] }).known = knownFor(e.bad);
  for (const k of (e as typeof e & { known: Known[] }).known) used.add(k.alg);
}
const unused = KNOWN.filter((k) => !used.has(k.alg));
console.log("published EO algs matched to a pattern:", KNOWN.length - unused.length, "/", KNOWN.length, unused.length ? `unmatched: ${unused.map((k) => `${k.name} ${k.alg}`).join("; ")}` : "");

const eoAll = [...patterns].map(([, i]) => {
  const bad = badEdges(sp.states[i]) as string[];
  const alg = pathFrom(sp, eoD, i);
  if (!eoDone(applyAlg(flipEdges(S, bad), alg))) throw new Error(`EO alg fails: ${bad} ${alg}`);
  return { bad, alg, len: alg ? alg.split(" ").length : 0, known: knownFor(bad) };
});

// ---- 4b: positions of the left and right pieces
const L = [0, 4].sort().join(), R = [0, 1].sort().join();
const where = (s: Uint8Array, pair: string) => EDGE_POS.find((p) => edgeColours(s, p) === pair)!;
const ulur = new Map<string, number>();
sp.states.forEach((s, i) => {
  if (!eoDone(s) || !cornersAligned(s)) return;
  const k = `${where(s, L)}|${where(s, R)}`;
  const cur = ulur.get(k);
  if (cur === undefined || ulD.dist[i] < ulD.dist[cur]) ulur.set(k, i);
});
const ulurCases = [...ulur].map(([k, i]) => {
  const [left, right] = k.split("|");
  const alg = pathFrom(sp, ulD, i);
  return { left, right, alg, len: alg ? alg.split(" ").length : 0, scramble: scrambleTo(sp, i) };
}).sort((a, b) => a.len - b.len);

// ---- EOLR: steps 1 and 2 in one algorithm. A case is the set of bad edges plus where the left and right pieces are.
const eolr = new Map<string, number>();
sp.states.forEach((s, i) => {
  if (!cornersAligned(s) || !centresAligned(s)) return;
  const k = `${badEdges(s).join("/")}|${where(s, L)}|${where(s, R)}`;
  const cur = eolr.get(k);
  if (cur === undefined || ulD.dist[i] < ulD.dist[cur]) eolr.set(k, i);
});
const eolrCases = [...eolr].map(([k, i]) => {
  const [bad, left, right] = k.split("|");
  const alg = pathFrom(sp, ulD, i);
  const scramble = scrambleTo(sp, i);
  if (!ulurDone(applyAlg(applyAlg(S, scramble), alg))) throw new Error(`EOLR alg fails: ${k} ${alg}`);
  return { bad: bad ? bad.split("/") : [], left, right, alg, len: alg ? alg.split(" ").length : 0, scramble };
});

// ---- 4c: the 12 arrangements of the other four edges
const l4e: { alg: string; len: number; scramble: string }[] = [];
sp.states.forEach((s, i) => {
  if (!ulurDone(s)) return;
  const alg = pathFrom(sp, fullD, i);
  l4e.push({ alg, len: alg ? alg.split(" ").length : 0, scramble: scrambleTo(sp, i) });
});
l4e.sort((a, b) => a.len - b.len);

// ---- statistics: optimal full solve versus the three-step method, over states with aligned corners
let nOpt = 0, sumTwo = 0, maxTwo = 0, sumOpt = 0, maxOpt = 0, sumThree = 0, maxThree = 0, n3 = 0;
for (let i = 0; i < sp.states.length; i++) {
  const s = sp.states[i];
  if (!cornersAligned(s) || !centresAligned(s)) continue;
  nOpt++; sumOpt += fullD.dist[i]; maxOpt = Math.max(maxOpt, fullD.dist[i]);
  // three steps: EO, align corners with U, 4b, 4c
  let cur = i, moves = 0;
  const walk = (d: typeof eoD, from: number) => { let c = from, m = 0; while (d.dist[c] > 0) { c = sp.nbr[c * 6 + d.next[c]]; m++; } return { c, m }; };
  let r = walk(eoD, cur); cur = r.c; moves += r.m;
  // align corners: find U^k (k<4) giving aligned corners
  let t = 0; while (!cornersAligned(sp.states[cur]) && t < 4) { cur = sp.nbr[cur * 6 + 3]; t++; }
  moves += t === 0 ? 0 : t === 2 ? 1 : 1;
  if (!cornersAligned(sp.states[cur])) throw new Error("cannot align");
  r = walk(ulD, cur); cur = r.c; moves += r.m;
  r = walk(fullD, cur); cur = r.c; moves += r.m;
  { // two steps: EO and UL/UR in one algorithm (EOLR-like), then the last four edges
    let c2 = i, m2 = 0; let w = walk(ulD, c2); c2 = w.c; m2 += w.m; w = walk(fullD, c2); m2 += w.m;
    sumTwo += m2; maxTwo = Math.max(maxTwo, m2);
  }
  sumThree += moves; maxThree = Math.max(maxThree, moves); n3++;
}
// worked L6E example: a state where the three-step method wastes the most moves against the optimal solve
let ex = { gap: -1, i: 0 };
for (let i = 0; i < sp.states.length; i++) {
  const s = sp.states[i];
  if (!cornersAligned(s) || !centresAligned(s) || fullD.dist[i] > 12) continue;
  let cur = i, parts: string[] = [], tot = 0;
  const run = (d: typeof eoD) => { const a = pathFrom(sp, d, cur); let c = cur; while (d.dist[c] > 0) c = sp.nbr[c * 6 + d.next[c]]; cur = c; if (a) { parts.push(a); tot += a.split(" ").length; } };
  run(eoD);
  if (!cornersAligned(sp.states[cur])) continue; // keep the example free of U alignment turns
  run(ulD); run(fullD);
  if (tot - fullD.dist[i] > ex.gap) ex = { gap: tot - fullD.dist[i], i };
}
const l6eExample = (() => {
  const i = ex.i; let cur = i; const steps: { name: string; alg: string }[] = [];
  for (const [name, d] of [["eo", eoD], ["ulur", ulD], ["l4e", fullD]] as const) {
    const alg = pathFrom(sp, d, cur); let c = cur; while (d.dist[c] > 0) c = sp.nbr[c * 6 + d.next[c]]; cur = c; steps.push({ name, alg });
  }
  const scramble = scrambleTo(sp, i), optimal = pathFrom(sp, fullD, i);
  if (!applyAlg(applyAlg(S, scramble), optimal).every((v, k) => v === S[k])) throw new Error("L6E example optimal fails");
  const chained = steps.map((s) => s.alg).filter(Boolean).join(" ");
  if (!applyAlg(applyAlg(S, scramble), chained).every((v, k) => v === S[k])) throw new Error("L6E example steps fail");
  return { scramble, steps, optimal, optimalLen: optimal.split(" ").length, stepsLen: chained.split(" ").length };
})();
const stats = { states: sp.states.length, alignedStates: nOpt, optimalAvg: +(sumOpt / nOpt).toFixed(1), optimalMax: maxOpt, threeStepAvg: +(sumThree / n3).toFixed(1), threeStepMax: maxThree, twoStepAvg: +(sumTwo / n3).toFixed(1), twoStepMax: maxTwo };
console.log(stats);
console.log("eo orbits", eo.length, eo.map((e) => `${e.top}/${e.bottom.length}${e.shape}:${e.alg}`).join(" | "));
writeFileSync(new URL("../src/data/lse-data.json", import.meta.url), JSON.stringify({ stats, eo, eoAll, ulur: ulurCases, eolr: eolrCases, l6eExample, l4e }, null, 1) + "\n");
