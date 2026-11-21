// A block built the way the lesson teaches it: one small job at a time (the base edge, then each corner-edge pair).
// Every job is a shortest search that must keep what the earlier jobs finished, so the example follows the method
// a learner can copy, even though the moves themselves are the computer's.
import { applyAlg, type State } from "./cube";
import { makeBlockSolver, type BlockProblem, type BlockSolver } from "./block-solver";

export interface BlockPlan {
  /** the turns the search may use */
  faces: string[];
  /** the pieces that must be home after each job, cumulative */
  jobs: { pieces: string[]; tables: number[][] }[];
}

/** left block: any outer turn, so a learner is free to pick what suits them */
export const FIRST_BLOCK_PLAN: BlockPlan = {
  faces: ["R", "U", "F", "L", "D", "B"],
  jobs: [
    { pieces: ["DL"], tables: [[0]] },
    { pieces: ["DL", "FL", "DFL"], tables: [[0, 1, 2]] },
    { pieces: ["DL", "FL", "DFL", "BL", "DBL"], tables: [[0, 1, 2, 3], [0, 1, 2, 4]] },
  ],
};

/** right block: only R, r, U, M, so the left block is never touched */
export const SECOND_BLOCK_PLAN: BlockPlan = {
  faces: ["R", "U", "M", "r"],
  jobs: [
    { pieces: ["DR"], tables: [[0]] },
    { pieces: ["DR", "BR", "DBR"], tables: [[0, 1, 2]] },
    { pieces: ["DR", "FR", "BR", "DFR", "DBR", "F"], tables: [[0, 1, 2, 3, 5], [0, 1, 2, 4, 5]] },
  ],
};

export interface StageResult {
  alg: string;
  moves: number;
  after: State;
}

const solvers = new Map<BlockPlan, BlockSolver[]>();
function solversOf(plan: BlockPlan): BlockSolver[] {
  let list = solvers.get(plan);
  if (!list) {
    list = plan.jobs.map((j) => makeBlockSolver({ faces: plan.faces, pieces: j.pieces, tables: j.tables } satisfies BlockProblem));
    solvers.set(plan, list);
  }
  return list;
}

/** solve the jobs one after another; null when a job is not found */
export function solveInStages(plan: BlockPlan, start: State): StageResult[] | null {
  const out: StageResult[] = [];
  let s = start;
  for (const solver of solversOf(plan)) {
    const r = solver.solve(s);
    if (!r) return null;
    s = r.alg ? applyAlg(s, r.alg) : s;
    out.push({ alg: r.alg, moves: r.moves, after: s });
  }
  return out;
}
