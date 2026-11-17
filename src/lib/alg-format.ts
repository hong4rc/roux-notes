export interface AlgPart {
  moves: string[];
  /** how many times the group repeats; 1 means a plain move list */
  times: number;
}

/**
 * Write an algorithm the short way: a block of moves that repeats right after itself becomes
 * one group with a count, so "F R U R' U' R U R' U' R U R' U' F'" reads "F (R U R' U')3 F'".
 * Only the display changes; the move list that is copied and animated stays in full.
 */
export function compressAlg(alg: string): AlgPart[] {
  const t = alg.split(" ").filter(Boolean);
  const parts: AlgPart[] = [];
  let plain: string[] = [];
  const flush = () => {
    if (plain.length) parts.push({ moves: plain, times: 1 });
    plain = [];
  };
  let i = 0;
  while (i < t.length) {
    let best: { len: number; times: number } | null = null;
    for (let len = 2; i + 2 * len <= t.length; len++) {
      let times = 1;
      while (i + (times + 1) * len <= t.length && t.slice(i, i + len).every((m, k) => m === t[i + times * len + k])) times++;
      if (times >= 2 && (!best || len * times > best.len * best.times)) best = { len, times };
    }
    if (best) {
      flush();
      parts.push({ moves: t.slice(i, i + best.len), times: best.times });
      i += best.len * best.times;
    } else plain.push(t[i++]);
  }
  flush();
  return parts;
}
