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
