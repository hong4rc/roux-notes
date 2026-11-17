import { buildSpace, distToGoal, eoDone, ulurDone, cornersAligned, centresAligned, badEdges, pathFrom, edgeColours, EDGE_POS } from "../shared/lse-space";
import { solvedState } from "../shared/cube";
const sp = buildSpace();
const ul = distToGoal(sp, ulurDone);
const S = solvedState();
const fully = distToGoal(sp, (s) => s.every((v, i) => v === S[i]) );
// 4b: EO'd, corners aligned, centres aligned
const L = [0,4].sort().join(), R = [0,1].sort().join();
const where = (s: Uint8Array, pair: string) => EDGE_POS.find((p) => edgeColours(s, p) === pair)!;
const rows = new Map<string, number>();
sp.states.forEach((s, i) => {
  if (!eoDone(s) || !cornersAligned(s)) return;
  const k = `${where(s, L)}|${where(s, R)}`;
  const cur = rows.get(k);
  if (cur === undefined || ul.dist[i] < ul.dist[cur]) rows.set(k, i);
});
console.log("4b position pairs:", rows.size);
const lens: Record<number, number> = {};
for (const [k, i] of [...rows].sort((a, b) => ul.dist[a[1]] - ul.dist[b[1]])) { lens[ul.dist[i]] = (lens[ul.dist[i]] ?? 0) + 1; console.log(k.padEnd(8), ul.dist[i], pathFrom(sp, ul, i)); }
console.log(lens);
// 4c
const c4: number[] = [];
sp.states.forEach((s, i) => { if (ulurDone(s)) c4.push(i); });
console.log("4c states:", c4.length);
for (const i of c4.sort((a, b) => fully.dist[a] - fully.dist[b])) {
  const s = sp.states[i];
  const arr = ["UF","UB","DF","DB"].map((p) => p + "=" + ["UF","UB","DF","DB"].find((q) => edgeColours(s, p as any) === edgeColours(S as any, q as any)));
  console.log(fully.dist[i], pathFrom(sp, fully, i).padEnd(28), arr.join(" "));
}
void badEdges; void centresAligned;
