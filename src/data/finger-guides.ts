// Written finger guides for whole algorithms, found by the algorithm text, so every step viewer shows them by itself.
import { tr } from "../lib/i18n";
import { CMLL_CASES } from "./cmll";
import { fingerByMove } from "./fingertricks";
import { ORIENT_ALGS } from "./two-look";

/** one entry per move of the algorithm (null: the guide says nothing about that move) and who wrote it */
export interface FingerGuide {
  by: string;
  steps: (string | null)[];
}

export function guideFor(alg: string): FingerGuide | undefined {
  const key = alg.trim();
  if (!key) return undefined;
  for (const o of ORIENT_ALGS)
    for (const opt of o.options ?? []) if (opt.alg === key && opt.fingers) return { by: opt.fingers.by, steps: opt.fingers.steps };
  for (const c of CMLL_CASES)
    for (const a of c.algs) if (a.alg === key && a.finger) return { by: tr("theo John Mark", "by John Mark"), steps: fingerByMove(a.finger) };
  return undefined;
}
