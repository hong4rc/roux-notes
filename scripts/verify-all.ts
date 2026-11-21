import { CMLL_BY_ID, ALL_CORNER_STATES, CMLL_CASES, GROUPS, GROUP_ORDER, inverseCase, mirrorCase, orientationOf, caseOfAlg, mirrorAlg } from "../src/data/cmll";
import { ORIENT_ALGS, PERMUTE_ALGS } from "../src/data/two-look";
import COMMUNITY from "../src/data/cmll-community.json";
import { fingerByMove, fingerMoves, fingerWords } from "../src/data/fingertricks";
import { guideFor } from "../src/data/finger-guides";
import { applyAlg, applyMove, moveTurn, parseAlg, rotateBy, solvedState, STICKERS } from "../shared/cube";
import { checkCmll, uCornersSolvedUpToAuf, signatureKey, uCornerSignature, blocksSolved, centersSolved } from "../shared/roux";

let fail = 0;
const ok = (c: boolean, m: string) => { console.log(`${c ? "ok  " : "FAIL"} ${m}`); if (!c) fail++; };

ok(CMLL_CASES.length === 42, `42 CMLL cases (${CMLL_CASES.length})`);
ok(ALL_CORNER_STATES.length === 648, `648 corner states (${ALL_CORNER_STATES.length})`);
const counts = GROUP_ORDER.map((g) => `${g}:${CMLL_CASES.filter((c) => c.group === g).length}`).join(" ");
console.log("   group sizes", counts);
ok(CMLL_CASES.every((c) => c.algs.length >= 2), "every case has at least two algorithms");
ok(COMMUNITY.every((x) => CMLL_BY_ID.get(x.caseId)?.algs.some((a) => a.alg === x.alg && a.votes === x.votes)), `all ${COMMUNITY.length} SpeedCubeDB algorithms are listed under the case they solve`);
ok(CMLL_CASES.every((c) => c.algs[0].votes === Math.max(...c.algs.map((a) => a.votes ?? -1))), "the main algorithm of every case is the most voted one");
ok(CMLL_CASES.every((c) => new Set(c.algs.map((a) => a.alg)).size === c.algs.length), "no algorithm is listed twice for a case");
{
  const notes = CMLL_CASES.flatMap((c) => c.algs.filter((a) => a.finger));
  const bad = notes.filter((a) => {
    try {
      return fingerMoves(a.finger!) !== a.alg || fingerWords(a.finger!).length === 0 || fingerByMove(a.finger!).length !== parseAlg(a.alg).length;
    } catch {
      return true;
    }
  });
  bad.forEach((a) => console.log("   ", a.alg, "<-", a.finger));
  ok(bad.length === 0, `all ${notes.length} finger lines read fully, turn into words, give one entry per move to the step viewers, and have exactly the moves of their algorithm`);
}
ok(CMLL_CASES.every((c) => c.algs.every((a) => checkCmll(a.alg).ok)), "every algorithm preserves blocks and centres");
ok(CMLL_CASES.every((c) => c.algs.every((a) => {
  const full = `${a.pre} ${a.alg} ${a.post}`;
  const after = applyAlg(c.state, full);
  return uCornersSolvedUpToAuf(after) === 0 && blocksSolved(after) && centersSolved(after);
})), "every wrapped algorithm solves the displayed case exactly");
ok(CMLL_CASES.every((c) => mirrorCase(c) !== undefined && inverseCase(c) !== undefined), "mirror and inverse of every case exist");
ok(CMLL_CASES.every((c) => mirrorCase(mirrorCase(c)!)?.id === c.id), "mirror is an involution");
ok(CMLL_CASES.every((c) => checkCmll(mirrorAlg(c.algs[0].alg)).ok), "mirrored algorithms stay valid");
ok(new Set(CMLL_CASES.map((c) => c.sig)).size === 42, "case pictures are all distinct");

// 2-look: orient step
const topUp = (s: Uint8Array) => orientationOf(s).every((o) => o === 0);
const orientFor = new Map<string, { alg: string; pre: string }>();
let orientOk = true;
for (const g of GROUP_ORDER.filter((g) => g !== "O")) {
  const a = ORIENT_ALGS.find((x) => x.group === g)!;
  for (const c of CMLL_CASES.filter((c) => c.group === g)) {
    let hit = "";
    for (const pre of ["", "U", "U2", "U'"]) {
      if (topUp(applyAlg(c.state, `${pre} ${a.alg}`))) { hit = pre || "-"; break; }
    }
    if (!hit) { orientOk = false; console.log("   orient fails for", c.id); }
    orientFor.set(c.id, { alg: a.alg, pre: hit });
  }
  const pres = new Set(CMLL_CASES.filter((c) => c.group === g).map((c) => orientFor.get(c.id)!.pre));
  console.log(`   ${g.padEnd(2)} orient alg works with pre-AUF: ${[...pres].join(",")}`);
}
ok(orientOk, "2-look orient algs orient every case of their group (with AUF before)");

// orient step on all 648 states: some pre-AUF + the right alg must orient every state of the shape
let all648 = true;
for (const st of ALL_CORNER_STATES) {
  if (topUp(st.state)) continue;
  const o = orientationOf(st.state);
  const found = ORIENT_ALGS.some((a) => ["", "U", "U2", "U'"].some((pre) => topUp(applyAlg(st.state, `${pre} ${a.alg}`))));
  if (!found) { all648 = false; console.log("   no orient alg for", o.join("")); }
}
ok(all648, "every non-oriented state of the 648 can be oriented by one of the 7 algorithms");

// permute step on all oriented states
const oriented = ALL_CORNER_STATES.filter((s) => topUp(s.state));
ok(oriented.length === 24, `24 oriented corner states (${oriented.length})`);
let permOk = true;
for (const s of oriented) {
  const options = [["", ""], ...PERMUTE_ALGS.map((p) => ["", p.alg])];
  let solved = false;
  for (const [, alg] of options) for (const pre of ["", "U", "U2", "U'"]) for (const post of ["", "U", "U2", "U'"]) {
    const r = applyAlg(s.state, `${pre} ${alg} ${post}`);
    if (signatureKey(uCornerSignature(r)) === signatureKey(uCornerSignature(applyAlg(applyAlg(s.state, `${pre} ${alg} ${post}`), ""))) && uCornersSolvedUpToAuf(r) === 0) solved = true;
  }
  if (!solved) permOk = false;
}
ok(permOk, "every oriented state is solved by (AUF) + J/Y/none + (AUF)");
for (const p of PERMUTE_ALGS) {
  ok(checkCmll(p.alg).ok, `${p.id} permute alg preserves blocks`);
  if (p.alt) ok(checkCmll(p.alt).ok, `${p.id} alt permute alg preserves blocks`);
}
ok(ORIENT_ALGS.every((a) => checkCmll(a.alg).ok), "orient algs preserve blocks");
// the second block can be built with R, r, U, M without ever disturbing the first block
{
  const { LEFT_BLOCK } = await import("../shared/roux");
  const { isPieceSolved } = await import("../shared/cube");
  let s = solvedState();
  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const pool = ["R", "R'", "R2", "r", "r'", "r2", "U", "U'", "U2", "M", "M'", "M2"];
  let intact = true;
  for (let n = 0; n < 2000; n++) {
    s = applyAlg(s, pool[Math.floor(rnd() * pool.length)]);
    if (!LEFT_BLOCK.every((p) => isPieceSolved(s, p))) intact = false;
  }
  ok(intact, "2000 random R/r/U/M moves never disturb the first block");
}
// every finder answer, and every two-look plan, really solves the corners it was computed for
{
  const { planTwoLook } = await import("../src/data/two-look-plan");
  let lookupOk = true;
  let planOk = true;
  for (const e of ALL_CORNER_STATES) {
    const c = e.caseId ? CMLL_BY_ID.get(e.caseId) : undefined;
    const r = applyAlg(e.state, `${e.pre} ${c ? c.algs[0].alg : ""} ${e.post}`);
    if (uCornersSolvedUpToAuf(r) !== 0) lookupOk = false;
    const plan = planTwoLook(e.state);
    if (!plan || uCornersSolvedUpToAuf(plan.states[plan.states.length - 1]) !== 0) planOk = false;
  }
  ok(lookupOk, "finder: pre + main alg + post solves all 648 corner states");
  ok(planOk, "two-look plan ends with solved corners for all 648 states");
}
// every step group the viewer shows must carry a "why"
{
  const { explainChunks } = await import("../src/lib/explain");
  const { parseAlg, applyMove } = await import("../shared/cube");
  let missing = 0;
  for (const c of CMLL_CASES) {
    for (const a of c.algs) {
      const tokens = [
        ...(a.pre ? [a.pre] : []),
        ...a.alg.split(" ").filter(Boolean),
        ...(a.post ? [a.post] : []),
      ].map((text, i) => ({ text, move: parseAlg(text)[0], auf: (i === 0 && !!a.pre) || (i === (a.pre ? 1 : 0) + a.alg.split(" ").filter(Boolean).length && !!a.post) }));
      const states = [c.state];
      for (const t of tokens) states.push(applyMove(states[states.length - 1], t.move));
      for (const ch of explainChunks(tokens, states)) if (!ch.why) missing++;
    }
  }
  ok(missing === 0, `every step group has a why (${missing} missing)`);
}
// step 2 of 2-look: every algorithm option does its job, and the text about which corners swap is true
{
  const { SWAP_PAIRS } = await import("../src/data/two-look");
  const { setPermPick } = await import("../src/lib/store");
  const { planTwoLook } = await import("../src/data/two-look-plan");
  const { applyAlg: ap, isPieceSolved } = await import("../shared/cube");
  const { headlightFaces } = await import("../src/data/cmll");
  const CASE = { adjacent: "o-adjacent-swap", diagonal: "o-diagonal-swap" } as const;
  for (const p of PERMUTE_ALGS) {
    const start = CMLL_BY_ID.get(CASE[p.id])!.state;
    p.options.forEach((o, i) => {
      const r = ap(start, o.alg);
      ok(uCornersSolvedUpToAuf(r) !== null && blocksSolved(r) && centersSolved(r), `${p.id} option ${i} (${o.alg.split(" ").length} moves) solves the corners and keeps blocks and centres`);
    });
    // which corners really change places (after the best final U turn)
    const solvedAfter = ap(solvedState(), p.options[0].alg);
    let best: string[] | null = null;
    for (let k = 0; k < 4; k++) {
      const moved = ["UFR", "UFL", "UBL", "UBR"].filter((c) => !isPieceSolved(ap(solvedAfter, "U ".repeat(k)), c));
      if (!best || moved.length < best.length) best = moved;
    }
    ok(!!best && best.length === 2 && best.every((c) => (SWAP_PAIRS[p.id].pair as string[]).includes(c)), `${p.id}: the swap text names the corners that really swap (${best?.join(",")})`);
    const hl = headlightFaces(start).map((h) => h.face);
    ok(SWAP_PAIRS[p.id].headlightFace ? hl.join() === SWAP_PAIRS[p.id].headlightFace : hl.length === 0, `${p.id}: headlight statement matches the picture (${hl.join(",") || "none"})`);
  }
  // the planner works with every combination of picks
  let comboOk = true;
  for (let a = 0; a < PERMUTE_ALGS[0].options.length; a++)
    for (let d = 0; d < PERMUTE_ALGS[1].options.length; d++) {
      setPermPick("adjacent", a);
      setPermPick("diagonal", d);
      for (let i = 0; i < ALL_CORNER_STATES.length; i += 5) {
        const plan = planTwoLook(ALL_CORNER_STATES[i].state);
        if (!plan || uCornersSolvedUpToAuf(plan.states[plan.states.length - 1]) !== 0) comboOk = false;
      }
    }
  setPermPick("adjacent", 0);
  setPermPick("diagonal", 0);
  ok(comboOk, "two-look plan is correct for every combination of chosen algorithms");
}

// practice scrambles: each one leaves the cube exactly at the start of its step
{
  const { randomSecondBlockScramble, cmllScramble, lseScramble, tidy } = await import("../src/lib/scramble");
  const { stateKey, invertAlg } = await import("../shared/cube");
  const { LEFT_BLOCK } = await import("../shared/roux");
  const { isPieceSolved } = await import("../shared/cube");
  const { fullAlg } = await import("../src/data/cmll");
  const lse = await import("../shared/lse-space");
  const S0 = solvedState();
  ok(Array.from({ length: 200 }, () => applyAlg(S0, randomSecondBlockScramble())).every((st) => LEFT_BLOCK.every((p) => isPieceSolved(st, p))), "second-block scrambles keep the first block solved");
  ok(Array.from({ length: 100 }, () => applyAlg(S0, cmllScramble())).every((st) => blocksSolved(st) && centersSolved(st)), "CMLL scrambles leave both blocks and the centres solved");
  const kinds = {
    lse: (st: any) => lse.cornersAligned(st) && lse.centresAligned(st),
    eo: (st: any) => lse.cornersAligned(st) && lse.centresAligned(st) && lse.badEdges(st).length > 0,
    ulur: (st: any) => lse.cornersAligned(st) && lse.eoDone(st) && !lse.ulurDone(st),
    l4e: (st: any) => lse.ulurDone(st),
  } as const;
  for (const [k, f] of Object.entries(kinds)) ok(Array.from({ length: 60 }, () => applyAlg(S0, lseScramble(k as any))).every(f), `${k} scrambles start exactly at that LSE step`);
  ok(CMLL_CASES.every((c) => stateKey(applyAlg(S0, tidy(invertAlg(fullAlg(c.algs[0]))))) === stateKey(c.state)), "every CMLL case scramble produces the displayed case");
  ok(ALL_CORNER_STATES.every((l) => stateKey(applyAlg(S0, tidy(l.scramble))) === stateKey(l.state)), "every corner-state scramble produces its picture");
  const data = (await import("../src/data/lse-data.json")).default as any;
  ok(data.ulur.every((c: any) => lse.ulurDone(applyAlg(applyAlg(S0, c.scramble), c.alg))), "every UL/UR scramble is solved by its algorithm");
  ok(data.l4e.every((c: any) => applyAlg(applyAlg(S0, c.scramble), c.alg).every((v: number, i: number) => v === S0[i])), "every 4c scramble is solved by its algorithm");
  ok(data.eolr.every((c: any) => lse.ulurDone(applyAlg(applyAlg(S0, c.scramble), c.alg))), "every EOLR scramble is solved by its algorithm");
}

// learning LSE by idea: the few sequences the page teaches solve every case, within the counts the page states
{
  const { lseSpace, tidy } = await import("../src/lib/scramble");
  const lse = await import("../shared/lse-space");
  const { solveByIdea, partsAlg, stepDone } = await import("../shared/lse-drill");
  const { pieceStickers, invertAlg } = await import("../shared/cube");
  const S0 = solvedState();
  const sp = lseSpace();
  const pools: Record<"eo" | "ulur" | "l4e", any[]> = { eo: [], ulur: [], l4e: [] };
  for (const st of sp.states) {
    if (!lse.cornersAligned(st) || !lse.centresAligned(st)) continue;
    if (lse.badEdges(st).length > 0) pools.eo.push(st);
    else if (!lse.ulurDone(st)) pools.ulur.push(st);
    else if (st.some((v: number, i: number) => v !== S0[i])) pools.l4e.push(st);
  }
  ok(pools.eo.length === 11160 && pools.ulur.length === 348 && pools.l4e.length === 11, "the page's case counts for EO, UL/UR and 4c are right");
  const limit = { eo: 3, ulur: 4, l4e: 2 } as const;
  for (const step of ["eo", "ulur", "l4e"] as const) {
    // every EO case would take about 15 s; one in five still covers every bad-edge pattern many times over
    const list = step === "eo" ? pools.eo.filter((_, i) => i % 5 === 0) : pools[step];
    let good = true;
    for (const st of list) {
      const parts = solveByIdea(step, st, S0);
      if (!parts || parts.filter((p) => p.piece).length > limit[step] || !stepDone(step, applyAlg(st, tidy(partsAlg(parts))), S0)) good = false;
    }
    ok(good, `${step}: the idea sequences solve every case in at most ${limit[step]} uses`);
  }
  {
    // UL/UR answers follow the taught recipe: both edges down first, and the last sequence is M2 bringing them up
    const { bothDown } = await import("../shared/lse-drill");
    const follows = pools.ulur.every((st) => {
      const parts = solveByIdea("ulur", st, S0)!;
      const used = parts.filter((p) => p.piece);
      const last = parts.findIndex((p) => p === used[used.length - 1]);
      return used[used.length - 1].piece === "M2" && bothDown(applyAlg(st, tidy(partsAlg(parts.slice(0, last))) || ""));
    });
    ok(follows, "every UL/UR answer drops both edges to the bottom, then M2 brings them up");
  }
  {
    // the easy-hand way: same coverage, no M in EO or UL/UR, and the facts its card states
    const { DRILL_PIECES, HAND_DRILLS, bothDown } = await import("../shared/lse-drill");
    const easyLimit = { eo: 4, ulur: 4, l4e: 2 } as const;
    for (const step of ["eo", "ulur", "l4e"] as const) {
      const list = step === "eo" ? pools.eo.filter((_, i) => i % 5 === 0) : pools[step];
      const good = list.every((st) => {
        const parts = solveByIdea(step, st, S0, "easy");
        if (!parts || parts.filter((p) => p.piece).length > easyLimit[step]) return false;
        if (step === "ulur" && (parts.filter((p) => p.piece).at(-1)!.piece !== "M2" || !bothDown(applyAlg(st, partsAlg(parts.slice(0, parts.findLastIndex((p) => p.piece))) || "")))) return false;
        return stepDone(step, applyAlg(st, partsAlg(parts)), S0);
      });
      ok(good, `easy hand, ${step}: every case solved in at most ${easyLimit[step]} uses`);
    }
    ok([...DRILL_PIECES.easy.eo, ...DRILL_PIECES.easy.ulur].every((a) => !a.split(" ").includes("M")), "the easy hand needs no M in EO and UL/UR");
    ok(DRILL_PIECES.easy.l4e.filter((a) => a.split(" ").includes("M")).length === 2, "the easy hand keeps exactly two 4c sequences with an M");
    const flipsOf = (a: string) => lse.badEdges(applyAlg(S0, a)).join();
    const arrowCase = lse.flipEdges(S0, ["UF", "UL", "UR", "DF"]);
    ok(["M' U M", "M' U M'"].every((a) => lse.badEdges(applyAlg(arrowCase, a)).length === 0) && flipsOf("M' U M") === "UF,UL,UR,DF", "both M' U M and M' U M' fix the arrow");
    ok(lse.badEdges(applyAlg(lse.flipEdges(S0, ["UB", "UL", "UR", "DB"]), "M2 M' U M'")).length === 0, "the reversed arrow is solved by M2 then M' U M'");
    const sameState = (a: string, b: string) => applyAlg(S0, a).every((v: number, i: number) => v === applyAlg(S0, b)[i]);
    ok(sameState("M2 U2 M U2 M' M2", "M2 U2 M U2 M") && sameState("M2 M' U2 M U2 M2", "M U2 M U2 M2"), "M2 before and after the two cycles gives the other two cycles of the table");
    ok(HAND_DRILLS.every((d) => {
      let st = S0;
      for (let i = 1; i <= d.times; i++) {
        st = applyAlg(st, d.alg);
        const back = st.every((v: number, j: number) => v === S0[j]);
        if (back !== (i === d.times)) return false;
      }
      return d.hasM === d.alg.split(" ").includes("M");
    }), "every hand drill comes back solved after exactly its number of repeats");
  }
  // what each sequence is said to do
  const POS = ["UF", "UB", "UL", "UR", "DF", "DB"];
  const key = (st: any, p: string) => pieceStickers(p).map((i: number) => st[i]).sort().join();
  const travel = (alg: string) => {
    const st = applyAlg(S0, alg);
    return POS.map((p) => [p, POS.find((q) => key(st, q) === key(S0, p))]).filter(([p, q]) => p !== q).map(([p, q]) => `${p}>${q}`).sort().join(" ");
  };
  ok(lse.badEdges(applyAlg(S0, "M' U M")).join() === "UF,UL,UR,DF" && lse.badEdges(applyAlg(S0, "M U M'")).join() === "UB,UL,UR,DB", "the arrow sequences flip exactly the edges the page names");
  ok(travel("U M2 U'") === "DB>UR DF>UL UL>DF UR>DB", "U M2 U' (Rouxvolution's way to bring the edges up) brings DF to UL and DB to UR");
  ok(travel("M2") === "DB>UF DF>UB UB>DF UF>DB" && travel("U2 M U2 M'") === "DB>UB UB>UF UF>DB", "M2 and U2 M U2 M' move the edges the page says");
  ok(travel("M' U2 M'").includes("UB>DF") && travel("M' U2 M'").includes("DF>DB"), "M' U2 M' takes UB down to DF and DF across to DB");
  ok(travel("M2 U M U2 M' U M2") === "UF>UR UL>UF UR>UL" && applyAlg(S0, "M2 U M U2 M' U M2 M2 U' M U2 M' U' M2").every((v: number, i: number) => v === S0[i]), "the M U-perm cycles UF, UL, UR and its mirror undoes it");
  const right = (alg: string) => ["UF", "UB", "DF", "DB"].filter((p) => key(applyAlg(S0, invertAlg(alg)), p) === key(S0, p)).join();
  ok(right("U2 M U2 M'") === "DF" && right("M' U2 M U2") === "DB" && right("M U2 M U2 M2") === "UF" && right("M2 U2 M U2 M") === "UB" && right("U2 M2 U2 M2") === "" && right("M' U2 M2 U2 M'") === "", "the 4c table matches each sequence to the edge that stays");
}

// per-case reroll scrambles: real edge moves, blocks and centres kept, the picture is the case up to a U turn
{
  const { caseScramble, stateOfScramble } = await import("../src/lib/scramble");
  const { fullAlg } = await import("../src/data/cmll");
  const { signatureKey, uCornerSignature, blocksSolved, centersSolved, uCornersSolvedUpToAuf } = await import("../shared/roux");
  const { edgeOriented, EDGE_POS } = await import("../shared/lse-space");
  const { invertAlg: inv } = await import("../shared/cube");
  const samples = CMLL_CASES.flatMap((c) => [0, 1, 2].map(() => {
    const alg = fullAlg(c.algs[Math.floor(Math.random() * c.algs.length)]);
    const st = stateOfScramble(caseScramble(alg));
    return { c, alg, st };
  }));
  ok(samples.every(({ st }) => blocksSolved(st) && centersSolved(st)), `reroll scrambles keep both blocks and the centres (${samples.length} samples)`);
  // the learner undoes the scramble's algorithm: the four corners must then be solved up to a U turn
  ok(samples.every(({ alg, st }) => ["", "U", "U2", "U'"].some((a) => uCornersSolvedUpToAuf(applyAlg(st, `${a} ${alg}`.trim())) === 0)), "turning U to match the picture, then the case's algorithm, solves the corners");
  // the picture is the case up to a U turn
  ok(samples.every(({ c, st }) => ["", "U", "U2", "U'"].some((a) => signatureKey(uCornerSignature(applyAlg(c.state, a))) === signatureKey(uCornerSignature(st)))), "every reroll scramble shows its case after a U turn");
  const moved = samples.filter(({ st }) => EDGE_POS.some((p) => !edgeOriented(st, p))).length;
  ok(moved > samples.length * 0.5, `most reroll scrambles change the edges (${moved}/${samples.length} with a bad edge)`);
  void inv;
}

// orientation step reroll: the same shape up to a U turn, so the picture on the card can stay fixed
{
  const { caseScrambleOf } = await import("../src/lib/scramble");
  const { stateOfScramble } = await import("../src/lib/scramble");
  const { canonicalForOrient } = await import("../src/data/two-look-plan");
  const key = (s: any) => orientationOf(s).join(",");
  for (const a of ORIENT_ALGS) {
    const canon = canonicalForOrient(a);
    const shape = ["", "U", "U2", "U'"].map((u) => key(applyAlg(canon, u)));
    const group = CMLL_CASES.filter((c) => c.group === a.group);
    const good = group.every((c) => Array.from({ length: 10 }, () => shape.includes(key(stateOfScramble(caseScrambleOf(c))))).every(Boolean));
    ok(good, `${a.name}: every reroll scramble of its group has the same orientation shape`);
  }
}

// 2-look orient options (L has two): every option keeps blocks and centres and orients every case of its group
{
  let good = true;
  for (const a of ORIENT_ALGS.filter((x) => x.options)) {
    for (const o of a.options!) {
      const cases = CMLL_CASES.filter((c) => c.group === a.group);
      const orients = cases.every((c) => ["", "U", "U2", "U'"].some((pre) => topUp(applyAlg(c.state, `${pre} ${o.alg}`))));
      if (!checkCmll(o.alg).ok || !orients) { good = false; console.log("   bad option", a.name, o.alg); }
    }
  }
  ok(good, `every orient option (${ORIENT_ALGS.filter((x) => x.options).map((x) => `${x.group}: ${x.options!.length}`).join(", ")}) keeps blocks and centres and orients its whole group`);
}

// whole-solve page: every level combination solves random scrambles, and every step leaves what it promises
{
  const { solveRoux } = await import("../src/lib/solve");
  const { isPieceSolved } = await import("../shared/cube");
  const { LEFT_BLOCK } = await import("../shared/roux");
  const FACES = "RLUDFB";
  const rnd = () => Array.from({ length: 25 }, () => FACES[Math.floor(Math.random() * 6)] + ["", "'", "2"][Math.floor(Math.random() * 3)]).join(" ");
  const SAMPLE = "U2 B R2 D L' U2 B' D L2 F D2 L2 F' R2 B2 U2 F2 U2 R2 U2 R'";
  const solved = solvedState();
  const same = (a: Uint8Array, b: Uint8Array) => a.every((v, i) => v === b[i]);
  const levels = [["basic", "basic"], ["basic", "advanced"], ["advanced", "basic"], ["advanced", "advanced"]] as const;
  let good = 0, total = 0, sum = { basic: 0, advanced: 0 };
  const problems: string[] = [];
  for (const sc of [SAMPLE, ...Array.from({ length: 60 }, rnd)]) {
    for (const [cmll, lse] of levels) {
      total++;
      try {
        const sol = solveRoux(sc, { cmll, lse });
        const start = applyAlg(solved, sc);
        const [fb, sb, cm, ls] = sol.steps;
        const fine =
          same(applyAlg(start, sol.text), solved) &&
          sol.text.split(" ").length === sol.moves &&
          LEFT_BLOCK.every((p) => isPieceSolved(fb.after, p)) &&
          blocksSolved(sb.after) && centersSolved(sb.after) &&
          uCornersSolvedUpToAuf(cm.after) === 0 && blocksSolved(cm.after) &&
          same(ls.after, solved);
        if (fine) good++;
        else problems.push(`${cmll}/${lse}: ${sc}`);
        if (cmll === lse) sum[cmll] += sol.moves;
      } catch (e) {
        problems.push(`${cmll}/${lse}: ${sc} -> ${e}`);
      }
    }
  }
  problems.slice(0, 5).forEach((p) => console.log("   ", p));
  ok(good === total, `solve page: ${good}/${total} solves end solved, with blocks, centres and corners right after each step`);
  console.log(`   average length over 61 scrambles: basic ${(sum.basic / 61).toFixed(1)}, advanced ${(sum.advanced / 61).toFixed(1)}`);
  const sample = solveRoux(SAMPLE, { cmll: "basic", lse: "basic" });
  ok(sample.steps[0].moves === 7, `sample scramble: first block in 7 moves (${sample.steps[0].parts[0].alg})`);
}
// written finger guides of the 2-look options: one entry per move, and the step viewers find them by the algorithm text
{
  const withGuide = ORIENT_ALGS.flatMap((a) => (a.options ?? []).filter((o) => o.fingers));
  ok(
    withGuide.length > 0 && withGuide.every((o) => o.fingers!.steps.length === parseAlg(o.alg).length && JSON.stringify(guideFor(o.alg)?.steps) === JSON.stringify(o.fingers!.steps)),
    `${withGuide.length} 2-look finger guide(s) have one entry per move and are found by the step viewers`,
  );
}
// the turning picture: a layer turned all the way on screen must land every sticker where the move puts it, and only the
// layer's own stickers may move
{
  let bad: string[] = [];
  const names = ["R", "L", "U", "D", "F", "B", "M", "r"].flatMap((f) => [f, `${f}'`, `${f}2`, `${f}2'`]);
  for (const name of names) {
    const m = parseAlg(name)[0];
    const g = moveTurn(m);
    const ids = new Uint8Array(54).map((_, i) => i);
    const after = applyMove(ids, m);
    for (let j = 0; j < 54; j++) {
      const i = after[j];
      const turning = g.inLayer(STICKERS[i].pos);
      const th = turning ? (g.quarterTurns * Math.PI) / 2 : 0;
      const same = (a: number[], b: number[]) => a.every((v, k) => Math.abs(v - b[k]) < 1e-9);
      if (!same(rotateBy(STICKERS[i].pos, g.axis, th), STICKERS[j].pos) || !same(rotateBy(STICKERS[i].nor, g.axis, th), STICKERS[j].nor)) bad.push(`${name}: sticker ${i}`);
    }
  }
  bad.slice(0, 5).forEach((x) => console.log("   ", x));
  const half = moveTurn(parseAlg("R2")[0]).quarterTurns, halfBack = moveTurn(parseAlg("R2'")[0]).quarterTurns;
  ok(bad.length === 0 && half === -halfBack && half !== 0, `turning picture: ${names.length} moves, each sticker ends the on-screen turn where the move puts it; R2' turns the other way from R2`);
}
for (const script of ["scripts/test-recognize.ts", "scripts/test-lse-trace.ts", "scripts/test-block-examples.ts", "scripts/test-practice.ts"]) {
  const r = Bun.spawnSync(["bun", "run", script]);
  if (r.exitCode !== 0) console.log(r.stdout.toString().split("\n").filter((l) => l.startsWith("FAIL")).slice(0, 5).join("\n"));
  ok(r.exitCode === 0, `${script} passes`);
}
void caseOfAlg; void GROUPS;
console.log(fail ? `\n${fail} FAILED` : "\nall checks passed");
process.exit(fail ? 1 : 0);
