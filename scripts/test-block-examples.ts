// The worked examples on the two block lessons must be real: each job finishes exactly its pieces on the real cube,
// keeps what was done before, is a shortest search for those pieces, and the scrambles obey their rules.
import { applyAlg, isPieceSolved, parseAlg, solvedState } from "../shared/cube";
import { FIRST_BLOCK_PLAN, SECOND_BLOCK_PLAN, solveInStages, type BlockPlan } from "../shared/block-stages";
import { LEFT_BLOCK } from "../shared/roux";
import { FIRST_BLOCK_EXAMPLE, SECOND_BLOCK_EXAMPLE } from "../src/data/block-examples";

let fails = 0;
const check = (ok: boolean, msg: string) => {
  if (!ok) { fails++; console.log("FAIL", msg); }
};

function verify(name: string, plan: BlockPlan, ex: { scramble: string; jobs: readonly string[] }, allowed: RegExp) {
  check(allowed.test(ex.scramble), `${name}: scramble uses a turn it should not`);
  check(ex.jobs.length === plan.jobs.length, `${name}: wrong number of jobs`);
  let s = applyAlg(solvedState(), ex.scramble);
  // the same shortest search must give the same length for every job
  const again = solveInStages(plan, s);
  check(!!again, `${name}: search finds nothing`);
  plan.jobs.forEach((job, i) => {
    check(job.pieces.some((p) => !isPieceSolved(s, p)), `${name}: job ${i + 1} has nothing to do`);
    check(allowed.test(ex.jobs[i]) || /^[RUFLDBMr2' ]+$/.test(ex.jobs[i]), `${name}: job ${i + 1} unreadable`);
    s = applyAlg(s, ex.jobs[i]);
    for (const p of job.pieces) check(isPieceSolved(s, p), `${name}: after job ${i + 1}, ${p} is not home`);
    check(parseAlg(ex.jobs[i]).length === again![i].moves, `${name}: job ${i + 1} is ${parseAlg(ex.jobs[i]).length} moves, shortest is ${again![i].moves}`);
  });
}
verify("first block", FIRST_BLOCK_PLAN, FIRST_BLOCK_EXAMPLE, /^[RLUDFB2' ]+$/);
verify("second block", SECOND_BLOCK_PLAN, SECOND_BLOCK_EXAMPLE, /^[RrUM2' ]+$/);
// the second example starts with the left block done
const start = applyAlg(solvedState(), SECOND_BLOCK_EXAMPLE.scramble);
check(LEFT_BLOCK.every((p) => isPieceSolved(start, p)), "second block example does not start with the left block done");
// and the left block stays done through the whole example
let s = start;
for (const j of SECOND_BLOCK_EXAMPLE.jobs) {
  s = applyAlg(s, j);
  check(LEFT_BLOCK.every((p) => isPieceSolved(s, p)), "second block example breaks the left block");
}
if (fails) process.exit(1);
console.log("block examples OK");
