import { useEffect, useMemo, useState } from "react";
import { applyAlg, pieceStickers, solvedState, type Face, type State } from "../../shared/cube";
import { CubeIso } from "../components/cube-iso";
import { handNote } from "../data/fingertricks";
import { EDGE_POS, badEdges, buildSpace, distToGoal, edgeColours, flipEdges, lookupState, pathFrom, type Dist, type Space } from "../../shared/lse-space";
import { DRILL_PIECES, HAND_DRILLS, solveByIdea, type DrillPart, type DrillStep } from "../../shared/lse-drill";
import { lseScramble, tidy } from "../lib/scramble";
import { AlgStepper } from "../components/alg-stepper";
import { EdgeMoves, EoStory, PieceTable } from "../components/edge-story";
import { LsePath } from "../components/lse-path";
import { LseTryLab } from "../components/lse-try";
import { MoveTricks } from "../components/finger-hint";
import { LseView } from "../components/lse-view";
import { Toc } from "../components/toc";
import { AlgText, Callout, CopyButton, Fig, PageHead, ScrambleLine, Why } from "../components/ui";
import data from "../data/lse-data.json";
import { colorName, tr, useLang } from "../lib/i18n";
import { currentScheme } from "../lib/palette";
import { href } from "../lib/router";
import { setLseHand, useSettings } from "../lib/store";

/** the names of the top and bottom colours in brackets (" (vàng hoặc trắng)"), but only once the learner has told the site their cube; otherwise nothing */
function useSchemeBrackets() {
  const { schemeAsked } = useSettings();
  const sc = currentScheme();
  return schemeAsked ? ` (${colorName(sc.U)} ${tr("hoặc", "or")} ${colorName(sc.D)} ${tr("trên cube của bạn", "on your cube")})` : "";
}

const S = solvedState();
const LEFT_PAIR = "0,4";
const RIGHT_PAIR = "0,1";

/** The six edges of the last step as a small map of the cube seen from above (front at the bottom), plus the two bottom edges. */
function EdgeMap({ bad, toggle, reset }: { bad: string[]; toggle: (p: string) => void; reset: () => void }) {
  const cell = (p: string, col: number, row: number) => (
    <button
      key={p}
      type="button"
      className={`edge-cell ${bad.includes(p) ? "bad" : ""}`}
      style={{ gridColumn: col, gridRow: row }}
      aria-pressed={bad.includes(p)}
      aria-label={`${posName(p)}: ${bad.includes(p) ? tr("xấu", "bad") : tr("tốt", "good")}`}
      onClick={() => toggle(p)}
    >
      <strong>{p}</strong>
      <span className="small">{bad.includes(p) ? tr("✗ xấu", "✗ bad") : tr("✓ tốt", "✓ good")}</span>
    </button>
  );
  return (
    <div className="edge-map-wrap">
      <div className="edge-maps">
        <div>
          <div className="small muted edge-cap">{tr("Mặt trên (nhìn từ trên xuống)", "Top face (seen from above)")}</div>
          <div className="edge-map" role="group" aria-label={tr("Bốn cạnh tầng trên", "The four top edges")}>
            <span className="edge-side" style={{ gridColumn: 2, gridRow: 1 }}>{tr("sau", "back")}</span>
            {cell("UB", 2, 2)}
            {cell("UL", 1, 3)}
            <span className="edge-centre" style={{ gridColumn: 2, gridRow: 3 }}>U</span>
            {cell("UR", 3, 3)}
            {cell("UF", 2, 4)}
            <span className="edge-side" style={{ gridColumn: 2, gridRow: 5 }}>{tr("trước", "front")}</span>
          </div>
        </div>
        <div>
          <div className="small muted edge-cap">{tr("Hai cạnh dưới (nhìn từ dưới lên)", "The two bottom edges (seen from below)")}</div>
          <div className="edge-map edge-map-bottom" role="group" aria-label={tr("Hai cạnh tầng dưới", "The two bottom edges")}>
            {cell("DB", 1, 1)}
            {cell("DF", 2, 1)}
          </div>
          <p className="small muted" style={{ margin: "6px 0 0", maxWidth: 220 }}>
            {tr("DF là cạnh dưới phía trước, DB là cạnh dưới phía sau.", "DF is the bottom edge at the front, DB the bottom edge at the back.")}
          </p>
        </div>
      </div>
      <button className="btn small" onClick={reset}>
        {tr("↺ Đặt lại", "↺ Reset")}
      </button>
    </div>
  );
}

const posName = (p: string) =>
  ({
    UF: tr("UF (trên-trước)", "UF (top-front)"),
    UB: tr("UB (trên-sau)", "UB (top-back)"),
    UL: tr("UL (trên-trái)", "UL (top-left)"),
    UR: tr("UR (trên-phải)", "UR (top-right)"),
    DF: tr("DF (dưới-trước)", "DF (bottom-front)"),
    DB: tr("DB (dưới-sau)", "DB (bottom-back)"),
  })[p] ?? p;
const moves = (n: number) => tr(`${n} nước`, `${n} ${n === 1 ? "move" : "moves"}`);

export const LSE_ANCHOR_PAGE: Record<string, "" | "tra-cuu" | "nang-cao"> = {
  "tong-quan": "",
  "hoc-y-tuong": "",
  "so-lieu": "",
  eo: "tra-cuu",
  ulur: "tra-cuu",
  l4e: "tra-cuu",
  "nang-cao": "nang-cao",
  eolr: "nang-cao",
  l6e: "nang-cao",
  "l6e-solver": "nang-cao",
};

function LseTabs({ active }: { active: "" | "tra-cuu" | "nang-cao" }) {
  useLang();
  const items = [
    { id: "", to: "/lse", label: tr("Học theo ý tưởng", "Learn the ideas") },
    { id: "tra-cuu", to: "/lse/tra-cuu", label: tr("Tra cứu: EO, UL/UR, 4c", "Lookup: EO, UL/UR, 4c") },
    { id: "nang-cao", to: "/lse/nang-cao", label: tr("Nâng cao", "Advanced") },
  ];
  return (
    <nav className="bar" aria-label={tr("Các phần LSE", "LSE parts")} style={{ marginTop: 6 }}>
      {items.map((it) => (
        <a
          key={it.id}
          href={href(it.to)}
          className="chip"
          aria-current={active === it.id ? "page" : undefined}
          style={{ textDecoration: "none" }}
          onClick={(e) => {
            if (active === it.id) e.preventDefault();
          }}
        >
          {it.label}
        </a>
      ))}
    </nav>
  );
}

export function LseOverviewPage() {
  const schemeBrackets = useSchemeBrackets();
  return (
    <>
      <div className="with-toc">
        <Toc
          items={[
            { id: "tong-quan", label: tr("Đường học", "The learning path") },
            { id: "hoc-y-tuong", label: tr("Học theo ý tưởng và luyện tập", "Learn the ideas and practise") },
            { id: "so-lieu", label: tr("Số liệu và lựa chọn", "Numbers and choices") },
          ]}
        />
        <div>
          <PageHead
            title={tr("LSE: sáu cạnh cuối", "LSE: the last six edges")}
            crumbs={<a href={href("/learn")}>{tr("Học từng bước", "Learn step by step")}</a>}
            lead={tr(
              "Bước cuối của Roux. Chỉ còn sáu cạnh và các tâm lát giữa, và bạn giải chúng bằng đúng hai loại nước: M và U.",
              "The last step of Roux. Only six edges and the middle-slice centres are left, and you solve them with just two kinds of moves: M and U.",
            )}
          />
          <LseTabs active="" />
          <h2 id="tong-quan" style={{ marginTop: 0 }}>
            {tr("Đường học: ba bước", "The learning path: three steps")}
          </h2>
          <p>
            {tr(
              <>
                Sau CMLL, hai khối và bốn góc đã xong. Sáu cạnh còn lại gồm <strong>bốn cạnh ở tầng trên</strong> (UF, UB, UL, UR) và{" "}
                <strong>hai cạnh ở đáy lát giữa</strong> (DF, DB). Bạn giải chúng bằng ba bước, mỗi bước chỉ dùng nước M và U. Cộng đồng Roux gọi ba bước này là 4a, 4b và 4c.
              </>,
              <>
                After CMLL, the two blocks and the four corners are done. The six remaining edges are <strong>four edges in the top layer</strong> (UF, UB, UL, UR)
                and <strong>two edges at the bottom of the middle slice</strong> (DF, DB). You solve them in three steps, each using only M and U moves. The Roux
                community calls these three steps 4a, 4b and 4c.
              </>,
            )}
          </p>
          <LsePath />
          <p>
            {tr(
              `Cạnh “ngửa” (cạnh tốt) là cạnh có sticker màu mặt trên hoặc mặt dưới (màu của tâm trên hoặc tâm dưới)${schemeBrackets} nhìn lên hoặc nhìn xuống. Ở bước 1 bạn chưa cần đưa cạnh về đúng chỗ.`,
              `A “face-up” (good) edge has its top-or-bottom-colour sticker (the colour of the top or bottom centre)${schemeBrackets} looking up or down. In step 1 you do not need to put the edges in their places yet.`,
            )}
          </p>
          <Why title={tr("Vì sao chỉ dùng M và U?", "Why only M and U?")}>
            <p>
              {tr(
                <>
                  Hai khối nằm ở hai bên trái và phải; lát giữa M và tầng trên U không chạm vào chúng. Mọi nước M và U cũng giữ nguyên các góc ở đáy; U chỉ xoay
                  bốn góc tầng trên cùng nhau. Nên chỉ cần căn lại U ở cuối là các góc và hai khối vẫn đúng.
                </>,
                <>
                  The two blocks sit on the left and right; the M slice and the U layer do not touch them. Every M and U move also leaves the corners at the bottom
                  alone; U only turns the four top corners together. So you only need to line up U at the end and the corners and the two blocks stay correct.
                </>,
              )}
            </p>
          </Why>
          <LearnByIdea />
        </div>
      </div>
    </>
  );
}

export function LseLookupPage() {
  return (
    <>
      <div className="with-toc">
        <Toc
          items={[
            { id: "eo", label: tr("1. Xoay hướng cạnh (EO)", "1. Orient the edges (EO)") },
            { id: "ulur", label: tr("2. Cạnh UL và UR", "2. The UL and UR edges") },
            { id: "l4e", label: tr("3. Bốn cạnh cuối", "3. The last four edges") },
          ]}
        />
        <div>
          <PageHead
            title={tr("LSE: tra cứu EO, UL/UR, 4c", "LSE: lookup for EO, UL/UR, 4c")}
            crumbs={<a href={href("/lse")}>LSE</a>}
            lead={tr("Các bảng tra theo từng bước. Tìm đúng dạng cube của bạn rồi làm theo thuật toán.", "Lookup tables for each step. Find the case that matches your cube, then follow the algorithm.")}
          />
          <LseTabs active="tra-cuu" />
          <Eo />
          <Ulur />
          <L4e />
        </div>
      </div>
    </>
  );
}

export function LseAdvancedPage() {
  return (
    <>
      <div className="with-toc">
        <Toc
          items={[
            { id: "nang-cao", label: tr("Nâng cao", "Advanced") },
            { id: "eolr", label: tr("EOLR: gộp bước 1 và 2", "EOLR: steps 1 and 2 in one") },
            { id: "l6e", label: tr("L6E: sáu cạnh một mạch", "L6E: six edges in one go") },
          ]}
        />
        <div>
          <PageHead
            title={tr("LSE: nâng cao", "LSE: advanced")}
            crumbs={<a href={href("/lse")}>LSE</a>}
            lead={tr("Cách gộp bước và các thủ thuật người giỏi dùng. Đọc sau khi đã làm chắc ba bước cơ bản.", "Ways to merge steps and tricks strong solvers use. Read this once the three basic steps feel solid.")}
          />
          <LseTabs active="nang-cao" />
          <h2 id="nang-cao">{tr("Nâng cao", "Advanced")}</h2>
          <Eolr />
          <L6e />
          <h3>{tr("Nhìn trước", "Lookahead")}</h3>
          <p>
            {tr(
              "Trong LSE, cạnh DB bị che khuất. Hãy tập nhớ vị trí của nó khi nhận dạng, vì nó quyết định số cạnh “xấu” cần lật (xem bên trên).",
              "In LSE the DB edge is hidden. Practise remembering where it is when you recognise the case, because it decides how many “bad” edges you have to flip (see above).",
            )}
          </p>

          <Callout kind="info" title={tr("Về nguồn", "About the sources")}>
            <p style={{ margin: 0 }}>
              {tr(
                "Tên gọi 4a, 4b, 4c (ba bước EO, UL/UR, bốn cạnh cuối), EOLR (EO cộng cạnh trái và phải) và L6E (sáu cạnh cuối) theo cách dùng trong cộng đồng Roux (Scheopner, Rouxvolution). Ở bước EO, trang ghi cả công thức phổ biến (Rouxvolution, CubeTools) lẫn công thức chương trình tìm. Các bước còn lại dùng công thức ngắn nhất do chương trình tìm, tính sẵn và lưu lại; cộng đồng có thể dùng biến thể dài hơn nhưng dễ lướt tay hơn.",
                "The names 4a, 4b, 4c (the three steps EO, UL/UR and the last four edges), EOLR (EO plus the left and right edges) and L6E (the last six edges) follow the way the Roux community uses them (Scheopner, Rouxvolution). For EO the page gives both the common algorithms (Rouxvolution, CubeTools) and the computer's. The other steps use the shortest algorithms found by the computer, worked out once and saved; the community may use longer variants that are easier to execute.",
              )}
            </p>
          </Callout>
        </div>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ learn by idea

const ROUXVOLUTION = {
  eo: "https://rouxvolution.pages.dev/guides/eo/",
  ulur: "https://rouxvolution.pages.dev/guides/ul-ur/",
  l4e: "https://rouxvolution.pages.dev/guides/l4e/",
};
const MIDDLE = ["UF", "UB", "DF", "DB"] as const;

/** where the left and right edges are, how many edges are bad, how many of the last four sit right: one line per step */
function describeLse(step: DrillStep, s: State): string {
  if (step === "eo") {
    const bad = badEdges(s);
    if (!bad.length) return tr("Không còn cạnh xấu.", "No bad edge left.");
    const top = bad.filter((p) => p[0] === "U");
    const bottom = bad.filter((p) => p[0] === "D");
    return tr(
      `${bad.length} cạnh xấu: ${top.length} ở trên (${top.join(", ") || "không"}), ${bottom.length} ở đáy (${bottom.join(", ") || "không"}).`,
      `${bad.length} bad edges: ${top.length} on top (${top.join(", ") || "none"}), ${bottom.length} at the bottom (${bottom.join(", ") || "none"}).`,
    );
  }
  if (step === "ulur") {
    const at = (pair: string) => EDGE_POS.find((p) => edgeColours(s, p) === pair) ?? "?";
    return tr(
      `Cạnh trái (${colourOfFace("U")}–${colourOfFace("L")}) ở ${posName(at(LEFT_PAIR))}; cạnh phải (${colourOfFace("U")}–${colourOfFace("R")}) ở ${posName(at(RIGHT_PAIR))}.`,
      `The left edge (${colourOfFace("U")}–${colourOfFace("L")}) is at ${posName(at(LEFT_PAIR))}; the right edge (${colourOfFace("U")}–${colourOfFace("R")}) is at ${posName(at(RIGHT_PAIR))}.`,
    );
  }
  const right = MIDDLE.filter((p) => edgeColours(s, p) === edgeColours(S, p));
  return right.length === 4
    ? tr("Cả bốn cạnh đã đúng chỗ.", "All four edges are in place.")
    : tr(
        `${right.length} trong 4 cạnh UF, UB, DF, DB đúng chỗ${right.length ? ` (${right.join(", ")})` : ""}.`,
        `${right.length} of the 4 edges UF, UB, DF, DB in place${right.length ? ` (${right.join(", ")})` : ""}.`,
      );
}

/** a few algorithms side by side, then a short note under them */
function Algs({ list, note }: { list: string[]; note: string }) {
  return (
    <>
      <div className="alg-list">
        {list.map((a) => (
          <AlgText key={a} alg={a} />
        ))}
      </div>
      <div className="small">{note}</div>
    </>
  );
}

function IdeaCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card idea-card">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function LearnByIdea() {
  const arrow = useMemo(() => flipEdges(S, ["UF", "UL", "UR", "DF"]), []);
  const arrowMirror = useMemo(() => flipEdges(S, ["UB", "UL", "UR", "DB"]), []);
  return (
    <>
      <h2 id="hoc-y-tuong">{tr("Tự học LSE: nhớ ít, hiểu ý tưởng", "Learning LSE yourself: remember little, understand the ideas")}</h2>
      <p>
        {tr(
          "Phần Tra cứu cho công thức ngắn nhất của từng trường hợp, nhưng nhớ hết thì quá nhiều. Người chơi Roux thường học khác: nhớ vài đoạn công thức rất ngắn, hiểu mỗi đoạn làm gì, rồi tự ghép lại. Chậm hơn một chút, nhưng giải được mọi trường hợp mà không cần tra.",
          "The Lookup part gives the shortest algorithm for each case, but remembering them all is a lot. Roux solvers usually learn differently: remember a few very short pieces of algorithm, understand what each one does, and put them together yourself. A little slower, but it solves every case without looking anything up.",
        )}
      </p>
      <BlockTable />

      <div className="idea-grid">
        <IdeaCard title={tr("1. EO: tạo “mũi tên” rồi lật", "1. EO: make an “arrow”, then flip")}>
          <p>
            {tr(
              "Mỗi nước M (một phần tư vòng) lật cùng lúc bốn cạnh đang nằm trong lát giữa; U không lật cạnh nào, chỉ đổi cạnh nào đang ở lát giữa. Ghép lại, M' U M lật đúng bốn cạnh: UF, UL, UR và DF.",
              "Each quarter M move flips the four edges in the middle slice at once; U flips nothing, it only changes which edges are in the slice. Put together, M' U M flips exactly four edges: UF, UL, UR and DF.",
            )}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Fig caption={<AlgText alg="M' U M" />}>
              <LseView state={arrow} mode="eo" width={120} />
            </Fig>
            <Fig caption={<AlgText alg="M U M'" />}>
              <LseView state={arrowMirror} mode="eo" width={120} />
            </Fig>
          </div>
          <p>
            {tr(
              "Dạng “mũi tên” (tên Arrow trong hướng dẫn Rouxvolution): ba cạnh trên xấu, cạnh tốt duy nhất ở sau (UB), và cạnh xấu ở dưới-trước (DF): làm M' U M. Bản gương: cạnh tốt ở trước (UF), cạnh xấu ở dưới-sau (DB): làm M U M'.",
              "The “arrow” (named Arrow in the Rouxvolution guides): three bad top edges, the only good one at the back (UB), and a bad edge at the bottom front (DF): do M' U M. The mirror: the good one at the front (UF), a bad one at the bottom back (DB): do M U M'.",
            )}
          </p>
          <p className="small">
            {tr(
              "Chưa có mũi tên? Xoay U rồi làm một lần M' U M (hoặc gương) để đổi số cạnh xấu; lặp lại tới khi thành mũi tên. Số cạnh xấu luôn chẵn (2, 4 hoặc 6). Bài luyện bên dưới chỉ cho bạn từng bước.",
              "No arrow yet? Turn U and do M' U M (or the mirror) once to change the number of bad edges; repeat until you see an arrow. The number of bad edges is always even (2, 4 or 6). The practice below shows you each step.",
            )}
          </p>
        </IdeaCard>

        <IdeaCard title={tr("2. UL/UR: hạ xuống đáy rồi đưa lên", "2. UL/UR: drop them to the bottom, then bring them up")}>
          <ul className="idea-list">
            <li>
              <AlgText alg="M2" />: {tr("đổi chỗ hai cạnh UF, UB với hai cạnh đáy (UF↔DB, UB↔DF). Dùng để đưa cạnh xuống, và cả để đưa lên.", "swaps the UF and UB edges with the two bottom edges (UF↔DB, UB↔DF). It takes edges down, and also brings them up.")}
            </li>
            <li>
              <AlgText alg="U2 M U2 M'" />: {tr("đưa cạnh ở UF xuống DB, cạnh ở DF đứng yên. Dùng khi một cạnh đã ở đáy mà cạnh kia còn ở trên.", "takes the edge at UF down to DB while the edge at DF stays. Use it when one edge is already at the bottom and the other is still on top.")}
            </li>
          </ul>
          <ol className="idea-list">
            <li>
              {tr(
                `Đưa cả hai cạnh xuống đáy: xoay U cho cạnh trên nằm ở UF (hoặc cả hai ở UF và UB), rồi dùng một trong hai chuỗi trên. Dừng khi cả hai cạnh ở đáy và tâm ${colourOfFace("U")} cũng đang ở đáy (lát giữa lệch nửa vòng). Nếu tâm ${colourOfFace("U")} vẫn ở trên thì cần thêm một lần đổi; bài luyện chỉ cách.`,
                `Get both edges to the bottom: turn U so the top edge sits at UF (or both at UF and UB), then use one of the two sequences. Stop when both edges are at the bottom and the ${colourOfFace("U")} centre is at the bottom too (the slice is half a turn off). If the ${colourOfFace("U")} centre is still on top, one more swap is needed; the practice shows how.`,
              )}
            </li>
            <li>{tr("Chỗ của cạnh trái là giữa hai góc có màu trái, tương tự cho cạnh phải. Xoay U sao cho chỗ của cạnh đang ở DF nằm ở sau (UB), chỗ của cạnh đang ở DB nằm ở trước (UF).", "The left edge's slot is between the two corners with the left colour, and the same for the right edge. Turn U so the slot of the edge at DF is at the back (UB) and the slot of the edge at DB is at the front (UF).")}</li>
            <li>{tr("M2 đưa cả hai cạnh lên đúng chỗ và đưa tâm về đúng, rồi xoay U cho góc khớp với hai khối. (Rouxvolution viết bước này là U M2 U'.)", "M2 brings both edges up into their slots and puts the centres back, then turn U so the corners match the blocks. (Rouxvolution writes this step as U M2 U'.)")}</li>
          </ol>
          <Callout kind="tip" title={tr("Lối tắt tùy chọn: U-perm bằng M", "Optional shortcut: the U-perm with M")}>
            <p style={{ margin: 0 }}>
              {tr(
                <>
                  Khi ba cạnh trên UF, UL, UR chỉ đổi vòng cho nhau, <AlgText alg="M2 U M U2 M' U M2" /> hoặc <AlgText alg="M2 U' M U2 M' U' M2" /> xong trong
                  một lần (UF→UR, UL→UF, UR→UL và chiều ngược). Đây là công thức U-perm (Ua/Ub) quen thuộc của CFOP, viết bằng M.
                </>,
                <>
                  When the three top edges UF, UL, UR only cycle among themselves, <AlgText alg="M2 U M U2 M' U M2" /> or <AlgText alg="M2 U' M U2 M' U' M2" />{" "}
                  finishes in one go (UF→UR, UL→UF, UR→UL, and the other way round). It is the well-known U-perm (Ua/Ub) from CFOP, written with M.
                </>,
              )}
            </p>
          </Callout>
        </IdeaCard>

        <IdeaCard title={tr("3. 4c: tìm cạnh đã đúng", "3. 4c: find the edge that is already right")}>
          <p>
            {tr(
              "Nhìn bốn cạnh UF, UB, DF, DB. Đúng một cạnh: ba cạnh kia đi vòng; chọn chuỗi theo chỗ của cạnh đúng. Không cạnh nào đúng: hai cặp đổi chỗ.",
              "Look at the four edges UF, UB, DF, DB. Exactly one right: the other three cycle; pick the sequence by where the right edge is. None right: two pairs are swapped.",
            )}
          </p>
          <table className="tbl small">
            <tbody>
              {[
                [tr("DF đúng", "DF right"), "U2 M U2 M'"],
                [tr("DB đúng", "DB right"), "M' U2 M U2"],
                [tr("UF đúng", "UF right"), "M U2 M U2 M2"],
                [tr("UB đúng", "UB right"), "M2 U2 M U2 M"],
                [tr("không cạnh nào", "none right"), "U2 M2 U2 M2"],
                [tr("không cạnh nào", "none right"), "M' U2 M2 U2 M'"],
              ].map(([k, a]) => (
                <tr key={a}>
                  <td>{k}</td>
                  <td>
                    <AlgText alg={a} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="small">
            {tr(
              "Đi sai chiều? Làm lại chuỗi đó lần nữa: một vòng ba cạnh làm hai lần thì thành vòng ngược chiều. Có lúc cần xoay U2 trước để cạnh đúng nằm đúng chỗ trong bảng.",
              "Went the wrong way? Do the same sequence once more: a three-edge cycle done twice is the cycle the other way. Sometimes you need a U2 first so the right edge sits where the table says.",
            )}
          </p>
        </IdeaCard>
      </div>

      <LseDrill />
      <LseTryLab initial="eo" describe={describeLse} />
      <HandDrills />

      <LseNumbers />

      <p className="small muted">
        {tr("Nguồn ý tưởng: hướng dẫn Rouxvolution", "Where the ideas come from: the Rouxvolution guides")}{" "}
        (<a href={ROUXVOLUTION.eo} target="_blank" rel="noreferrer">EO</a>, <a href={ROUXVOLUTION.ulur} target="_blank" rel="noreferrer">UL/UR</a>,{" "}
        <a href={ROUXVOLUTION.l4e} target="_blank" rel="noreferrer">4c</a>);{" "}
        {tr("U-perm bằng M:", "U-perm with M:")}{" "}
        <a href="https://zeroplay.io/docs/rubik/tutorials/pll" target="_blank" rel="noreferrer">ZeroPlay</a>.{" "}
        {tr(
          "Các con số “tối đa” và lời giải trong bài luyện do chương trình tìm, chỉ dùng đúng các chuỗi trên.",
          "The “at most” numbers and the practice solutions were found by computer, using only the sequences above.",
        )}
      </p>
    </>
  );
}

/** the statistics, the three ways to solve LSE side by side, and the easy-hand against the standard sequences: for choosing, not for the first lesson */
function LseNumbers() {
  const st = data.stats;
  return (
    <>
      <h2 id="so-lieu">{tr("Số liệu và lựa chọn", "Numbers and choices")}</h2>
      <p>
        {tr(
          <>
            Phần này để bạn chọn cách học sau khi đã thử các bước ở trên. Toàn bộ bước LSE có <strong>{st.states.toLocaleString("vi-VN")}</strong> trạng thái và mọi
            trạng thái đều giải được trong tối đa {st.optimalMax} nước.
          </>,
          <>
            This part is for choosing how to learn once you have tried the steps above. The whole LSE step has <strong>{st.states.toLocaleString("en-US")}</strong>{" "}
            states and every one can be solved in at most {st.optimalMax} moves.
          </>,
        )}
      </p>
      <div className="table-scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th>{tr("Cách giải LSE", "LSE method")}</th>
              <th>{tr("Số nước trung bình", "Average moves")}</th>
              <th>{tr("Nhiều nhất", "Maximum")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{tr("3 bước: EO → UL/UR → 4c (phần Tra cứu)", "3 steps: EO → UL/UR → 4c (the Lookup part)")}</td>
              <td>{st.threeStepAvg}</td>
              <td>{st.threeStepMax}</td>
            </tr>
            <tr>
              <td>
                {tr(
                  "2 bước: EO và UL/UR gộp một công thức (gọi là EOLR, viết tắt của EO cộng cạnh Trái và Phải, xem phần Nâng cao) → 4c",
                  "2 steps: EO and UL/UR combined in one algorithm (called EOLR, short for EO plus the Left and Right edges, see the Advanced part) → 4c",
                )}
              </td>
              <td>{st.twoStepAvg}</td>
              <td>{st.twoStepMax}</td>
            </tr>
            <tr>
              <td>
                {tr(
                  "Giải tối ưu một mạch (L6E, viết tắt của “last six edges”, sáu cạnh cuối), do chương trình tính",
                  "Optimal solve in one go (L6E, short for “last six edges”), found by a program",
                )}
              </td>
              <td>{st.optimalAvg}</td>
              <td>{st.optimalMax}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="small muted">
        {tr(
          `Tính trên mọi trạng thái LSE mà bốn góc đã thẳng hàng với hai khối (${st.alignedStates.toLocaleString("vi-VN")} trạng thái), một nước U2 hoặc M2 tính một nước. Mọi công thức trên trang do chương trình tìm kiếm toàn bộ không gian M/U và đã được chạy lại để kiểm.`,
          `Counted over every LSE state where the four corners are already lined up with the two blocks (${st.alignedStates.toLocaleString("en-US")} states); a U2 or M2 turn counts as one move. Every algorithm on this page was found by a program that searched the whole M/U space, and was run again to check it.`,
        )}
      </p>
      <h3>{tr("Cần nhớ bao nhiêu? Hai cách chọn chuỗi", "How much do you need to remember? Two ways to choose sequences")}</h3>
      <p>
        {tr(
          "Có hai cách, đều giải được mọi trường hợp. “Dễ tay” ở đây nghĩa là chọn các đoạn công thức gần như chỉ có M', vì M' dễ gẩy hơn M. Cách này né nước M ở bước 1 và 2; bước 3 mỗi chuỗi vòng vẫn cần đúng một M, vì chỉ dùng M' thì phải gẩy tới 8 lần. Cách “chuẩn” dùng cả M và M' như Rouxvolution viết.",
          "There are two ways, and both solve every case. “Easy hand” here means choosing pieces of algorithm that are almost only M', because M' is easier to flick than M. This way avoids M in steps 1 and 2; in step 3 each cycle still needs exactly one M, because with M' alone it takes eight flicks. The “standard” way uses both M and M' as Rouxvolution writes it.",
        )}
      </p>
      <div className="table-scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th>{tr("Bước", "Step")}</th>
              <th>{tr("Dễ tay (ít nước M, gần như chỉ M')", "Easy hand (few M moves, almost only M')")}</th>
              <th>{tr("Chuẩn (Rouxvolution)", "Standard (Rouxvolution)")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{tr("1. EO (xoay hướng cạnh)", "1. EO (orient the edges)")}</td>
              <td>
                <Algs list={["M' U M'"]} note={tr("Thêm M2 khi dạng mũi tên quay ngược. Tối đa 4 lần.", "Plus M2 when the arrow pattern points the other way. At most 4 times.")} />
              </td>
              <td>
                <Algs list={["M' U M", "M U M'"]} note={tr("Tối đa 3 lần.", "At most 3 times.")} />
              </td>
            </tr>
            <tr>
              <td>{tr("2. UL/UR (hai cạnh trái và phải)", "2. UL/UR (the left and right edges)")}</td>
              <td>
                <Algs list={["M2", "M' U2 M'"]} note={tr("Tối đa 4 lần.", "At most 4 times.")} />
              </td>
              <td>
                <Algs list={["M2", "U2 M U2 M'"]} note={tr("Tối đa 4 lần.", "At most 4 times.")} />
              </td>
            </tr>
            <tr>
              <td>{tr("3. 4c (bốn cạnh cuối)", "3. 4c (the last four edges)")}</td>
              <td>
                <Algs
                  list={["U2 M U2 M'", "M' U2 M U2"]}
                  note={tr(
                    "Hai vòng (kẹp M2 hai đầu cho hai trường hợp còn lại) và 2 chuỗi đổi cặp. Tối đa 2 lần.",
                    "Two cycles (M2 before and after for the other two cases) and the 2 pair swaps. At most 2 times.",
                  )}
                />
              </td>
              <td>{tr("6 chuỗi (bảng trong phần “3. 4c: tìm cạnh đã đúng” ở trên). Tối đa 2 lần.", "6 sequences (the table in “3. 4c: find the edge that is already right” above). At most 2 times.")}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="small muted">
        {tr(
          "Cách dễ tay: 7 chuỗi, chỉ 2 chuỗi có nước M. Cách chuẩn: 10 chuỗi. Số “tối đa” đã được chương trình kiểm trên mọi trường hợp (11.160 trường hợp EO, 348 trường hợp UL/UR, 11 trường hợp 4c), chỉ dùng các chuỗi này cộng nước U chen vào giữa.",
          "Easy hand: 7 sequences, only 2 of them with an M. Standard: 10 sequences. The “at most” numbers were checked by a program on every case (11,160 EO cases, 348 UL/UR cases, 11 4c cases), using only these sequences plus U turns in between.",
        )}
      </p>

      <Callout kind="tip" title={tr("Cách dễ tay: vì sao né được M", "The easy-hand way: why M can be avoided")}>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            {tr(
              "EO chỉ quan tâm cạnh ngửa hay úp. Một nước M hay một nước M' đều lật bốn cạnh trong lát giữa y như nhau, nên M' U M' cũng sửa được dạng mũi tên giống hệt M' U M. Chỉ khác là các cạnh nằm lại ở chỗ khác và lát giữa lệch nửa vòng; bước sau xếp chỗ và sửa luôn.",
              "EO only cares whether an edge faces up or not. A quarter M and a quarter M' flip the four slice edges exactly the same way, so M' U M' fixes the arrow pattern exactly as M' U M does. The only difference is the edges end up in other places and the slice ends half a turn off; the next step places them and fixes that.",
            )}
          </li>
          <li>
            {tr(
              "Dạng mũi tên quay ngược (cạnh tốt ở UF, cạnh xấu dưới ở DB): làm M2 trước, nó thành mũi tên thường, rồi M' U M'. M2 = gẩy M' hai lần.",
              "The arrow pattern pointing the other way (the good edge at UF, the bad bottom edge at DB): do M2 first, it becomes the normal arrow, then M' U M'. M2 = two M' flicks.",
            )}
          </li>
          <li>
            {tr(
              "UL/UR: M' U2 M' đưa cạnh ở UB xuống DF và cạnh ở DF sang DB. Vậy khi một cạnh đã ở DF, xoay U cho cạnh kia về UB rồi làm M' U2 M': cả hai ở đáy. Sau đó vẫn là M2 đưa lên như ở phần “2. UL/UR: hạ xuống đáy rồi đưa lên”.",
              "UL/UR: M' U2 M' takes the edge at UB down to DF and the edge at DF across to DB. So when one edge is at DF, turn U to bring the other to UB and do M' U2 M': both are at the bottom. Then M2 brings them up as in “2. UL/UR: drop them to the bottom, then bring them up”.",
            )}
          </li>
          <li>
            {tr(
              "4c: chỉ cần nhớ 2 vòng có cạnh đúng ở DF (U2 M U2 M') và ở DB (M' U2 M U2). Cạnh đúng ở UB hay UF: kẹp M2 hai đầu. Ví dụ M2 · U2 M U2 M' · M2 chính là M2 U2 M U2 M trong bảng.",
              "4c: remember only the 2 cycles with the right edge at DF (U2 M U2 M') and at DB (M' U2 M U2). Right edge at UB or UF: put M2 before and after. For example M2 · U2 M U2 M' · M2 is exactly M2 U2 M U2 M from the table.",
            )}
          </li>
        </ul>
      </Callout>

    </>
  );
}

/** every small piece of algorithm in the three steps, with what it does to the edges (worked out on the cube engine's model) */
function BlockTable() {
  const pieces = useMemo(() => {
    const all = [...DRILL_PIECES.std.eo, ...DRILL_PIECES.std.ulur, ...DRILL_PIECES.std.l4e, ...DRILL_PIECES.easy.eo, ...DRILL_PIECES.easy.ulur, ...DRILL_PIECES.easy.l4e];
    return [...new Set(all)];
  }, []);
  return (
    <>
      <h3>{tr("Tự suy ra: mỗi đoạn công thức nhỏ làm gì", "Work it out yourself: what each small piece of algorithm does")}</h3>
      <p>
        {tr(
          <>
            Không cần thuộc cả danh sách. Cả bước EO, UL/UR và 4c đều chỉ ghép các đoạn công thức nhỏ dưới đây, và mỗi đoạn chỉ làm hai việc đo được: <strong>lật</strong> một số
            cạnh và <strong>chuyển</strong> các cạnh theo vòng. Đọc bảng như sau: “Lật cạnh đang ở UF” nghĩa là cạnh đang đứng ở UF trước khi làm chuỗi sẽ bị lật;
            “UF → DB → UF” nghĩa là cạnh ở UF đi tới DB và cạnh ở DB đi tới UF. Muốn biết một chuỗi dài làm gì, đặt các đoạn nối nhau và theo dõi từng cạnh, hoặc dùng bài
            “Tự thử và kiểm tra” bên dưới để chương trình theo dõi hộ.
          </>,
          <>
            You do not need to memorise the whole list. EO, UL/UR and 4c are all built from the small pieces below, and each piece does only two measurable things:{" "}
            <strong>flips</strong> some edges and <strong>moves</strong> edges round in cycles. Read the table like this: “Flips the edge at UF” means the edge standing at UF
            before the piece is flipped; “UF → DB → UF” means the edge at UF goes to DB and the edge at DB goes to UF. To know what a longer sequence does, lay the pieces one
            after another and follow each edge, or use the “Try it yourself and check” practice below and let the page follow them for you.
          </>,
        )}
      </p>
      <PieceTable pieces={pieces} />
      <p className="small muted">
        {tr(
          "Bảng do chương trình tính trên đúng mô hình cube của trang và đã được so lại với mô phỏng đầy đủ cho từng chuỗi.",
          "The table is computed by the program on the page's own cube model and was checked against the full simulation for every piece.",
        )}
      </p>
    </>
  );
}

function HandDrills() {
  const what = {
    eo: () => tr("M' liền với U hoặc U' (bước EO theo cách ít nước M)", "M' straight into U or U' (the EO step the few-M way)"),
    ulur: () => tr("M2 và M' U2 M' (bước UL/UR)", "M2 and M' U2 M' (the UL/UR step)"),
    l4e: () => tr("nước M trong một vòng 4c, M' ngay sau", "the M of a 4c cycle, with M' right after"),
  };
  return (
    <>
      <h3>{tr("Luyện tay: không cần scramble", "Hand practice: no scramble needed")}</h3>
      <p>
        {tr(
          "Mỗi dòng là một chuỗi ngắn. Làm đúng số lần ghi bên cạnh thì cube đã giải quay về như cũ, nên bạn tự biết mình làm đúng hay sai. Làm chậm cho đều trước, nhìn công thức một lần rồi làm không nhìn; khi tay đã quen thì mới tăng tốc. Chuỗi khó nhất với bạn (có M) thì làm nhiều hơn.",
          "Each line is a short sequence. Do it the number of times shown and a solved cube comes back solved, so you can tell yourself whether you did it right. Go slowly and evenly first, look at the sequence once and then do it without looking; speed up only once the hands know it. Do the hardest ones for you (with M) more often.",
        )}
      </p>
      <div className="table-scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th>{tr("Chuỗi", "Sequence")}</th>
              <th>{tr("Số lần", "Repeats")}</th>
              <th>{tr("Luyện", "Trains")}</th>
            </tr>
          </thead>
          <tbody>
            {HAND_DRILLS.map((d) => (
              <tr key={d.alg}>
                <td>
                  <AlgText alg={d.alg} />
                </td>
                <td>× {d.times}</td>
                <td className="small">
                  {what[d.trains]()}
                  {d.hasM ? tr(" · có M", " · has an M") : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const DRILL_TABS: { id: DrillStep; label: () => string; goal: () => string }[] = [
  { id: "eo", label: () => tr("1. EO", "1. EO"), goal: () => tr("Mục tiêu: không còn cạnh xấu.", "Goal: no bad edge left.") },
  {
    id: "ulur",
    label: () => tr("2. UL/UR", "2. UL/UR"),
    goal: () => tr("Mục tiêu: cạnh trái ở UL, cạnh phải ở UR, góc khớp với hai khối.", "Goal: the left edge at UL, the right edge at UR, the corners matching the blocks."),
  },
  { id: "l4e", label: () => tr("3. 4c", "3. 4c"), goal: () => tr("Mục tiêu: giải xong cube.", "Goal: the cube is solved.") },
];

function partText(p: DrillPart) {
  if (!p.piece) return tr(`Xoay ${p.pre} cho góc khớp với hai khối.`, `Turn ${p.pre} so the corners match the blocks.`);
  if (!p.pre) return tr(`Làm ${p.piece}.`, `Do ${p.piece}.`);
  const said = tr(`Xoay ${p.pre}, rồi làm ${p.piece}.`, `Turn ${p.pre}, then do ${p.piece}.`);
  // two U turns in a row join up in the hands: say what is really turned
  if (p.piece[0] !== "U") return said;
  const joined = tidy(`${p.pre} ${p.piece}`);
  return `${said} ${tr(`Hai nước U liền nhau gộp lại, tay chỉ làm: ${joined}.`, `The two U turns in a row join up; the hands only do: ${joined}.`)}`;
}

function LseDrill() {
  const [step, setStep] = useState<DrillStep>("eo");
  const [scramble, setScramble] = useState<string | null>(null);
  // the first scramble is built after the page has painted: the search behind it takes about a second
  useEffect(() => {
    const id = setTimeout(() => setScramble((s) => s ?? lseScramble("eo")), 0);
    return () => clearTimeout(id);
  }, []);
  const [show, setShow] = useState<"none" | "hint" | "answer">("none");
  const next = (k: DrillStep = step) => {
    setStep(k);
    setShow("none");
    setScramble(lseScramble(k));
  };
  const start = useMemo(() => (scramble ? applyAlg(S, scramble) : null), [scramble]);
  const hand = useSettings().lseHand;
  const parts = useMemo(() => (start ? solveByIdea(step, start, S, hand) : null), [start, step, hand]);
  const after = useMemo(() => {
    if (!start || !parts) return [];
    let s = start;
    return parts.map((p) => (s = applyAlg(s, `${p.pre} ${p.piece}`.trim())));
  }, [start, parts]);
  // one stepper step per part of the answer; a U turn next to a piece that starts with U is joined the way the hands do it
  const steps = useMemo(
    () =>
      (parts ?? [])
        .map((p, i) => ({ alg: tidy(`${p.pre} ${p.piece}`), title: partText(p), what: start ? describeLse(step, after[i]) : "" }))
        .filter((s) => s.alg)
        .map((s) => ({ ...s, moves: s.alg.split(" ").length })),
    [parts, after, start, step],
  );
  const tab = DRILL_TABS.find((t) => t.id === step)!;
  const pieces = parts ? parts.filter((p) => p.piece).length : 0;
  return (
    <div className="card drill" style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>{tr("Luyện tập: tự nghĩ, rồi mới xem đáp án", "Practice: think it through first, then check")}</h3>
      <p className="small">
        {tr(
          `Cầm cube đã giải, mặt ${colourOfFace("U")} ở trên, mặt ${colourOfFace("F")} ở trước, làm scramble bên dưới. Scramble chỉ dùng M và U nên cube rơi đúng vào đầu bước bạn chọn.`,
          `Hold a solved cube with ${colourOfFace("U")} on top and ${colourOfFace("F")} in front, and do the scramble below. It only uses M and U, so the cube lands right at the start of the step you chose.`,
        )}
      </p>
      <div className="bar" role="group" aria-label={tr("Kiểu tay", "Hand style")}>
        <span className="small muted">{tr("Kiểu tay:", "Hand style:")}</span>
        <button type="button" className="chip" aria-pressed={hand === "easy"} onClick={() => setLseHand("easy")}>
          {tr("Dễ tay (ít nước M, gần như chỉ M')", "Easy hand (few M moves, almost only M')")}
        </button>
        <button type="button" className="chip" aria-pressed={hand === "std"} onClick={() => setLseHand("std")}>
          {tr("Chuẩn (M và M')", "Standard (M and M')")}
        </button>
      </div>
      <div className="bar" role="group" aria-label={tr("Chọn bước để luyện", "Choose the step to practise")}>
        {DRILL_TABS.map((t) => (
          <button key={t.id} type="button" className="chip" aria-pressed={step === t.id} onClick={() => next(t.id)}>
            {t.label()}
          </button>
        ))}
      </div>
      {!scramble || !start ? (
        <p className="muted">{tr("Chọn một bước để nhận scramble.", "Pick a step to get a scramble.")}</p>
      ) : (
        <>
          <ScrambleLine scramble={scramble} onReroll={() => next()} />
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <Fig caption={tr("Cube sau khi làm scramble.", "The cube after the scramble.")}>
              <LseView state={start} mode={step === "eo" ? "eo" : step === "ulur" ? "pieces" : "all"} only={step === "ulur" ? [LEFT_PAIR, RIGHT_PAIR] : undefined} width={150} />
            </Fig>
            <div style={{ flex: 1, minWidth: 220 }}>
              <p style={{ marginTop: 0 }}>{tab.goal()}</p>
              <div className="bar">
                <button type="button" className="btn small" onClick={() => setShow(show === "none" ? "hint" : show)}>
                  {tr("Gợi ý", "Hint")}
                </button>
                <button type="button" className="btn small" onClick={() => setShow("answer")}>
                  {tr("Xem cách giải", "Show the solution")}
                </button>
                <button type="button" className="btn small" onClick={() => next()}>
                  {tr("↻ Bài khác", "↻ Another one")}
                </button>
              </div>
              {show !== "none" && (
                <p className="small" aria-live="polite">
                  {describeLse(step, start)}{" "}
                  {parts && tr(`Theo ý tưởng: ${pieces} lần dùng chuỗi.`, `By idea: ${pieces} ${pieces === 1 ? "sequence" : "sequences"}.`)}
                </p>
              )}
            </div>
          </div>
          {show === "answer" && parts && (
            <>
              {steps.length > 0 && (
                <AlgStepper start={start} alg={steps.map((s) => s.alg).join(" ")} steps={steps} hideEdges={false} doneText={tab.goal()} />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ EO

/** sticker-level edits for the example pictures: they show one idea each and need not be reachable states */
function swapEdges(st: State, a: string, b: string): State {
  const out = Uint8Array.from(st);
  const pa = pieceStickers(a), pb = pieceStickers(b);
  pa.forEach((i, k) => ([out[i], out[pb[k]]] = [st[pb[k]], st[i]]));
  return out;
}

type KnownAlg = { source: string; url: string; name: string; alg: string; pre: string; centresHalfOff: boolean };

const moveCount = (alg: string, pre = "") => `${pre} ${alg}`.split(" ").filter(Boolean).length;

/** the same algorithm (same turn first, same finish) listed by several sources becomes one entry that carries every source */
function mergeKnown(known: KnownAlg[]) {
  const out: { key: string; alg: string; pre: string; centresHalfOff: boolean; sources: { source: string; url: string; name: string }[] }[] = [];
  for (const k of known) {
    const key = `${k.pre}|${k.alg}|${k.centresHalfOff}`;
    const hit = out.find((o) => o.key === key);
    const src = { source: k.source, url: k.url, name: k.name };
    if (hit) hit.sources.push(src);
    else out.push({ key, alg: k.alg, pre: k.pre, centresHalfOff: k.centresHalfOff, sources: [src] });
  }
  return out;
}

/** the published algorithms for one EO pattern (identical ones merged, with all their sources), then the program's shortest only when it is shorter than every published one */
function EoAlgs({ machine, known, compact }: { machine: string; known: KnownAlg[]; compact?: boolean }) {
  const list = mergeKnown(known);
  const shortest = Math.min(...known.map((k) => moveCount(k.alg, k.pre)));
  const showMachine = !!machine && (!known.length || moveCount(machine) < shortest);
  return (
    <div className={`eo-algs ${compact ? "small" : ""}`}>
      {list.map((k) => (
        <div key={k.key} className="eo-alg">
          <div className="muted small">
            {tr("Phổ biến", "Common")} ·{" "}
            {k.sources.map((src, i) => (
              <span key={src.source + src.name}>
                {i > 0 && ", "}
                <a href={src.url} target="_blank" rel="noreferrer">
                  {src.source}
                </a>{" "}
                “{src.name}”
              </span>
            ))}
          </div>
          <div className="alg-row">
            <AlgText alg={k.alg} pre={k.pre} />
            {!compact && <CopyButton text={[k.pre, k.alg].filter(Boolean).join(" ")} />}
          </div>
          {k.pre && <div className="small muted">{tr(`Xoay ${k.pre} trước cho hình khớp với công thức.`, `Turn ${k.pre} first so the picture matches the algorithm.`)}</div>}
          {k.centresHalfOff && (
            <div className="small muted">{tr("Xong thì tâm lệch nửa vòng (cần M2); bước sau sửa luôn.", "Afterwards the centres are half a turn off (M2 needed); the next step fixes it.")}</div>
          )}
          <div className="small muted">{tr("Đếm nước: ", "Move count: ")}{handNote(k.alg)}</div>
          <MoveTricks alg={k.alg} open={!compact} />
        </div>
      ))}
      {showMachine && (
        <div className="eo-alg">
          <div className="muted small">{tr("Chương trình tìm (ngắn hơn các cách trên)", "Found by the program (shorter than the ones above)")}</div>
          <div className="alg-row">
            <AlgText alg={machine} />
            {!compact && <CopyButton text={machine} />}
          </div>
          <div className="small muted">{tr("Đếm nước: ", "Move count: ")}{handNote(machine)}</div>
          <MoveTricks alg={machine} open={!compact} />
        </div>
      )}
    </div>
  );
}

function EoBasics() {
  const names = useSchemeBrackets();
  const only = (keep: string[]) => {
    const set = new Set([...keep.flatMap((p) => pieceStickers(p)), ...["U", "F", "R", "D"].flatMap((p) => pieceStickers(p))]);
    return (i: number) => !set.has(i);
  };
  const examples = [
    { state: S, keep: ["UF"], ok: true, below: false, text: tr("Tốt: sticker màu mặt trên/dưới nằm trên mặt trên.", "Good: the top/bottom-colour sticker is on the top face.") },
    { state: flipEdges(S, ["UF"]), keep: ["UF"], ok: false, below: false, text: tr("Xấu: sticker màu mặt trên/dưới quay ra mặt trước.", "Bad: the top/bottom-colour sticker faces the front.") },
    {
      state: swapEdges(S, "UF", "UB"),
      keep: ["UF", "UB"],
      ok: true,
      text: tr(
        "Tốt dù sai chỗ: hai cạnh trước và sau đổi chỗ cho nhau, nhưng sticker màu mặt trên/dưới vẫn nằm trên mặt trên.",
        "Good though misplaced: the front and back edges have swapped places, but the top/bottom-colour stickers are still on the top face.",
      ),
    },
    {
      state: swapEdges(S, "UF", "DF"),
      keep: ["UF", "DF"],
      below: true,
      ok: true,
      text: tr(
        "Nhìn từ dưới lên: cạnh đã chạy xuống đáy và sticker màu mặt trên/dưới của nó nằm trên mặt dưới. Vẫn là cạnh tốt.",
        "Seen from below: the edge went to the bottom and its top/bottom-colour sticker lies on the bottom face. Still a good edge.",
      ),
    },
  ];
  return (
    <>
      <p>
        {tr(
          <>
            Mỗi cạnh có hai màu. Sáu cạnh còn lại ở bước này cạnh nào cũng có <strong>một sticker mang màu của tâm trên hoặc tâm dưới</strong> (hai màu đối nhau của
            cube){names}. Từ đây mình gọi sticker đó là <strong>màu mặt trên/dưới</strong>. Hãy coi nó là “mặt hình” của một lá bài:
          </>,
          <>
            Each edge has two colours. Every one of the six edges left in this step has <strong>one sticker in the colour of the top centre or the bottom centre</strong>{" "}
            (the two opposite colours of the cube){names}. From here on that sticker is called the <strong>top/bottom colour</strong>. Think of it as the picture side of a
            playing card:
          </>,
        )}
      </p>
      <ul>
        <li>
          {tr(
            <>
              <strong>Cạnh tốt</strong>: màu mặt trên/dưới nhìn <strong>lên trên hoặc xuống dưới</strong>, như lá bài nằm ngửa trên bàn.
            </>,
            <>
              <strong>Good edge</strong>: the top/bottom colour looks <strong>up or down</strong>, like a card lying flat on the table.
            </>,
          )}
        </li>
        <li>
          {tr(
            <>
              <strong>Cạnh xấu</strong>: màu mặt trên/dưới quay <strong>ra một mặt bên</strong> (trước, sau, trái, phải), như lá bài dựng đứng.
            </>,
            <>
              <strong>Bad edge</strong>: the top/bottom colour faces <strong>a side</strong> (front, back, left, right), like a card standing on its edge.
            </>,
          )}
        </li>
        <li>
          {tr(
            <>
              <strong>Chỗ đứng chưa quan trọng.</strong> Cạnh nằm sai chỗ vẫn có thể là cạnh tốt. Đưa cạnh về đúng chỗ là việc của bước 2 và bước 3.
            </>,
            <>
              <strong>Where it sits does not matter yet.</strong> An edge in the wrong place can still be good. Putting edges in their places is the job of steps 2 and 3.
            </>,
          )}
        </li>
      </ul>
      <div className="grid cols-2">
        {examples.map((e, i) => (
          <Fig key={i} caption={<span className={e.ok ? undefined : "bad-text"}>{e.text}</span>}>
            <CubeIso state={e.state} width={130} view={e.below ? "below" : "above"} ghost={only(e.keep)} variant={`eo-ex-${i}`} title={e.text} />
          </Fig>
        ))}
      </div>
      <Callout kind="info" title={tr("Còn các cạnh khác thì sao?", "What about the other edges?")}>
        <p style={{ margin: 0 }}>
          {tr(
            "Hai cạnh nằm giữa mặt dưới và mặt trái, giữa mặt dưới và mặt phải, đã nằm trong hai khối từ trước. Bước này không đụng tới chúng, nên không cần xem.",
            "The edge between the bottom and left faces and the edge between the bottom and right faces are already inside the two blocks. This step does not touch them, so you do not look at them.",
          )}
        </p>
      </Callout>
      <p className="small muted">
        {tr(
          "Nhìn khi tâm trên cùng màu với sticker mặt trên của bốn góc tầng trên. Nếu tâm trên đang là màu khác, xoay M cho thẳng trước (M, M' hoặc M2, tùy tâm đang lệch bao nhiêu).",
          "Look while the top centre has the same colour as the top stickers of the four top corners. If the top centre shows another colour, turn M to line it up first (M, M' or M2, depending on how far the centre is off).",
        )}
      </p>
    </>
  );
}

function Eo() {
  const [bad, setBad] = useState<string[]>([]);
  const table = useMemo(() => new Map(data.eoAll.map((e) => [[...e.bad].sort().join(), e])), []);
  const key = [...bad].sort().join();
  const hit = table.get(key);
  const state = useMemo(() => flipEdges(S, bad), [bad]);
  const toggle = (p: string) => setBad(bad.includes(p) ? bad.filter((x) => x !== p) : [...bad, p]);
  const needs = bad.length % 2 === 1;
  return (
    <>
      <h2 id="eo">{tr("1. EO: xoay hướng sáu cạnh", "1. EO: orient the six edges")}</h2>
      <EoBasics />
      <Why title={tr("Vì sao số cạnh xấu luôn là số chẵn (0, 2, 4 hoặc 6)?", "Why is the number of bad edges always even (0, 2, 4 or 6)?")}>
        <p>
          {tr(
            <>
              Mỗi nước M và U chỉ lật các cạnh theo cặp nên tính chẵn lẻ của số cạnh xấu không đổi; ở trạng thái đã giải số cạnh xấu là 0, vì vậy mọi trạng thái đạt được
              đều có số cạnh xấu chẵn. Hệ quả hữu ích: <strong>nếu bạn thấy 5 cạnh (4 trên, 1 dưới) mà số cạnh xấu thấy được là lẻ, cạnh DB bị che chắc chắn cũng xấu.</strong>
            </>,
            <>
              Every M and U move flips edges only in pairs, so the parity of the number of bad edges never changes; in the solved state there are 0 bad edges, so every
              reachable state has an even number of bad edges. A useful result:{" "}
              <strong>if you see 5 edges (4 on top, 1 on the bottom) and the number of bad edges you can see is odd, the hidden DB edge must be bad too.</strong>
            </>,
          )}
        </p>
      </Why>
      <Why title={tr("Vì sao EO dùng M để lật và U để sắp chỗ?", "Why does EO use M to flip and U to position?")}>
        <p>
          {tr(
            "Một nước M làm các cạnh ở lát giữa đổi hướng: sticker mặt trên của chúng bị đưa sang mặt bên. Nước U thì không làm đổi hướng cạnh nào, nó chỉ dời cạnh tầng trên sang vị trí khác. Vì vậy mẫu EO dạng “M, U, M'” hoạt động như một phép lật có chọn lọc: M lật lát giữa, U đưa các cạnh cần lật vào lát giữa, rồi M' trả lát giữa về.",
            "An M move changes the orientation of the edges in the middle slice: their top stickers are moved to a side face. A U move does not change the orientation of any edge; it only moves the top-layer edges to other positions. So an EO pattern like “M, U, M'” works as a selective flip: M flips the middle slice, U brings the edges you want to flip into the middle slice, and M' puts the middle slice back.",
          )}
        </p>
      </Why>

      <h3>{tr("Tìm thuật toán EO", "Find the EO algorithm")}</h3>
      <p>
        {tr(
          "Sáu ô dưới đây là sáu cạnh của bước cuối (đúng những cạnh mà M và U di chuyển), xếp theo vị trí trên cube. Với mỗi cạnh, nhìn cube của bạn: nếu sticker màu mặt trên/dưới của nó (màu của tâm trên hoặc tâm dưới, khi các tâm lát giữa đã thẳng hàng) nằm ở mặt bên thì chạm ô đó để đánh dấu “xấu”. Trang sẽ tìm thuật toán ngắn nhất, kể cả nước U xoay trước nếu cần.",
          "The six tiles below are the six edges of the last step (exactly the edges that M and U move), laid out like the cube. For each edge, look at your cube: if its top/bottom-colour sticker (the colour of the top or bottom centre, while the middle-slice centres are lined up) is on a side face, tap the tile to mark it “bad”. The page then finds the shortest algorithm, including a U turn first if needed.",
        )}
      </p>
      <EdgeMap bad={bad} toggle={toggle} reset={() => setBad([])} />
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
        <Fig
          caption={tr(
            "Cạnh xấu: sticker màu mặt trên/dưới nằm ở mặt bên. Trái: nhìn từ trên. Phải: nhìn từ dưới lên.",
            "Bad edge: the top/bottom-colour sticker is on a side face. Left: seen from above. Right: seen from below.",
          )}
        >
          <LseView state={state} mode="eo" width={170} />
        </Fig>
        <div style={{ flex: 1, minWidth: 220 }}>
          {needs ? (
            <Callout kind="warn" title={tr("Số cạnh xấu phải là số chẵn", "The number of bad edges must be even")}>
              <p style={{ margin: 0 }}>
                {tr(
                  `Bạn đã chọn ${bad.length} cạnh. Hãy thêm hoặc bớt một cạnh (thường là cạnh DB bị che).`,
                  `You have chosen ${bad.length} ${bad.length === 1 ? "edge" : "edges"}. Add or remove one edge (usually the hidden DB edge).`,
                )}
              </p>
            </Callout>
          ) : hit ? (
            <>
              <p style={{ marginTop: 0 }}>
                {bad.length === 0
                  ? tr("Không có cạnh xấu: bỏ qua bước này.", "No bad edges: skip this step.")
                  : tr(`${bad.length} cạnh xấu. Các cách làm:`, `${bad.length} bad ${bad.length === 1 ? "edge" : "edges"}. Ways to do it:`)}
              </p>
              {hit.alg && <EoAlgs machine={hit.alg} known={hit.known} />}
              {hit.alg && <EoStory alg={hit.alg} bad={bad} />}
              <p className="small muted">
                {tr(
                  "Sau khi làm, tâm vẫn thẳng hàng; có thể cần một nước U để căn góc (bước kế tiếp xử lý).",
                  "After this, the centres are still lined up; you may need one U move to align the corners (the next step handles it).",
                )}
              </p>
            </>
          ) : null}
        </div>
      </div>

      <h3>{tr("Các dạng EO: cạnh xấu nằm ở đâu", "The EO patterns: where the bad edges are")}</h3>
      <p>
        {tr(
          <>
            Mỗi dạng có <strong>công thức phổ biến</strong> lấy từ tài liệu cộng đồng (Rouxvolution, CubeTools; bấm tên nguồn để xem) và{" "}
            <strong>công thức chương trình tìm</strong>: chương trình thử mọi cách và giữ cách ngắn nhất. Chương trình tính sẵn một lần rồi lưu lại, không tính lúc bạn mở trang. Mọi công thức
            ở đây đều đã được chương trình thử lại trên đúng hình của dạng đó.
          </>,
          <>
            Each pattern has the <strong>common algorithm</strong> from community guides (Rouxvolution, CubeTools; tap the source name to see it) and the{" "}
            <strong>computer's algorithm</strong>: the computer tries every way and keeps the shortest. It is worked out once and saved, not while you open the page.
            Every algorithm here was tried again by the computer on the picture of its pattern.
          </>,
        )}
      </p>
      <p className="small muted">
        {tr(
          "Mỗi dạng tồn tại ở tối đa bốn hướng xoay U; thuật toán dưới đây là bản ngắn nhất trong các hướng đó.",
          "Each pattern exists in up to four U turn directions; the algorithm below is the shortest one among those directions.",
        )}
      </p>
      <div className="grid cols-3">
        {data.eo.filter((e) => e.alg).map((e, idx) => {
          const label = tr(
            `${e.top} cạnh xấu trên${e.shape ? (e.shape === "a" ? " (kề nhau)" : " (đối nhau)") : ""}, ${e.bottom.length} dưới`,
            `${e.top} bad on top${e.shape ? (e.shape === "a" ? " (adjacent)" : " (opposite)") : ""}, ${e.bottom.length} on the bottom`,
          );
          return (
            <div className="card" key={e.bad.join()} style={{ padding: 10 }}>
              <LseView state={flipEdges(S, e.bad)} mode="eo" width={110} />
              <div className="small" style={{ textAlign: "center" }}>
                {label}
                {e.bottom.length === 1 ? ` (${e.bottom[0]})` : ""}
              </div>
              <EoAlgs machine={e.alg} known={e.known} compact />
              <EoStory alg={e.alg} bad={e.bad} open={idx === 0} />
            </div>
          );
        })}
      </div>
      <p className="small muted">
        {tr("Không có cạnh xấu nào thì không cần làm gì ở bước này, nên dạng đó không nằm trong bảng.", "With no bad edge there is nothing to do in this step, so that pattern is not in the grid.")}
      </p>
    </>
  );
}

// ------------------------------------------------------------------ UL / UR

function Ulur() {
  const [left, setLeft] = useState("UF");
  const [right, setRight] = useState("UB");
  const hit = data.ulur.find((c) => c.left === left && c.right === right);
  const reroll = () => {
    const e = data.ulur[Math.floor(Math.random() * data.ulur.length)];
    setLeft(e.left);
    setRight(e.right);
  };
  const state = useMemo(() => (hit ? applyAlg(S, hit.scramble) : S), [hit]);
  return (
    <>
      <h2 id="ulur">{tr("2. UL và UR: đưa hai cạnh trái và phải về chỗ", "2. UL and UR: put the left and right edges in place")}</h2>
      <p>
        {tr(
          <>
            Trước bước này, <strong>xoay U để bốn góc tầng trên khớp màu với hai khối</strong>. Rồi tìm hai cạnh đặc biệt: <strong>cạnh trái</strong> (hai màu: màu mặt trên
            và màu tâm trái) và <strong>cạnh phải</strong> (màu mặt trên và màu tâm phải). Mục tiêu: cạnh trái nằm ở UL, cạnh phải nằm ở UR.
          </>,
          <>
            Before this step, <strong>turn U so the four top corners match the colours of the two blocks</strong>. Then find the two special edges: the{" "}
            <strong>left edge</strong> (two colours: the top colour and the left centre colour) and the <strong>right edge</strong> (the top colour and the right centre
            colour). The goal: the left edge sits at UL and the right edge sits at UR.
          </>,
        )}
      </p>
      <Why title={tr("Vì sao phải đặt UL/UR trước rồi mới giải bốn cạnh còn lại?", "Why place UL/UR first and only then solve the other four edges?")}>
        <p>
          {tr(
            "Khi UL và UR đã đúng, bốn cạnh còn lại (UF, UB, DF, DB) đều nằm trong lát giữa M và hàng giữa tầng trên. Khi đó chỉ cần M và U2 (xoay đôi, đưa UL và UR đổi chỗ rồi đổi lại trong cùng thuật toán) mà không làm hỏng UL/UR. Chia việc như vậy làm bước cuối chỉ còn 12 trường hợp.",
            "When UL and UR are right, the other four edges (UF, UB, DF, DB) all sit in the M slice and the middle row of the top layer. Then you only need M and U2 (a half turn that swaps UL and UR and swaps them back within the same algorithm) without breaking UL/UR. Splitting the work this way leaves only 12 cases for the last step.",
          )}
        </p>
      </Why>
      <p>{tr("Chọn vị trí hiện tại của hai cạnh:", "Choose where the two edges are now:")}</p>
      <div className="bar">
        <button type="button" className="btn small" onClick={reroll}>
          {tr("↻ Đổi scramble", "↻ New scramble")}
        </button>
        <label>
          {tr("Cạnh trái đang ở", "The left edge is at")}{" "}
          <select className="input" value={left} onChange={(e) => setLeft(e.target.value)}>
            {EDGE_POS.map((p) => (
              <option key={p} value={p}>
                {posName(p)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {tr("Cạnh phải đang ở", "The right edge is at")}{" "}
          <select className="input" value={right} onChange={(e) => setRight(e.target.value)}>
            {EDGE_POS.map((p) => (
              <option key={p} value={p} disabled={p === left}>
                {posName(p)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {hit ? (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
          <Fig
            caption={tr(
              "Chỉ hiện hai cạnh trái và phải (các cạnh khác ẩn). Cạnh đã đúng hướng.",
              "Only the left and right edges are shown (the other edges are hidden). The edges are already correctly oriented.",
            )}
          >
            <LseView state={state} mode="pieces" only={[LEFT_PAIR, RIGHT_PAIR]} width={170} />
          </Fig>
          <div style={{ flex: 1, minWidth: 220 }}>
            {hit.alg ? (
              <>
                <p style={{ marginTop: 0 }}>{tr(`Thuật toán ngắn nhất (${hit.len} nước):`, `Shortest algorithm (${moves(hit.len)}):`)}</p>
                <div className="alg-row">
                  <AlgText alg={hit.alg} />
                  <CopyButton text={hit.alg} />
                </div>
              </>
            ) : (
              <p style={{ marginTop: 0 }}>{tr("Hai cạnh đã đúng chỗ: sang bước 4c (bốn cạnh cuối).", "Both edges are already in place: go to 4c (the last four edges).")}</p>
            )}
            <p className="small muted">{tr("Thuật toán đã tính cả nước U cần để giữ bốn góc khớp ở cuối.", "The algorithm already includes the U move needed to keep the four corners matched at the end.")}</p>
            <EdgeMoves state={state} positions={["UL", "UR"]} />
            <ScrambleLine scramble={hit.scramble} compact />
          </div>
        </div>
      ) : (
        <p className="muted">{tr("Hai cạnh không thể cùng ở một vị trí.", "The two edges cannot be in the same position.")}</p>
      )}
      {hit && hit.alg && <AlgStepper start={state} alg={hit.alg} hideEdges={false} doneText={tr("Xong: UL và UR đã đúng chỗ", "Done: UL and UR are in place")} />}
    </>
  );
}

// ------------------------------------------------------------------ 4c

function L4e() {
  return (
    <>
      <h2 id="l4e">{tr("3. Bốn cạnh cuối (4c)", "3. The last four edges (4c)")}</h2>
      <p>
        {tr(
          <>
            UL và UR đã đúng, hai khối và bốn góc thẳng hàng. Còn bốn cạnh UF, UB, DF, DB đổi chỗ cho nhau theo đúng <strong>12 cách</strong> (kể cả “đã giải”). Đối chiếu
            hình với cube của bạn: màu của bốn cạnh này.
          </>,
          <>
            UL and UR are right, and the two blocks and the four corners are lined up. The four edges UF, UB, DF, DB can be swapped around in exactly{" "}
            <strong>12 ways</strong> (including “solved”). Compare the picture with your cube: the colours of these four edges.
          </>,
        )}
      </p>
      <Why title={tr("Vì sao chỉ có đúng 12 trường hợp?", "Why are there exactly 12 cases?")}>
        <p>
          {tr(
            "Với UL, UR cố định, EO đã xong và tâm thẳng hàng, bốn cạnh còn lại chỉ có thể bị đổi chỗ bằng M và U2. Chương trình đã liệt kê toàn bộ các trạng thái như vậy và chỉ tìm thấy 12: 1 đã giải, 8 hoán vị vòng ba cạnh (một cạnh đứng yên, ba cạnh luân phiên) và 3 trường hợp đổi chỗ hai cặp cạnh cùng lúc.",
            "With UL and UR fixed, EO done and the centres lined up, the other four edges can only be swapped by M and U2. A program listed every such state and found only 12: 1 solved, 8 three-edge cycles (one edge stays, three edges rotate) and 3 cases that swap two pairs of edges at once.",
          )}
        </p>
      </Why>
      <div className="grid cols-3">
        {data.l4e.map((c) => {
          const state = applyAlg(S, c.scramble);
          return (
            <div className="card" key={c.scramble} style={{ padding: 10 }}>
              <LseView state={state} mode="all" width={110} />
              <div style={{ textAlign: "center" }}>
                {c.alg ? (
                  <>
                    <EdgeMoves state={state} positions={["UF", "UB", "DF", "DB"]} />
                    <AlgText alg={c.alg} />
                    <div className="small muted">{moves(c.len)}</div>
                    <ScrambleLine scramble={c.scramble} compact />
                  </>
                ) : (
                  <span className="small muted">{tr("Đã giải: không cần làm gì", "Solved: nothing to do")}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Callout kind="tip" title={tr("Mẹo nhận dạng", "Recognition tip")}>
        <p style={{ margin: 0 }}>
          {tr(
            "Đếm xem trong bốn cạnh UF, UB, DF, DB có mấy cạnh đã đúng chỗ. Đúng một cạnh: đó là hoán vị vòng ba cạnh (tám trường hợp). Không cạnh nào đúng: đó là đổi hai cặp (ba trường hợp). Đúng cả bốn: đã xong.",
            "Count how many of the four edges UF, UB, DF, DB are already in place. Exactly one: it is a three-edge cycle (eight cases). None: it is a swap of two pairs (three cases). All four: you are done.",
          )}
        </p>
      </Callout>
    </>
  );
}

// ------------------------------------------------------------------ EOLR

function Eolr() {
  const [bad, setBad] = useState<string[]>([]);
  const [left, setLeft] = useState("UL");
  const [right, setRight] = useState("UR");
  const toggle = (p: string) => setBad(bad.includes(p) ? bad.filter((x) => x !== p) : [...bad, p]);
  const reroll = () => {
    const e = data.eolr[Math.floor(Math.random() * data.eolr.length)];
    setBad(e.bad);
    setLeft(e.left);
    setRight(e.right);
  };
  const key = EDGE_POS.filter((p) => bad.includes(p)).join("/");
  const hit = useMemo(() => data.eolr.find((c) => c.bad.join("/") === key && c.left === left && c.right === right), [key, left, right]);
  const state = useMemo(() => (hit ? applyAlg(S, hit.scramble) : S), [hit]);
  return (
    <>
      <h3 id="eolr">{tr("EOLR (EO cộng cạnh trái và phải): bước 1 và 2 gộp làm một", "EOLR (EO plus the left and right edges): steps 1 and 2 in one algorithm")}</h3>
      <p>
        {tr(
          <>
            Thay vì làm EO rồi mới đặt UL và UR, bạn nhìn <strong>ba điều cùng lúc</strong>: cạnh nào xấu, cạnh trái đang ở đâu, cạnh phải đang ở đâu. Một thuật toán lo cả
            ba. Bảng trên cho thấy cách này giảm trung bình từ {data.stats.threeStepAvg} xuống {data.stats.twoStepAvg} nước, nhưng có {data.eolr.length} trường hợp thay vì 12 + 30,
            nên bạn phải nhận dạng nhiều hơn. Công cụ dưới đây tra thuật toán ngắn nhất cho từng trường hợp.
          </>,
          <>
            Instead of doing EO first and placing UL and UR afterwards, you look at <strong>three things at once</strong>: which edges are bad, where the left edge is and where
            the right edge is. One algorithm handles all three. The table above shows this cuts the average from {data.stats.threeStepAvg} to {data.stats.twoStepAvg} moves,
            but there are {data.eolr.length} cases instead of 12 + 30, so recognition is harder. The tool below looks up the shortest algorithm for each case.
          </>,
        )}
      </p>
      <p className="small muted">
        {tr(
          "Điều kiện như các bước trước: tâm thẳng hàng và bốn góc đã khớp. Chạm các cạnh xấu, rồi chọn chỗ của cạnh trái và cạnh phải.",
          "Conditions as in the earlier steps: centres lined up and the four corners matched. Tap the bad edges, then choose where the left and right edges are.",
        )}
      </p>
      <Callout kind="tip" title={tr("Tự học EOLR: không cần thuộc 960 trường hợp", "Learning EOLR: you do not need to memorise 960 cases")}>
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            {tr(
              "Ghi ra ba điều: cạnh nào xấu, cạnh trái đang ở đâu, cạnh phải đang ở đâu. Cạnh trái và cạnh phải cũng là hai cạnh phải được lật nếu chúng xấu, nên chúng đi cùng các cạnh khác trong lát giữa.",
              "Write down three things: which edges are bad, where the left edge is and where the right edge is. The left and right edges also need flipping if they are bad, so they travel with the other edges through the middle slice.",
            )}
          </li>
          <li>
            {tr(
              "Ghép các đoạn công thức nhỏ của bước EO và bước UL/UR (bảng ở phần “Học theo ý tưởng”, xoay U trước mỗi đoạn khi cần) cho tới khi đạt hai điều cùng lúc: không còn cạnh xấu, và cả cạnh trái lẫn cạnh phải nằm ở đáy (DF và DB). Mỗi đoạn chuyển cạnh theo vòng, nên sau mỗi đoạn bạn thấy ngay hai cạnh này đã xuống đáy chưa.",
              "Lay the small pieces of the EO step and the UL/UR step one after another (the table in “Learn the ideas”, turning U before a piece when needed) until two things hold at once: no bad edge is left, and both the left and the right edge sit at the bottom (DF and DB). The pieces move edges in cycles, so after each piece you see at once whether those two edges went down.",
            )}
          </li>
          <li>
            {tr(
              "Khi hai điều đó đã đúng, kết bằng M2, thêm một nước U trước hoặc sau nếu cần để hai cạnh về đúng chỗ và góc khớp hai khối (M2 đưa hai cạnh lên và trả tâm về).",
              "When both hold, finish with M2, adding a U turn before or after if needed so the two edges land in their places and the corners match the blocks (M2 brings the two edges up and puts the centres back).",
            )}
          </li>
          <li>
            {tr(
              "Kiểm bằng bài “Tự thử và kiểm tra” bên dưới: số nước chương trình còn cần phải giảm dần về 0. Cách suy ra này dài hơn thuật toán ngắn nhất ở công cụ tra, nhưng không cần học thuộc: chương trình đã kiểm trên cả 959 trường hợp có việc phải làm, mỗi trường hợp ra được bằng tối đa bốn đoạn công thức nhỏ rồi M2.",
              "Check with the “Try it yourself and check” practice below: the number of moves the solver still needs must fall to 0. This derived way is longer than the shortest algorithm in the lookup tool, but it needs no memorising: a program checked all 959 cases that have work to do, and each comes out with at most four small pieces and then M2.",
            )}
          </li>
        </ol>
      </Callout>
      <LseTryLab initial="eolr" describe={describeLse} />
      <EdgeMap bad={bad} toggle={toggle} reset={() => setBad([])} />
      <div className="bar">
        <button type="button" className="btn small" onClick={reroll}>
          {tr("↻ Đổi scramble", "↻ New scramble")}
        </button>
        <label>
          {tr("Cạnh trái đang ở", "The left edge is at")}{" "}
          <select className="input" value={left} onChange={(e) => setLeft(e.target.value)}>
            {EDGE_POS.map((p) => (
              <option key={p} value={p} disabled={p === right}>
                {posName(p)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {tr("Cạnh phải đang ở", "The right edge is at")}{" "}
          <select className="input" value={right} onChange={(e) => setRight(e.target.value)}>
            {EDGE_POS.map((p) => (
              <option key={p} value={p} disabled={p === left}>
                {posName(p)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {hit ? (
        <>
          <p>
            {hit.alg
              ? tr(`Thuật toán EOLR ngắn nhất (${hit.len} nước):`, `Shortest EOLR algorithm (${moves(hit.len)}):`)
              : tr("Không có cạnh xấu và hai cạnh đã đúng chỗ: sang bước 4c (bốn cạnh cuối).", "No bad edge and both edges in place: go to 4c (the last four edges).")}
          </p>
          {hit.alg && (
            <>
              <div className="alg-row">
                <AlgText alg={hit.alg} />
                <CopyButton text={hit.alg} />
              </div>
              <ScrambleLine scramble={hit.scramble} compact />
              <p className="small muted">
                {tr(
                  "Hình bên dưới chỉ là một cube mẫu có đúng ba điều bạn chọn; các cạnh khác của cube bạn có thể khác, thuật toán vẫn đúng vì nó không phụ thuộc vào chúng.",
                  "The picture below is only a sample cube with exactly the three things you chose; the other edges of your cube may differ, and the algorithm still works because it does not depend on them.",
                )}
              </p>
              <AlgStepper start={state} alg={hit.alg} hideEdges={false} doneText={tr("Xong: mọi cạnh đúng hướng, UL và UR đúng chỗ", "Done: every edge oriented, UL and UR in place")} />
            </>
          )}
        </>
      ) : (
        <Callout kind="warn" title={tr("Tổ hợp này không thể có", "This combination cannot occur")}>
          <p style={{ margin: 0 }}>
            {tr(
              "Số cạnh xấu phải là số chẵn, và cạnh trái với cạnh phải không thể ở cùng một vị trí. Hãy chỉnh lại.",
              "The number of bad edges must be even, and the left and right edges cannot be in the same position. Adjust the choices.",
            )}
          </p>
        </Callout>
      )}
    </>
  );
}

// ------------------------------------------------------------------ L6E

const colourOfFace = (f: string) => colorName(currentScheme()[f as Face]);
const pieceLabel = (q: string) => `${colourOfFace(q[0])}–${colourOfFace(q[1])} (${q})`;

let cache: { sp: Space; d: Dist } | null = null;
function fullSolver() {
  if (!cache) {
    const sp = buildSpace();
    cache = { sp, d: distToGoal(sp, (s) => s.every((v, i) => v === S[i])) };
  }
  return cache;
}

function stateOf(pieces: string[], flipped: boolean[]) {
  const out = Uint8Array.from(S);
  EDGE_POS.forEach((p, i) => {
    const at = pieceStickers(p);
    const from = pieceStickers(pieces[i]);
    out[at[0]] = S[from[flipped[i] ? 1 : 0]];
    out[at[1]] = S[from[flipped[i] ? 0 : 1]];
  });
  return out;
}

function L6e() {
  const names = useSchemeBrackets();
  const ex = data.l6eExample;
  const exState = useMemo(() => applyAlg(S, ex.scramble), [ex.scramble]);
  const [pieces, setPieces] = useState<string[]>([...EDGE_POS]);
  const [flipped, setFlipped] = useState<boolean[]>(EDGE_POS.map(() => false));
  const [busy, setBusy] = useState(false);
  const sig = pieces.join() + flipped.join();
  const [solvedSig, setSolvedSig] = useState("");
  const distinct = new Set(pieces).size === 6;
  const state = useMemo(() => stateOf(pieces, flipped), [pieces, flipped]);
  const result = useMemo(() => {
    if (solvedSig !== sig || !cache) return null;
    const i = lookupState(cache.sp, state);
    if (i === undefined) return { ok: false as const };
    const alg = pathFrom(cache.sp, cache.d, i);
    return { ok: true as const, alg, len: alg ? alg.split(" ").length : 0 };
  }, [solvedSig, sig, state]);
  const run = () => {
    setBusy(true);
    setTimeout(() => {
      fullSolver();
      setSolvedSig(sig);
      setBusy(false);
    }, 30);
  };
  const reset = () => {
    setPieces([...EDGE_POS]);
    setFlipped(EDGE_POS.map(() => false));
  };
  return (
    <>
      <h3 id="l6e">{tr("L6E (sáu cạnh cuối): giải cả sáu cạnh một mạch", "L6E (last six edges): solve all six edges in one go")}</h3>
      <p>
        {tr(
          <>
            L6E bỏ hẳn các bước 1, 2, 3 và tìm <strong>một chuỗi M và U ngắn nhất</strong> đưa sáu cạnh về đúng. Trung bình chỉ {data.stats.optimalAvg} nước, nhiều nhất{" "}
            {data.stats.optimalMax}, so với {data.stats.threeStepAvg} nước của ba bước. Không ai nhớ nổi hết các trường hợp, nên người giỏi học dần các mẫu quen thuộc và nhìn
            trước. Còn ở đây, chương trình tìm giúp bạn.
          </>,
          <>
            L6E drops steps 1, 2 and 3 and looks for <strong>one shortest sequence of M and U moves</strong> that solves all six edges. On average it takes only{" "}
            {data.stats.optimalAvg} moves, at most {data.stats.optimalMax}, against {data.stats.threeStepAvg} for the three steps. Nobody can memorise every case, so strong solvers
            learn the common patterns and look ahead. Here, the computer does the searching for you.
          </>,
        )}
      </p>
      <h4>{tr("Ví dụ", "Example")}</h4>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
        <Fig caption={tr("Một trạng thái cụ thể của sáu cạnh.", "One concrete state of the six edges.")}>
          <LseView state={exState} mode="all" width={170} />
        </Fig>
        <div style={{ flex: 1, minWidth: 240 }}>
          <p style={{ marginTop: 0 }}>
            <strong>{tr(`Ba bước: ${ex.stepsLen} nước`, `Three steps: ${moves(ex.stepsLen)}`)}</strong>
          </p>
          <ol className="small">
            {ex.steps.map((s) => (
              <li key={s.name}>
                {s.name === "eo" ? "EO" : s.name === "ulur" ? "UL/UR" : "4c"}: {s.alg ? <AlgText alg={s.alg} /> : <span className="muted">{tr("không cần làm gì", "nothing to do")}</span>}
              </li>
            ))}
          </ol>
          <p>
            <strong>{tr(`L6E tối ưu: ${ex.optimalLen} nước`, `Optimal L6E: ${moves(ex.optimalLen)}`)}</strong>
          </p>
          <div className="alg-row">
            <AlgText alg={ex.optimal} />
            <CopyButton text={ex.optimal} />
          </div>
        </div>
      </div>

      <h4 id="l6e-solver">{tr("Bộ giải L6E: tìm lời giải ngắn nhất cho cube của bạn", "L6E solver: the shortest solution for your cube")}</h4>
      <p>
        {tr(
          <>
            Chỉ dùng được khi <strong>tâm đã thẳng hàng</strong> (xoay M cho thẳng) và <strong>bốn góc tầng trên đã khớp</strong> (xoay U cho khớp). Với mỗi vị trí cạnh, chọn
            cạnh đang nằm ở đó (gọi theo hai màu của nó) và đánh dấu nếu cạnh bị <strong>xấu</strong> (sticker màu mặt trên/dưới nằm ở mặt bên{names}).
          </>,
          <>
            Works only when <strong>the centres are lined up</strong> (turn M to line them up) and <strong>the four top corners match</strong> (turn U to match them). For each
            edge position, choose the edge sitting there (named by its two colours) and tick it if it is <strong>bad</strong> (its top/bottom-colour sticker is
            on a side face{names}).
          </>,
        )}
      </p>
      <div className="solver-grid">
        {EDGE_POS.map((p, i) => (
          <div key={p} style={{ display: "contents" }}>
            <span>{posName(p)}</span>
            <select
              className="input"
              value={pieces[i]}
              aria-label={`${posName(p)}: ${tr("cạnh đang nằm ở đây", "edge sitting here")}`}
              onChange={(e) => setPieces(pieces.map((x, k) => (k === i ? e.target.value : x)))}
            >
              {EDGE_POS.map((q) => (
                <option key={q} value={q}>
                  {pieceLabel(q)}
                </option>
              ))}
            </select>
            <label className="small">
              <input type="checkbox" checked={flipped[i]} onChange={() => setFlipped(flipped.map((x, k) => (k === i ? !x : x)))} /> {tr("xấu", "bad")}
            </label>
          </div>
        ))}
      </div>
      <div className="bar" style={{ marginTop: 8 }}>
        <button className="btn primary" onClick={run} disabled={busy || !distinct}>
          {busy ? tr("Đang tính…", "Searching…") : tr("Tìm lời giải ngắn nhất", "Find the shortest solution")}
        </button>
        <button className="btn" onClick={reset}>
          {tr("↺ Đặt lại", "↺ Reset")}
        </button>
      </div>
      {!distinct && (
        <Callout kind="warn" title={tr("Mỗi cạnh chỉ xuất hiện một lần", "Each edge appears once")}>
          <p style={{ margin: 0 }}>{tr("Hai vị trí đang chọn cùng một cạnh. Hãy chọn sáu cạnh khác nhau.", "Two positions have the same edge selected. Choose six different edges.")}</p>
        </Callout>
      )}
      {result && !result.ok && (
        <Callout kind="warn" title={tr("Trạng thái này không thể có", "This state cannot occur")}>
          <p style={{ margin: 0 }}>
            {tr(
              "Không có chuỗi M và U nào tạo ra trạng thái này (thường do số cạnh xấu lẻ, hoặc hai cạnh bị đổi chỗ sai tính chẵn lẻ). Kiểm tra lại các ô đã chọn.",
              "No sequence of M and U moves makes this state (usually an odd number of bad edges, or a swap of the wrong parity). Check your choices again.",
            )}
          </p>
        </Callout>
      )}
      {result && result.ok && (
        <>
          <p>
            {result.alg
              ? tr(`Lời giải ngắn nhất (${result.len} nước):`, `Shortest solution (${moves(result.len)}):`)
              : tr("Sáu cạnh đã giải xong.", "The six edges are already solved.")}
          </p>
          {result.alg && (
            <>
              <div className="alg-row">
                <AlgText alg={result.alg} />
                <CopyButton text={result.alg} />
              </div>
              <AlgStepper start={state} alg={result.alg} hideEdges={false} doneText={tr("Xong: cả sáu cạnh đã đúng", "Done: all six edges solved")} />
            </>
          )}
        </>
      )}
    </>
  );
}
