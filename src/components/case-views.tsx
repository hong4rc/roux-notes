import { memo } from "react";
import type { State } from "../../shared/cube";
import { LLTop } from "./ll-top";

/** Last layer as seen from above: front of the cube is at the bottom of the picture. */
export const CaseTop = memo(function CaseTop({
  state,
  width = 150,
  title,
  neutral,
  outlinePairs,
}: {
  state: State;
  width?: number;
  title?: string;
  /** colour-free: only the top colour is coloured, the side stickers are grey */
  neutral?: boolean;
  /** one shared outline around each pair of side stickers of the same colour */
  outlinePairs?: boolean;
}) {
  return <LLTop state={state} show="corners" width={width} title={title} neutral={neutral} outlinePairs={outlinePairs} />;
});

/** Only the stickers that carry the top colour; the shape every orientation step starts from. */
export const OrientTop = memo(function OrientTop({ state, width = 130, title }: { state: State; width?: number; title?: string }) {
  return <LLTop state={state} show="corners" onlyColor={0} width={width} title={title} />;
});
