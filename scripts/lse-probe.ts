import { buildSpace, distToGoal, eoDone, ulurDone, cornersAligned, centresAligned, badEdges, pathFrom } from "../shared/lse-space";
import { solvedState } from "../shared/cube";
const t0 = Date.now();
const sp = buildSpace();
console.log("states", sp.states.length, "ms", Date.now() - t0);
const eo = distToGoal(sp, eoDone);
const ul = distToGoal(sp, ulurDone);
const solved = distToGoal(sp, (s) => s.every((v, i) => v === solvedState()[i] || true) && false);
void solved;
// EO patterns from corner-aligned, centre-aligned states
const byPat = new Map<string, number>();
sp.states.forEach((s, i) => {
  if (!cornersAligned(s) || !centresAligned(s)) return;
  const k = badEdges(s).join("+") || "none";
  const cur = byPat.get(k);
  if (cur === undefined || eo.dist[i] < eo.dist[cur]) byPat.set(k, i);
});
console.log("EO patterns", byPat.size);
for (const [k, i] of byPat) console.log(k.padEnd(18), eo.dist[i], pathFrom(sp, eo, i));
console.log("ulur reachable", ul.dist.filter((d) => d >= 0).length);
