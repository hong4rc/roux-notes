import { useMemo } from "react";
import type { State } from "../../shared/cube";
import { chainsOfMap, edgeHomes, pieceEffect, traceEdges, type Chain, type EdgePos } from "../../shared/lse-trace";
import { tr } from "../lib/i18n";

const chip = (p: string, bad?: boolean) => (
  <b key={p} className={bad ? "bad-text" : undefined} style={{ whiteSpace: "nowrap" }}>
    {p}
    {bad ? "✗" : ""}
  </b>
);

/**
 * Why an EO algorithm works, told edge by edge. Every edge is named by the place it stands at the start.
 * The rule to check by hand: an M or M' turn flips the four edges in the middle slice; an edge that is bad
 * must be swept by the slice an odd number of times, an edge that is good an even number of times.
 */
export function EoStory({ alg, bad, open }: { alg: string; bad: readonly string[]; open?: boolean }) {
  const trace = useMemo(() => traceEdges(alg, bad), [alg, bad]);
  return (
    <details className="eo-story" open={open}>
      <summary>{tr("Vì sao đúng? Cạnh nào đi đâu", "Why it works: which edge goes where")}</summary>
      <p className="small">
        {tr(
          <>
            Mỗi nước <b>M</b> hoặc <b>M'</b> <b>lật cả bốn cạnh đang nằm trong lát giữa</b> (UF, UB, DF, DB). Nước <b>U</b> không lật gì, chỉ đẩy cạnh tầng trên đi vòng:
            UF→UL→UB→UR→UF (U'  thì đi vòng ngược lại).
          </>,
          <>
            Every <b>M</b> or <b>M'</b> turn <b>flips all four edges in the middle slice</b> (UF, UB, DF, DB). A <b>U</b> turn flips nothing; it only moves the top edges around:
            UF→UL→UB→UR→UF (U' goes the other way).
          </>,
        )}
      </p>
      <div style={{ overflowX: "auto" }}>
        <table className="small edge-grid" style={{ textAlign: "center" }}>
          <thead>
            <tr>
              <th>{tr("Sau nước", "After")}</th>
              {trace.ledger.map((l) => (
                <th key={l.edge}>{chip(l.edge, l.bad)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="muted">
              <td>{tr("đầu", "start")}</td>
              {trace.ledger.map((l) => (
                <td key={l.edge}>{l.edge}</td>
              ))}
            </tr>
            {trace.steps.map((s, i) => (
              <tr key={i}>
                <td>
                  <b>{s.move}</b>
                </td>
                {trace.ledger.map((l) => {
                  const flipped = s.flipped.includes(l.edge);
                  return (
                    <td key={l.edge} style={flipped ? { background: "var(--accent-soft, #ffe9b8)", fontWeight: 700 } : undefined}>
                      {s.at[l.edge]}
                      {flipped ? " ⟲" : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td>{tr("Số lần lật", "Flips")}</td>
              {trace.ledger.map((l) => (
                <td key={l.edge}>
                  <b>{l.flips}</b>
                </td>
              ))}
            </tr>
            <tr>
              <td>{tr("Kết quả", "Result")}</td>
              {trace.ledger.map((l) => (
                <td key={l.edge} className={l.ok ? undefined : "bad-text"}>
                  {l.ok ? "✓" : "✗"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="small muted" style={{ marginBottom: 4 }}>
        {tr(
          "Đọc bảng: mỗi cột là một cạnh (gọi theo chỗ đứng lúc đầu, ✗ là cạnh xấu); ô cho biết sau mỗi nước cạnh đó đang ở đâu; ⟲ là nước vừa lật nó.",
          "Reading the grid: each column is one edge (named by its starting place, ✗ is a bad edge); a cell shows where that edge is after each turn; ⟲ marks the turn that just flipped it.",
        )}
      </p>
      <p className="small" style={{ marginBottom: 4 }}>
        <b>{tr("Tự kiểm tra:", "Check it yourself:")}</b>{" "}
        {tr(
          "đếm số ⟲ trong mỗi cột. Cạnh xấu phải có số lẻ, cạnh tốt số chẵn (0, 2 hoặc 4).",
          "count the ⟲ in each column. A bad edge needs an odd number, a good edge an even number (0, 2 or 4).",
        )}
      </p>
    </details>
  );
}

/** the chains of "edge now at X belongs at Y", e.g. DB→UF→DF→DB is a closed chain; a lone DB→UL is open */
function chainsOf(pairs: { belongsAt: EdgePos; nowAt: EdgePos | undefined }[]): Chain[] {
  const next = new Map<EdgePos, EdgePos>();
  for (const p of pairs) if (p.nowAt && p.nowAt !== p.belongsAt) next.set(p.nowAt, p.belongsAt);
  return chainsOfMap(next);
}

/**
 * "Which edge has to go to which place": for the given positions, the edge that belongs at each position is
 * looked up in the state; the line lists where it stands now and where it must go.
 */
export function EdgeMoves({ state, positions }: { state: State; positions: EdgePos[] }) {
  const chains = useMemo(() => chainsOf(edgeHomes(state, positions)), [state, positions]);
  if (!chains.length) return <div className="small muted">{tr("Mọi cạnh đã đúng chỗ.", "Every edge is already in place.")}</div>;
  const allClosed = chains.every((c) => c.closed);
  const moving = new Set(chains.flatMap((c) => c.nodes));
  const still = positions.filter((p) => !moving.has(p));
  const lens = chains.map((c) => c.nodes.length).sort().join("+");
  const title = !allClosed
    ? tr("Cạnh cần về chỗ", "Edges that need to go home")
    : lens === "3"
      ? tr(`Vòng ba cạnh${still.length === 1 ? ` (${still[0]} đứng yên)` : ""}`, `Three-edge cycle${still.length === 1 ? ` (${still[0]} stays)` : ""}`)
      : lens === "2+2"
        ? tr("Đổi hai cặp cạnh", "Two pairs swapped")
        : lens === "2"
          ? tr("Đổi chỗ hai cạnh", "Two edges swapped")
          : tr("Các cạnh đổi chỗ", "Edges moved");
  return (
    <div className="small edge-moves" style={{ textAlign: "left" }}>
      <div>
        <b>{title}</b>
      </div>
      {chains.map((c, i) => (
        <div key={i}>
          {c.nodes
            .map((from, k) => {
              const to = c.nodes[k + 1] ?? (c.closed ? c.nodes[0] : undefined);
              return to ? `${tr("cạnh ở", "edge at")} ${from} → ${to}` : null;
            })
            .filter(Boolean)
            .join("; ")}
        </div>
      ))}
      <div className="muted">
        {tr(
          "“Cạnh ở A → B”: cạnh đang đứng ở A phải được đưa tới B.",
          "“Edge at A → B”: the edge standing at A has to be brought to B.",
        )}
      </div>
    </div>
  );
}

/**
 * The building blocks of an LSE step with what each one does, worked out on the cube engine's model: which edges it flips
 * and which edge goes to which place. Knowing this, any longer sequence is just blocks laid one after another.
 */
export function PieceTable({ pieces }: { pieces: string[] }) {
  const rows = useMemo(() => pieces.map((alg) => ({ alg, fx: pieceEffect(alg) })), [pieces]);
  const centre = (q: number) =>
    q === 0 ? tr("đúng", "right") : q === 2 ? tr("lệch nửa vòng", "half a turn off") : tr("lệch một phần tư vòng", "a quarter turn off");
  return (
    <div className="table-scroll">
      <table className="tbl small">
        <thead>
          <tr>
            <th>{tr("Chuỗi", "Sequence")}</th>
            <th>{tr("Lật cạnh đang ở", "Flips the edge at")}</th>
            <th>{tr("Cạnh đi", "Edges travel")}</th>
            <th>{tr("Tâm giữa", "Slice centres")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ alg, fx }) => (
            <tr key={alg}>
              <td>
                <code translate="no">{alg}</code>
              </td>
              <td>{fx.flipped.length ? fx.flipped.join(", ") : <span className="muted">{tr("không cạnh nào", "none")}</span>}</td>
              <td>
                {fx.cycles.length ? (
                  fx.cycles.map((c, i) => (
                    <div key={i} style={{ whiteSpace: "nowrap" }}>
                      {c.join(" → ")} → {c[0]}
                    </div>
                  ))
                ) : (
                  <span className="muted">{tr("đứng yên", "stay")}</span>
                )}
              </td>
              <td>{centre(fx.centreQuarters)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
