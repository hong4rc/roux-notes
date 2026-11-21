// Edge-level story of an M/U algorithm: which edge sits where after every turn, and how many times each
// edge was flipped. It is a position model of the six LSE edges (conventions checked against the real cube
// engine in scripts/test-lse-trace.ts), used to explain *why* an algorithm works instead of only listing it.
import { solvedState, type State } from "./cube";
import { EDGE_POS, edgeColours } from "./lse-space";

export type EdgePos = (typeof EDGE_POS)[number];

/** where the edge standing at the key goes after one quarter turn */
const GO: Record<string, Record<string, EdgePos>> = {
  M: { UF: "DF", UB: "UF", DF: "DB", DB: "UB" },
  "M'": { UF: "UB", UB: "DB", DF: "UF", DB: "DF" },
  U: { UF: "UL", UL: "UB", UB: "UR", UR: "UF" },
  "U'": { UF: "UR", UR: "UB", UB: "UL", UL: "UF" },
};
/** M slice: the four positions an M turn sweeps */
export const SLICE: EdgePos[] = ["UF", "UB", "DF", "DB"];

export interface TraceStep {
  move: string;
  /** edges (named by the position they started in) that this turn flips */
  flipped: EdgePos[];
  /** edges that change place: [edge, from, to] */
  moved: [EdgePos, EdgePos, EdgePos][];
  /** where every edge stands after this turn, keyed by its starting position */
  at: Record<EdgePos, EdgePos>;
}

export interface EdgeLedger {
  edge: EdgePos;
  bad: boolean;
  flips: number;
  /** the edge ends up facing the right way */
  ok: boolean;
  endsAt: EdgePos;
}

export interface Trace {
  steps: TraceStep[];
  ledger: EdgeLedger[];
}

const QUARTERS: Record<string, string[]> = {
  M: ["M"],
  "M'": ["M'"],
  M2: ["M", "M"],
  U: ["U"],
  "U'": ["U'"],
  U2: ["U", "U"],
};

/** `bad` are the positions of the bad edges at the start. Each edge is named by where it starts. */
export function traceEdges(alg: string, bad: readonly string[]): Trace {
  const at = Object.fromEntries(EDGE_POS.map((p) => [p, p])) as Record<EdgePos, EdgePos>;
  const flips = Object.fromEntries(EDGE_POS.map((p) => [p, 0])) as Record<EdgePos, number>;
  const steps: TraceStep[] = [];
  for (const move of alg.split(/\s+/).filter(Boolean)) {
    const parts = QUARTERS[move];
    if (!parts) throw new Error(`lse-trace: unsupported move ${move}`);
    const before = { ...at };
    const flipped = new Set<EdgePos>();
    for (const q of parts) {
      for (const e of EDGE_POS) {
        const to = GO[q][at[e]];
        if (q[0] === "M" && SLICE.includes(at[e])) flips[e]++, flipped.add(e);
        if (to) at[e] = to;
      }
    }
    // a half turn flips an edge twice: it is not a flip
    const net = EDGE_POS.filter((e) => flipped.has(e) && parts.length === 1);
    const moved = EDGE_POS.filter((e) => before[e] !== at[e]).map((e) => [e, before[e], at[e]] as [EdgePos, EdgePos, EdgePos]);
    steps.push({ move, flipped: net, moved, at: { ...at } });
  }
  const ledger = EDGE_POS.map((edge) => {
    const isBad = bad.includes(edge);
    return { edge, bad: isBad, flips: flips[edge], ok: (isBad ? 1 : 0) % 2 === flips[edge] % 2, endsAt: at[edge] };
  });
  return { steps, ledger };
}

/** For a state with correct orientation: which place currently holds the edge that belongs at each position. */
export function edgeHomes(s: State, positions: readonly EdgePos[]): { belongsAt: EdgePos; nowAt: EdgePos | undefined }[] {
  const solved = solvedState();
  return positions.map((belongsAt) => ({
    belongsAt,
    nowAt: EDGE_POS.find((p) => edgeColours(s, p) === edgeColours(solved, belongsAt)),
  }));
}

/** a run of places following a place-to-place map; `closed` when the last one leads back to the first */
export interface Chain {
  nodes: EdgePos[];
  closed: boolean;
}

/** the chains of a place-to-place map, e.g. {DB: UF, UF: DB} gives one closed chain [DB, UF]; {DB: UL} an open chain [DB, UL] */
export function chainsOfMap(next: ReadonlyMap<EdgePos, EdgePos>): Chain[] {
  const targets = new Set(next.values());
  const seen = new Set<EdgePos>();
  const out: Chain[] = [];
  // open chains start where nothing leads in; what is left afterwards are closed cycles
  const order = [...[...next.keys()].filter((k) => !targets.has(k)), ...next.keys()];
  for (const start of order) {
    if (seen.has(start)) continue;
    const nodes: EdgePos[] = [];
    let cur: EdgePos | undefined = start;
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      nodes.push(cur);
      cur = next.get(cur);
    }
    out.push({ nodes, closed: next.get(nodes[nodes.length - 1]) === nodes[0] });
  }
  return out;
}

/** the cycles of a place-to-place map that is a permutation, e.g. {DB: UF, UF: DB} gives [[DB, UF]] (DB→UF→DB) */
export const cyclesOfMap = (next: ReadonlyMap<EdgePos, EdgePos>): EdgePos[][] => chainsOfMap(next).map((c) => c.nodes);

export interface PieceEffect {
  /** the edge standing at each of these places is flipped (net) */
  flipped: EdgePos[];
  /** where edges travel, as cycles of places: [UF, DB] means the edge at UF goes to DB and the edge at DB goes to UF */
  cycles: EdgePos[][];
  /** the middle-slice centres end this many quarter turns round (0, 1, 2 or 3) */
  centreQuarters: number;
}

/** What one short M/U sequence does to the six edges and the centres, from a solved cube. */
export function pieceEffect(alg: string): PieceEffect {
  const { ledger } = traceEdges(alg, []);
  const next = new Map<EdgePos, EdgePos>();
  for (const l of ledger) if (l.endsAt !== l.edge) next.set(l.edge, l.endsAt);
  let q = 0;
  for (const t of alg.split(/\s+/).filter(Boolean)) if (t[0] === "M") q += t.endsWith("'") ? 3 : t.endsWith("2") ? 2 : 1;
  return {
    flipped: ledger.filter((l) => l.flips % 2 === 1).map((l) => l.edge),
    cycles: cyclesOfMap(next),
    centreQuarters: q % 4,
  };
}
