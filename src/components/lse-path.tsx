import { useMemo, type ReactNode } from "react";
import { applyAlg, solvedState } from "../../shared/cube";
import { flipEdges } from "../../shared/lse-space";
import data from "../data/lse-data.json";
import { tr } from "../lib/i18n";
import { href } from "../lib/router";
import { LseView } from "./lse-view";
import { AlgText, Fig } from "./ui";

const S = solvedState();
const LEFT_PAIR = "0,4";
const RIGHT_PAIR = "0,1";

function StepCard({ n, title, picture, caption, idea }: { n: number; title: string; picture: ReactNode; caption: ReactNode; idea: ReactNode }) {
  return (
    <div className="card" style={{ flex: "1 1 240px", minWidth: 0 }}>
      <h3 style={{ marginTop: 0 }}>
        {n}. {title}
      </h3>
      <Fig caption={caption}>{picture}</Fig>
      <p style={{ marginBottom: 0 }}>{idea}</p>
    </div>
  );
}

/**
 * The learning path of the last step in three cards, each with one picture and the one-line idea of its moves.
 * Every picture is a real state of the cube engine: the arrow is M' U M applied backwards from solved, the UL/UR
 * example and the 4c example are cases stored in the lookup data with the algorithm that solves them.
 */
export function LsePath() {
  const arrow = useMemo(() => flipEdges(S, ["UF", "UL", "UR", "DF"]), []);
  const ulur = useMemo(() => data.ulur.find((c) => c.left === "UF" && c.right === "UB" && c.alg)!, []);
  const ulurState = useMemo(() => applyAlg(S, ulur.scramble), [ulur]);
  const l4e = useMemo(() => data.l4e.find((c) => c.alg === "U2 M U2 M'") ?? data.l4e.find((c) => c.alg)!, []);
  const l4eState = useMemo(() => applyAlg(S, l4e.scramble), [l4e]);
  return (
    <>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "12px 0" }}>
        <StepCard
          n={1}
          title={tr("Lật cạnh cho ngửa hết (EO)", "Flip the edges so they all face up (EO)")}
          picture={<LseView state={arrow} mode="eo" width={130} />}
          caption={tr(
            "Dạng “mũi tên” (Rouxvolution gọi là Arrow): ba cạnh xấu ở trên, cạnh tốt duy nhất ở sau, một cạnh xấu ở dưới-trước. Hình trái nhìn từ trên, hình phải nhìn từ dưới lên.",
            "The “arrow” pattern (Rouxvolution calls it Arrow): three bad edges on top, the only good one at the back, one bad edge at the bottom front. Left picture seen from above, right picture seen from below.",
          )}
          idea={tr(
            <>
              Ý chính: M lật cả bốn cạnh ở lát giữa, U chọn cạnh nào vào lát giữa. Dạng trên chỉ cần <AlgText alg="M' U M" />.
            </>,
            <>
              The idea: M flips all four edges in the middle slice, U chooses which edges go into the slice. The pattern above needs only <AlgText alg="M' U M" />.
            </>,
          )}
        />
        <StepCard
          n={2}
          title={tr("Đưa hai cạnh trái và phải về đúng chỗ (UL và UR)", "Put the left and right edges in place (UL and UR)")}
          picture={<LseView state={ulurState} mode="pieces" only={[LEFT_PAIR, RIGHT_PAIR]} width={130} />}
          caption={tr(
            "Chỉ hiện hai cạnh cần đặt (cạnh trái và cạnh phải). Ở ví dụ này chúng đang ở UF và UB.",
            "Only the two edges to place are shown (the left and the right edge). In this example they are at UF and UB.",
          )}
          idea={tr(
            <>
              Ý chính: hạ cả hai cạnh xuống đáy, rồi <AlgText alg="M2" /> đưa chúng lên đúng chỗ. Ví dụ trên: <AlgText alg={ulur.alg} />.
            </>,
            <>
              The idea: drop both edges to the bottom, then <AlgText alg="M2" /> brings them up into their places. The example above: <AlgText alg={ulur.alg} />.
            </>,
          )}
        />
        <StepCard
          n={3}
          title={tr("Xếp bốn cạnh cuối (4c)", "Place the last four edges (4c)")}
          picture={<LseView state={l4eState} mode="all" width={130} />}
          caption={tr("Một trong 12 trường hợp: ba cạnh đi vòng, một cạnh đứng yên.", "One of the 12 cases: three edges cycle, one stays.")}
          idea={tr(
            <>
              Ý chính: tìm cạnh đã đúng chỗ rồi chọn chuỗi theo nó. Ví dụ trên: <AlgText alg={l4e.alg} />, chỉ dùng M và U2.
            </>,
            <>
              The idea: find the edge that is already right and pick the sequence by it. The example above: <AlgText alg={l4e.alg} />, using only M and U2.
            </>,
          )}
        />
      </div>
      <p className="small muted">
        {tr(
          <>
            Tra bảng công thức cho từng bước ở phần <a href={href("/lse/tra-cuu")}>Tra cứu: EO, UL/UR, 4c</a>.
          </>,
          <>
            For the algorithm tables of each step, see <a href={href("/lse/tra-cuu")}>Lookup: EO, UL/UR, 4c</a>.
          </>,
        )}
      </p>
    </>
  );
}
