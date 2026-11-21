import { RAW_CMLL } from "../src/data/cmll-raw";
import { applyAlg, solvedState } from "../shared/cube";
import { checkCmll, signatureKey, uCornerSignature } from "../shared/roux";

const classKey = (alg: string): string => {
  let best = "";
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const pre = "U ".repeat(i);
      const post = " U".repeat(j);
      const k = signatureKey(uCornerSignature(applyAlg(solvedState(), `${pre}${alg}${post}`)));
      if (best === "" || k < best) best = k;
    }
  return best;
};

let bad = 0;
const classes = new Map<string, { source: string; group: string; name: string; alg: string }[]>();
for (const r of RAW_CMLL) {
  const c = checkCmll(r.alg);
  if (!c.ok) {
    bad++;
    console.log(`FAIL ${r.source} ${r.group} ${r.name}: ${c.reason}  [${r.alg}]`);
    continue;
  }
  const k = classKey(r.alg);
  if (!classes.has(k)) classes.set(k, []);
  classes.get(k)!.push(r);
}
console.log(`\nalgs: ${RAW_CMLL.length}, failed: ${bad}, distinct cases: ${classes.size}`);
for (const [, list] of classes) {
  const names = list.map((l) => `${l.source[0]}:${l.group}/${l.name}`).join("  ");
  const flag = list.length === 2 && list[0].source !== list[1].source ? "" : "  <-- check";
  console.log(`${names}${flag}`);
}

// ---- 2-look page claims (hand tags, default second look, drills, R2' note) ----
import { CMLL_CASES } from "../src/data/cmll";
import { ORIENT_ALGS, PERMUTE_ALGS, defaultPermuteIndex } from "../src/data/two-look";

let bad2 = 0;
const fail = (m: string) => {
  bad2++;
  console.log(`FAIL ${m}`);
};
const sameState = (a: string, b: string) => JSON.stringify(applyAlg(solvedState(), a)) === JSON.stringify(applyAlg(solvedState(), b));
// the default way of each swap is the first listed (the stored pick starts at 0)
for (const p of PERMUTE_ALGS) if (defaultPermuteIndex(p.options) !== 0) fail(`default ${p.id} is option ${defaultPermuteIndex(p.options)}, not the first listed`);
// "dấu ' chỉ chiều tay quay": X2' and X2 give the same cube
for (const m of ["R", "U", "F", "L"]) if (!sameState(`${m}2'`, `${m}2`)) fail(`${m}2' differs from ${m}2`);
// the hand drill says the cube is back after 6 repeats: Sune, Antisune and the default adjacent swap
const drill = [ORIENT_ALGS.find((a) => a.group === "S")!.alg, ORIENT_ALGS.find((a) => a.group === "As")!.alg, PERMUTE_ALGS.find((p) => p.id === "adjacent")!.options[0].alg];
for (const a of drill) if (!sameState(Array(6).fill(a).join(" "), "")) fail(`6 repeats of ${a} do not return to solved`);
// the case page says the first way has the most votes
for (const c of CMLL_CASES) if ((c.algs[0].votes ?? -1) < Math.max(...c.algs.map((a) => a.votes ?? -1))) fail(`${c.id}: first way is not the most voted`);
console.log(bad2 ? `\n2-look page checks: ${bad2} failed` : "\n2-look page checks: ok");
if (bad2) process.exit(1);
