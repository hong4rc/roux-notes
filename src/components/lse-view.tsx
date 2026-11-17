import { useMemo } from "react";
import { pieceStickers, type State } from "../../shared/cube";
import { EDGE_POS, edgeColours } from "../../shared/lse-space";
import { tr } from "../lib/i18n";
import { CubeIso } from "./cube-iso";

const EDGE_ST = new Set(EDGE_POS.flatMap((p) => pieceStickers(p)));
const CORNER_ST = new Set(["UFR", "UFL", "UBL", "UBR"].flatMap((p) => pieceStickers(p)));
const CENTRE_ST = new Set(["U", "F", "D", "B", "L", "R"].flatMap((p) => pieceStickers(p)));

export type LseMode = "eo" | "pieces" | "all";

/**
 * Two small cubes: the first seen from above, the second seen from below (the cube is tilted, not turned over) so the bottom edges (DF, DB) are visible.
 * mode "eo": only edges and centres; "pieces": also the U corners, but only the listed edge pieces;
 * "all": the U corners and all six edges.
 */
export function LseView({ state, mode, only, width = 150 }: { state: State; mode: LseMode; only?: string[]; width?: number }) {
  const ghost = useMemo(() => {
    const hidden = new Set<number>();
    for (let i = 0; i < 54; i++) {
      const isEdge = EDGE_ST.has(i);
      const keep = isEdge || CENTRE_ST.has(i) || (mode !== "eo" && CORNER_ST.has(i));
      if (!keep) hidden.add(i);
    }
    if (mode === "pieces" && only) {
      for (const pos of EDGE_POS) {
        if (!only.includes(edgeColours(state, pos))) for (const i of pieceStickers(pos)) hidden.add(i);
      }
    }
    return (i: number) => hidden.has(i);
  }, [state, mode, only]);
  const variant = `${mode}:${only?.join("/") ?? ""}`;
  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
      <CubeIso state={state} width={width} ghost={ghost} variant={variant} title={tr("Nhìn từ trên", "Seen from above")} />
      <CubeIso state={state} width={width} view="below" ghost={ghost} variant={variant} title={tr("Nhìn từ dưới lên (nghiêng khối để thấy mặt dưới)", "Seen from below (tilt the cube to see the bottom)")} />
    </div>
  );
}
