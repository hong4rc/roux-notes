import { useMemo } from "react";
import { applyAlg, pieceStickers, solvedState, type State } from "../../shared/cube";
import { CubeIso } from "./cube-iso";

export const FB_PIECES = ["DL", "FL", "BL", "DFL", "DBL", "L"];
export const SB_PIECES = ["DR", "FR", "BR", "DFR", "DBR", "R"];
export const CMLL_PIECES = ["UFR", "UFL", "UBL", "UBR"];
export const LSE_PIECES = ["UF", "UB", "UL", "UR", "DF", "DB"];
export const ALL_CENTRES = ["U", "F", "B", "D"];

/** A solved cube where only the listed pieces are coloured; `scramble` is applied first (to show a stage in motion). */
export function PiecesIso({
  pieces,
  yaw = 0,
  width = 180,
  scramble,
  title,
  state,
}: {
  pieces: string[];
  yaw?: number;
  width?: number;
  scramble?: string;
  title?: string;
  state?: State;
}) {
  const st = useMemo(() => state ?? (scramble ? applyAlg(solvedState(), scramble) : solvedState()), [scramble, state]);
  const shown = useMemo(() => new Set(pieces.flatMap((p) => pieceStickers(p))), [pieces]);
  return <CubeIso state={st} width={width} yaw={yaw} ghost={(i) => !shown.has(i)} variant={pieces.join()} title={title} />;
}
