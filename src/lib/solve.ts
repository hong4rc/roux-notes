// A whole Roux solve worked out by the computer: first block, second block, CMLL, LSE.
// The blocks are found by a shortest-solution search; CMLL and LSE use the algorithms the site teaches.
import { applyAlg, isPieceSolved, parseAlg, solvedState, type State } from "../../shared/cube";
import { makeBlockSolver, type BlockSolver } from "../../shared/block-solver";
import { LEFT_BLOCK, RIGHT_BLOCK, blocksSolved, centersSolved, signatureKey, uCornerSignature, uCornersSolvedUpToAuf } from "../../shared/roux";
import { distToGoal, eoDone, lookupState, pathFrom, ulurDone, type Dist } from "../../shared/lse-space";
import { CMLL_BY_ID, GROUPS, lookupBySignature } from "../data/cmll";
import { planTwoLook } from "../data/two-look-plan";
import { tr } from "./i18n";
import { lseSpace } from "./scramble";

export type Level = "basic" | "advanced";
export type StepId = "fb" | "sb" | "cmll" | "lse";

export type PartKind = "fb" | "sb" | "orient" | "permute" | "one-look" | "auf" | "eo" | "ulur" | "l4e" | "l6e";

export interface Part {
  kind: PartKind;
  label: string;
  pre: string;
  alg: string;
  post: string;
  /** page that teaches this part (with ?at= to land on the right card) */
  link: string;
  caseId?: string;
  /** state after this part, filled in when the part is applied */
  after?: State;
}

export interface Step {
  id: StepId;
  parts: Part[];
  /** state at the start of the step */
  before: State;
  after: State;
  moves: number;
}

export interface Solution {
  steps: Step[];
  moves: number;
  /** every move of the solve in order, U alignment turns included */
  text: string;
}

const count = (s: string) => (s.trim() ? parseAlg(s).length : 0);
const partMoves = (p: Part) => count(p.pre) + count(p.alg) + count(p.post);
const join = (...xs: string[]) => xs.filter((x) => x.trim()).join(" ");

let fb: BlockSolver | null = null;
let sb: BlockSolver | null = null;
// first block: any outer turn plus M and r, so the search is not tied to one style; second block: R, r, M, U only (the left block cannot move)
const firstBlock = () =>
  (fb ??= makeBlockSolver({ faces: ["R", "U", "F", "L", "D", "B", "M", "r"], pieces: ["DL", "FL", "BL", "DFL", "DBL"], tables: [[0, 1, 2, 3], [0, 1, 2, 4]] }));
const secondBlock = () =>
  (sb ??= makeBlockSolver({ faces: ["R", "U", "M", "r"], pieces: ["DR", "FR", "BR", "DFR", "DBR", "F"], tables: [[0, 1, 2, 3, 5], [0, 1, 2, 4, 5]] }));

let lseDist: { eo: Dist; ulur: Dist; all: Dist } | null = null;
function lseTables() {
  if (lseDist) return lseDist;
  const sp = lseSpace();
  const S = solvedState();
  lseDist = { eo: distToGoal(sp, eoDone), ulur: distToGoal(sp, ulurDone), all: distToGoal(sp, (s) => s.every((v, i) => v === S[i])) };
  return lseDist;
}

export class SolveError extends Error {}

/** L and R centres must stay home: the scramble may use any turn except whole-cube turns and wide turns that carry them away */
export function checkScramble(scramble: string): State {
  let s: State;
  try {
    s = applyAlg(solvedState(), scramble);
  } catch {
    throw new SolveError(tr("Không đọc được scramble. Chỉ dùng các chữ R L U D F B M E S (thêm ' hoặc 2).", "Cannot read the scramble. Use only the letters R L U D F B M E S (with ' or 2)."));
  }
  if (!isPieceSolved(s, "L") || !isPieceSolved(s, "R"))
    throw new SolveError(
      tr(
        "Scramble làm lệch tâm trái hoặc phải (có xoay cả khối hoặc nước rộng). Trang chỉ giải khi cube vẫn cầm như lúc bắt đầu.",
        "The scramble moves the left or right centre (a whole-cube turn or a wide turn). The page only solves a cube still held the way it started.",
      ),
    );
  return s;
}

/** the whole solve at once (tests, scripts) */
export function solveRoux(scramble: string, level: { cmll: Level; lse: Level }): Solution {
  const it = solveRouxSteps(scramble, level);
  for (let r = it.next(); ; r = it.next()) if (r.done) return r.value;
}

/** the solve one step at a time, so a page can show each step as soon as it is found */
export function* solveRouxSteps(scramble: string, level: { cmll: Level; lse: Level }): Generator<Step, Solution> {
  let s = checkScramble(scramble);
  const steps: Step[] = [];
  const push = (id: StepId, parts: Part[]) => {
    const before = s;
    for (const p of parts) {
      s = applyAlg(s, join(p.pre, p.alg, p.post));
      p.after = s;
    }
    steps.push({ id, parts, before, after: s, moves: parts.reduce((n, p) => n + partMoves(p), 0) });
  };
  const fail = (what: string) => {
    throw new SolveError(tr(`Lỗi trong bước ${what}: kết quả không đúng. Hãy báo lỗi kèm scramble.`, `Error in the ${what} step: the result is wrong. Please report it with the scramble.`));
  };

  // 1. first block
  const a = firstBlock().solve(s);
  if (!a) throw new SolveError(tr("Không tìm được khối đầu trong giới hạn tìm kiếm.", "No first block found within the search limit."));
  push("fb", [{ kind: "fb", label: tr("Khối đầu", "First block"), pre: "", alg: a.alg, post: "", link: "/learn/first-block" }]);
  if (!LEFT_BLOCK.every((p) => isPieceSolved(s, p))) fail(tr("khối đầu", "first block"));
  yield steps[steps.length - 1];

  // 2. second block (and the M-slice centres lined up)
  const b = secondBlock().solve(s);
  if (!b) throw new SolveError(tr("Không tìm được khối thứ hai trong giới hạn tìm kiếm.", "No second block found within the search limit."));
  push("sb", [{ kind: "sb", label: tr("Khối thứ hai", "Second block"), pre: "", alg: b.alg, post: "", link: "/learn/second-block" }]);
  if (!blocksSolved(s) || !centersSolved(s) || !RIGHT_BLOCK.every((p) => isPieceSolved(s, p))) fail(tr("khối thứ hai", "second block"));
  yield steps[steps.length - 1];

  // 3. CMLL
  if (level.cmll === "basic") {
    const plan = planTwoLook(s);
    if (!plan) fail("CMLL");
    push(
      "cmll",
      plan!.looks.map((l) => ({
        kind: l.kind === "orient" ? ("orient" as const) : l.kind === "permute" ? ("permute" as const) : ("auf" as const),
        label:
          l.kind === "orient"
            ? tr(`Lượt 1: xoay hướng bốn góc – case ${l.name}`, `Look 1: orient the four corners – case ${l.name}`)
            : l.kind === "permute"
              ? tr(`Lượt 2: đổi chỗ góc – ${l.name}`, `Look 2: swap corners – ${l.name}`)
              : l.title,
        pre: l.pre,
        alg: l.alg,
        post: l.post,
        link: l.kind === "orient" ? `/cmll/2-look?at=orient-${l.key!.toLowerCase()}` : l.kind === "permute" ? `/cmll/2-look?at=perm-${l.key}` : "/cmll/2-look",
      })),
    );
  } else {
    const hit = lookupBySignature(signatureKey(uCornerSignature(s)));
    if (!hit) fail("CMLL");
    if (hit!.caseId === null) {
      if (hit!.post) push("cmll", [{ kind: "auf", label: tr("Chỉ cần căn chỉnh tầng trên", "Only the top layer needs lining up"), pre: "", alg: "", post: hit!.post, link: "/cmll" }]);
      else push("cmll", []);
    } else {
      const c = CMLL_BY_ID.get(hit!.caseId)!;
      push("cmll", [{ kind: "one-look", label: tr(`Một lượt: case ${GROUPS[c.group].label} · ${c.sourceName}`, `One look: case ${GROUPS[c.group].label} · ${c.sourceName}`), pre: hit!.pre, alg: c.algs[0].alg, post: hit!.post, link: `/cmll/${c.id}`, caseId: c.id }]);
    }
  }
  if (uCornersSolvedUpToAuf(s) !== 0 || !blocksSolved(s)) fail("CMLL");
  yield steps[steps.length - 1];

  // 4. LSE, on the M and U moves only
  const sp = lseSpace();
  const t = lseTables();
  const at = lookupState(sp, s);
  if (at === undefined) fail("LSE");
  const walk = (from: State, d: Dist, label: string, at: "eo" | "ulur" | "l4e" | "l6e"): Part => {
    const i = lookupState(sp, from)!;
    return { kind: at, label, pre: "", alg: pathFrom(sp, d, i), post: "", link: `/lse?at=${at}` };
  };
  if (level.lse === "basic") {
    // each part starts where the previous one ended, so build them one after another
    const parts: Part[] = [];
    let cur = s;
    for (const [d, label, at] of [
      [t.eo, tr("4a – EO: lật cạnh cho đúng hướng", "4a – EO: flip the edges the right way"), "eo"],
      [t.ulur, tr("4b – đặt cạnh trái vào UL, cạnh phải vào UR", "4b – put the left edge at UL and the right edge at UR"), "ulur"],
      [t.all, tr("4c – bốn cạnh cuối", "4c – the last four edges"), "l4e"],
    ] as const) {
      const p = walk(cur, d, label, at);
      cur = applyAlg(cur, p.alg);
      parts.push(p);
    }
    push("lse", parts);
  } else {
    push("lse", [walk(s, t.all, tr("Sáu cạnh cuối một mạch (L6E, đường ngắn nhất)", "All six edges in one go (L6E, the shortest way)"), "l6e")]);
  }
  const S = solvedState();
  if (!s.every((v, i) => v === S[i])) fail("LSE");
  yield steps[steps.length - 1];

  const text = steps.flatMap((st) => st.parts.map((p) => join(p.pre, p.alg, p.post))).filter(Boolean).join(" ");
  const moves = steps.reduce((n, st) => n + st.moves, 0);
  if (count(text) !== moves) fail(tr("đếm nước", "move count"));
  return { steps, moves, text };
}
