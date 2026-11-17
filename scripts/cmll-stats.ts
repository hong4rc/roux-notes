// Average move counts for one-look (full) CMLL versus two-look, over all 648 corner states.
import { ALL_CORNER_STATES, CMLL_BY_ID, fullAlg } from "../src/data/cmll";
import { planTwoLook } from "../src/data/two-look-plan";
import { writeFileSync } from "node:fs";

const len = (s: string) => (s ? s.split(" ").length : 0);
let full = 0, two = 0, fullMax = 0, twoMax = 0, n = 0, solved = 0;
const looks = { zero: 0, one: 0, two: 0 };
for (const s of ALL_CORNER_STATES) {
  n++;
  const c = s.caseId ? CMLL_BY_ID.get(s.caseId)! : null;
  const f = c ? len(s.pre) + len(c.algs[0].alg) + len(s.post) : len(s.post);
  full += f; fullMax = Math.max(fullMax, f);
  if (!c) solved++;
  const plan = planTwoLook(s.state);
  if (!plan) throw new Error("no 2-look plan");
  two += plan.moves; twoMax = Math.max(twoMax, plan.moves);
  const algLooks = plan.looks.filter((l) => l.alg).length;
  looks[algLooks === 0 ? "zero" : algLooks === 1 ? "one" : "two"]++;
}
const mainLens = [...CMLL_BY_ID.values()].map((c) => len(c.algs[0].alg));
const out = {
  states: n,
  fullAvg: +(full / n).toFixed(1),
  fullMax,
  twoLookAvg: +(two / n).toFixed(1),
  twoLookMax: twoMax,
  skipOrAufOnly: solved,
  twoLookOneAlg: looks.one,
  twoLookTwoAlgs: looks.two,
  caseAlgAvgLen: +(mainLens.reduce((a, b) => a + b, 0) / mainLens.length).toFixed(1),
  caseAlgMinLen: Math.min(...mainLens),
  caseAlgMaxLen: Math.max(...mainLens),
};
console.log(out);
writeFileSync(new URL("../src/data/cmll-stats.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
void fullAlg;
