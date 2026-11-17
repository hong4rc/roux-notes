import { tr } from "../lib/i18n";
import { applyAlg, type State } from "../../shared/cube";
import { uCornersSolvedUpToAuf } from "../../shared/roux";
import { ALL_CORNER_STATES, GROUPS, orientationOf, type GroupId } from "./cmll";
import { ORIENT_ALGS, PERMUTE_ALGS, type OrientAlg } from "./two-look";

const AUF = ["", "U", "U2", "U'"];
const len = (s: string) => (s ? s.split(" ").length : 0);
const topUp = (s: State) => orientationOf(s).every((o) => o === 0);

export interface Look {
  kind: "orient" | "permute" | "auf";
  /** the orientation group or the permutation id, used to link to its card on the 2-look page */
  key?: string;
  /** the name of the case alone, e.g. "T (Chameleon)" */
  name?: string;
  title: string;
  pre: string;
  alg: string;
  post: string;
  note?: string;
}

export interface TwoLookPlan {
  looks: Look[];
  /** state at the start of each look, plus the final state */
  states: State[];
  moves: number;
}

function bestWrap(state: State, algs: { alg: string; label: string; key: string; name: string }[], goal: (s: State) => boolean) {
  let best: { pre: string; post: string; alg: string; label: string; key: string; name: string; cost: number } | null = null;
  for (const a of algs)
    for (const pre of AUF)
      for (const post of AUF) {
        const r = applyAlg(state, `${pre} ${a.alg} ${post}`);
        if (!goal(r)) continue;
        const cost = len(a.alg) + len(pre) + len(post) + (pre ? 0.2 : 0) + (post ? 0.2 : 0);
        if (!best || cost < best.cost) best = { pre, post, alg: a.alg, label: a.label, key: a.key, name: a.name, cost };
      }
  return best;
}

export function planTwoLook(start: State): TwoLookPlan | null {
  const looks: Look[] = [];
  const states: State[] = [start];
  let cur = start;
  if (!topUp(cur)) {
    const b = bestWrap(
      cur,
      ORIENT_ALGS.map((a) => ({ alg: a.alg, key: a.group, name: a.name, label: tr(`Lượt 1 – xoay hướng: ${a.name}`, `Look 1 – orient: ${a.name}`) })),
      topUp,
    );
    if (!b) return null;
    // an orientation algorithm may end with a U turn only by accident; keep AUF out of the post slot
    const full = applyAlg(cur, `${b.pre} ${b.alg} ${b.post}`);
    looks.push({ kind: "orient", key: b.key, name: b.name, title: b.label, pre: b.pre, alg: b.alg, post: b.post });
    cur = full;
    states.push(cur);
  }
  if (uCornersSolvedUpToAuf(cur) === null) {
    const b = bestWrap(
      cur,
      PERMUTE_ALGS.map((p) => ({ alg: p.alg, key: p.id, name: p.name, label: tr(`Lượt 2 – hoán vị: ${p.name}`, `Look 2 – permute: ${p.name}`) })),
      (s) => uCornersSolvedUpToAuf(s) === 0,
    );
    if (!b) return null;
    looks.push({ kind: "permute", key: b.key, name: b.name, title: b.label, pre: b.pre, alg: b.alg, post: b.post });
    cur = applyAlg(cur, `${b.pre} ${b.alg} ${b.post}`);
    states.push(cur);
  } else {
    const k = uCornersSolvedUpToAuf(cur)!;
    if (k) {
      const post = AUF[k];
      looks.push({ kind: "auf", title: tr("Chỉ cần căn chỉnh tầng trên", "Only the top layer needs lining up"), pre: "", alg: "", post });
      cur = applyAlg(cur, post);
      states.push(cur);
    }
  }
  return { looks, states, moves: looks.reduce((n, l) => n + len(l.pre) + len(l.alg) + len(l.post), 0) };
}

/** A state of this orientation shape on which the orientation algorithm works with no U turn first. */
export function canonicalForOrient(a: OrientAlg): State {
  for (const s of ALL_CORNER_STATES) {
    if (topUp(s.state)) continue;
    const shape = ORIENT_ALGS.filter((x) => applyAlg(s.state, x.alg) && topUp(applyAlg(s.state, x.alg)));
    if (shape.some((x) => x.group === a.group) && topUp(applyAlg(s.state, a.alg))) return s.state;
  }
  throw new Error(`no canonical state for ${a.name}`);
}

export const GROUP_LABEL = (g: GroupId) => GROUPS[g].label;
