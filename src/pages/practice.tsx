import { useEffect, useMemo, useState } from "react";
import { CubeIso } from "../components/cube-iso";
import { Icon } from "../components/icons";
import { LseView } from "../components/lse-view";
import { ALL_CENTRES, CMLL_PIECES, FB_PIECES, PiecesIso, SB_PIECES } from "../components/pieces-iso";
import { solvedState } from "../../shared/cube";
import { CopyButton, Fig, PageHead } from "../components/ui";
import { colorName, tr, useLang } from "../lib/i18n";
import { currentScheme } from "../lib/palette";
import { href, useRoute } from "../lib/router";
import { lseFinishedState, makeScramble, stateOfScramble, type StepKind } from "../lib/scramble";

interface Kind {
  id: StepKind;
  title: () => string;
  where: () => string;
  link: string;
  /** what the learner sees when the step is done, and what to check when it is not */
  done: () => string;
  wrong: () => string;
}

const KINDS: Kind[] = [
  {
    id: "full",
    title: () => tr("Cả lời giải", "Whole solve"),
    where: () => tr("Cube xáo trộn hoàn toàn. Giải từ đầu: khối đầu, khối thứ hai, CMLL, rồi LSE.", "A fully mixed cube. Solve from the start: first block, second block, CMLL, then LSE."),
    link: "/learn",
    done: () => tr("Cả sáu mặt cùng một màu.", "All six faces in one colour each."),
    wrong: () =>
      tr(
        "Nếu chỉ còn vài mảnh sai, hãy tìm xem bước nào chưa xong: khối đầu, khối thứ hai, bốn góc hay sáu cạnh. Quay lại đúng bước đó.",
        "If only a few pieces are wrong, find which step is not finished: the first block, the second block, the four corners or the six edges. Go back to exactly that step.",
      ),
  },
  {
    id: "first-block",
    title: () => tr("Khối đầu", "First block"),
    where: () => tr("Cube xáo trộn hoàn toàn. Việc của bạn: chỉ dựng khối đầu (1×2×3 bên trái) rồi dừng, không cần giải gì khác.", "A fully mixed cube. Your job: build only the first block (1×2×3 on the left) and stop; nothing else needs solving."),
    link: "/learn/first-block",
    done: () => tr("Bên trái, sát đáy: hai hàng ba ô cùng màu với tâm trái, và nửa trái của mặt trước, mặt sau, mặt dưới khớp màu tâm.", "On the left, at the bottom: two rows of three squares in the colour of the left centre, and the left half of the front, back and bottom faces matching their centres."),
    wrong: () =>
      tr(
        "Hàng ba ô còn một ô lệch màu: cặp góc–cạnh đó chưa vào đúng, hãy lấy cặp ra và ghép lại. Gần xong mà thiếu một mảnh: kiểm tra cạnh dưới–trái (DL) trước, vì các cặp khác bám vào nó. Nếu mặt trái đủ màu nhưng mặt bên không khớp tâm, có một mảnh nằm nhầm chỗ (đổi chỗ với mảnh khác, hoặc là mảnh của tầng trên).",
        "One square in the row of three has the wrong colour: that corner–edge pair is not in right, so take the pair out and join it again. Almost done but one piece missing: check the down–left edge (DL) first, because the other pairs attach to it. If the left face is complete but the side faces do not match their centres, a piece is in the wrong place (swapped with another piece, or one that belongs to the top layer).",
      ),
  },
  {
    id: "second-block",
    title: () => tr("Khối thứ hai", "Second block"),
    where: () => tr("Khối đầu (bên trái) đã xong, mọi thứ còn lại bị xáo. Việc của bạn: dựng khối bên phải.", "The first block (left) is done and everything else is mixed. Your job: build the right block."),
    link: "/learn/second-block",
    done: () => tr("Mỗi bên một khối: hai hàng ba ô cùng màu ở mặt trái và ở mặt phải, và bốn tâm (trên, trước, sau, dưới) nằm đúng chỗ.", "One block on each side: two rows of three squares in one colour on the left face and on the right face, and the four centres (top, front, back, bottom) in place."),
    wrong: () =>
      tr(
        "Khối trái bị phá: bạn đã xoay L, D, F hoặc B. Hãy dựng lại khối trái, rồi chỉ dùng R, r, U, M. Khối phải xong nhưng tâm trên không cùng màu với mặt trên: còn lệch một nước M, xoay M cho đến khi bốn tâm giữa nằm đúng chỗ.",
        "The left block is broken: you turned L, D, F or B. Rebuild the left block, then use only R, r, U and M. The right block is done but the top centre does not match the top face: you are one M turn off, so turn M until the four middle centres are in place.",
      ),
  },
  {
    id: "cmll",
    title: () => "CMLL",
    where: () => tr("Hai khối đã xong, bốn góc tầng trên đang lệch, các cạnh bị xáo. Việc của bạn: giải bốn góc.", "Both blocks are done, the four top corners are off and the edges are mixed. Your job: solve the four corners."),
    link: "/cmll",
    done: () => tr("Hai khối còn nguyên, bốn góc tầng trên về đúng chỗ (có thể còn lệch một nước U). Sáu cạnh còn xáo, chưa cần đúng.", "Both blocks are whole and the four top corners are in place (they may be one U turn off). The six edges are still mixed, which is fine."),
    wrong: () =>
      tr(
        "Hai khối bị phá: một nước trong công thức bị xoay sai chiều, hãy so lại từng nước. Bốn góc đúng nhưng lệch nhau: thêm một nước U cho khớp màu với hai khối. Chỉ đúng hai góc: bạn có thể nhận nhầm case, hãy mở công cụ tìm case.",
        "Both blocks are broken: one move of the algorithm was turned the wrong way, so compare it move by move. The four corners are right but out of line: add a U turn to match the blocks. Only two corners are right: you may have recognized the wrong case, so open the case finder.",
      ),
  },
  {
    id: "lse",
    title: () => tr("LSE (cả bước)", "LSE (whole step)"),
    where: () => tr("Hai khối và bốn góc đã xong, sáu cạnh bị xáo. Việc của bạn: giải cả sáu cạnh.", "Both blocks and the four corners are done and the six edges are mixed. Your job: solve all six edges."),
    link: "/lse",
    done: () => tr("Cả sáu mặt cùng một màu: cube đã giải.", "All six faces in one colour each: the cube is solved."),
    wrong: () =>
      tr(
        "Hai khối bị phá: bạn đã xoay một mặt khác ngoài M và U. Hãy quay lại bước nhỏ cuối cùng bạn làm và kiểm tra từng bước: lật cạnh, đặt cạnh trái-phải, rồi bốn cạnh cuối.",
        "Both blocks are broken: you turned a face other than M and U. Go back to the last small step you did and check each step: flip the edges, place the left and right edges, then the last four.",
      ),
  },
  {
    id: "eo",
    title: () => tr("LSE bước 1: lật cạnh (EO)", "LSE step 1: flip the edges (EO)"),
    where: () => tr("Như LSE, nhưng chắc chắn có cạnh xấu. Việc của bạn: xoay hướng cạnh (EO).", "Like LSE, but there is always at least one bad edge. Your job: orient the edges (EO)."),
    link: "/lse",
    done: () => tr("Cả sáu cạnh đều “ngửa”: nhìn lên trên hoặc xuống dưới chỉ thấy màu của tâm trên hoặc tâm dưới (hai màu đối nhau). Cạnh chưa cần đúng chỗ.", "All six edges are “facing up”: looking at the top or the bottom you only see the colour of the top or bottom centre (the two opposite colours). The edges do not need to be in place yet."),
    wrong: () =>
      tr(
        "Số cạnh xấu ban đầu luôn là số chẵn; nếu bạn đếm ra số lẻ, hãy đếm lại. Vẫn còn một cạnh xấu sau công thức: bạn quay sai một nước, hãy làm lại công thức từ đầu.",
        "The number of bad edges at the start is always even; if you count an odd number, count again. One bad edge is left after the algorithm: you turned one move wrongly, so do the algorithm again from the start.",
      ),
  },
  {
    id: "ulur",
    title: () => tr("LSE bước 2: cạnh trên-trái và trên-phải (UL/UR)", "LSE step 2: the top-left and top-right edges (UL/UR)"),
    where: () => tr("Mọi cạnh đã đúng hướng, UL và UR chưa đúng chỗ. Việc của bạn: đặt hai cạnh trái và phải.", "Every edge is oriented but UL and UR are not in place. Your job: place the left and right edges."),
    link: "/lse",
    done: () => tr("Cạnh có màu tâm trên và tâm trái nằm ở trên-trái, cạnh có màu tâm trên và tâm phải nằm ở trên-phải. Bốn cạnh còn lại nằm trên một vòng đứng ở giữa.", "The edge with the top and left centre colours sits at top-left and the edge with the top and right centre colours sits at top-right. The other four edges are on one upright ring in the middle."),
    wrong: () =>
      tr(
        "Hai cạnh đúng nhưng đổi chỗ cho nhau: nếu bốn góc cũng đang lệch nửa vòng thì một nước U2 sửa được; nếu không, tra thuật toán ở trang LSE bước 2. Một cạnh bị lật: lật cạnh (EO) đã hỏng, hãy quay lại bước 1.",
        "Both edges are right but swapped: if the four corners are also a half turn off, one U2 turn fixes it; otherwise look the algorithm up on the LSE step 2 page. An edge got flipped: the edge flip (EO) is broken, so go back to step 1.",
      ),
  },
  {
    id: "l4e",
    title: () => tr("LSE bước 3: bốn cạnh cuối", "LSE step 3: last four edges"),
    where: () => tr("Chỉ còn bốn cạnh UF, UB, DF, DB chưa đúng chỗ. Việc của bạn: giải bốn cạnh còn lại bằng M và U2.", "Only the four edges UF, UB, DF, DB are out of place. Your job: solve them with M and U2."),
    link: "/lse",
    done: () => tr("Cả sáu mặt cùng một màu: cube đã giải.", "All six faces in one colour each: the cube is solved."),
    wrong: () =>
      tr(
        "Còn hai hoặc bốn cạnh lệch: xem lại bốn cạnh UF, UB, DF, DB. Chỉ được dùng M và U2; một nước U hoặc U' làm UL và UR rời khỏi chỗ.",
        "Two or four edges are still off: look again at the four edges UF, UB, DF, DB. Only M and U2 are allowed; a U or U' turn knocks UL and UR out of place.",
      ),
  },
];

/** a picture of the cube when the step is finished */
function Finished({ kind, scramble }: { kind: StepKind; scramble: string }) {
  const lseKind = kind === "eo" || kind === "ulur" ? kind : null;
  const after = useMemo(() => (lseKind && scramble ? lseFinishedState(lseKind, scramble) : undefined), [lseKind, scramble]);
  const title = tr("Cube khi bước này xong", "The cube when this step is done");
  if (lseKind) return after ? <LseView state={after} mode={lseKind === "eo" ? "eo" : "all"} width={150} /> : null;
  if (kind === "first-block") return <PiecesIso pieces={[...FB_PIECES, ...ALL_CENTRES]} yaw={1} width={200} title={title} />;
  if (kind === "second-block") return <PiecesIso pieces={[...FB_PIECES, ...SB_PIECES, ...ALL_CENTRES]} width={200} title={title} />;
  if (kind === "cmll") return <PiecesIso pieces={[...FB_PIECES, ...SB_PIECES, ...CMLL_PIECES, ...ALL_CENTRES]} width={200} title={title} />;
  return <CubeIso state={solvedState()} width={200} title={title} />;
}

const KIND_IDS = KINDS.map((k) => k.id as string);

export function PracticePage() {
  useLang();
  const { query } = useRoute();
  // a link such as /practice?step=first-block opens with that step chosen
  const wanted = query.get("step") ?? "";
  const [kind, setKind] = useState<StepKind>(KIND_IDS.includes(wanted) ? (wanted as StepKind) : "full");
  useEffect(() => {
    if (KIND_IDS.includes(wanted)) setKind(wanted as StepKind);
  }, [wanted]);
  const [scramble, setScramble] = useState("");
  const [busy, setBusy] = useState(false);
  const info = KINDS.find((k) => k.id === kind)!;
  const next = async (k: StepKind) => {
    setBusy(true);
    try {
      setScramble(await makeScramble(k));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void next(kind);
  }, [kind]);
  const state = useMemo(() => (scramble ? stateOfScramble(scramble) : undefined), [scramble]);
  const sc = currentScheme();
  return (
    <>
      <PageHead
        title={tr("Luyện tập: scramble cho từng bước", "Practice: a scramble for each step")}
        lead={tr(
          "Chọn bước bạn muốn tập. Trang đưa một scramble làm trên cube đã giải, và cube sẽ dừng đúng ở đầu bước đó, không cần giải các bước trước.",
          "Pick the step you want to practise. The page gives a scramble to do on a solved cube, and the cube stops exactly at the start of that step, so you do not have to solve the earlier steps.",
        )}
      />
      <div className="bar" role="group" aria-label={tr("Chọn bước", "Choose a step")}>
        {KINDS.map((k) => (
          <button key={k.id} className="chip" aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
            {k.title()}
          </button>
        ))}
      </div>
      <p>{info.where()}</p>
      {kind === "full" && (
        <details className="callout info">
          <summary className="ttl" style={{ cursor: "pointer" }}>{tr("Scramble được tạo như thế nào (không bắt buộc đọc)", "How the scramble is made (optional)")}</summary>
          <ul className="small" style={{ margin: "8px 0 0" }}>
            <li>
              {tr(
                "Trạng thái ngẫu nhiên đều: mỗi lần sinh một trạng thái cube bất kỳ, không phải một chuỗi nước ngẫu nhiên.",
                "A random state: each time a cube state is drawn at random, not a random string of moves.",
              )}
            </li>
            <li>
              {tr(
                "Sinh bằng cubing.js (bộ sinh 3x3 kiểu WCA). Cuộc thi WCA dùng TNoodle; hai bộ sinh cùng kiểu nhưng có thể cho chuỗi khác nhau.",
                "Made by cubing.js (a WCA-style 3x3 generator). WCA competitions use TNoodle; the two are the same kind but can give different sequences.",
              )}
            </li>
            <li>
              {tr(
                "Ký hiệu: R L U D F B với ' và 2. Không dùng nước rộng, nước lát giữa hay xoay cả khối.",
                "Notation: R L U D F B with ' and 2. No wide moves, slice moves or whole-cube rotations.",
              )}
            </li>
            <li>
              {tr(
                "Số nước không cố định: bộ sinh quyết định. Số nước đang hiển thị bên dưới là của scramble này.",
                "The length is not fixed: the generator decides it. The count shown below is for this scramble.",
              )}
            </li>
          </ul>
        </details>
      )}
      <p className="small muted">
        {tr(
          `Cách cầm cube: mặt ${colorName(sc.U)} ở trên, mặt ${colorName(sc.F)} ở trước (nếu cube của bạn khác, đổi màu ở nút Màu cube trên thanh đầu trang), rồi làm scramble từ trạng thái đã giải.`,
          `How to hold the cube: ${colorName(sc.U)} on top and ${colorName(sc.F)} in front (if your cube differs, change the colours with the Cube colours button in the top bar), then do the scramble from the solved state.`,
        )}
      </p>
      <div className="card" style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div className="alg-row" style={{ alignItems: "center" }}>
            <span className="alg scramble-text" translate="no" aria-live="polite">
              {busy && !scramble ? "…" : scramble}
            </span>
          </div>
          <div className="bar" style={{ flexWrap: "wrap" }}>
            <button className="btn primary" onClick={() => next(kind)} disabled={busy}>
              {busy ? tr("Đang tạo…", "Making…") : <><Icon name="reroll" /> {tr("Scramble mới", "New scramble")}</>}
            </button>
            {scramble && <CopyButton text={scramble} />}
            {kind === "full" && scramble && (
              <a className="btn" href={href(`/solve?s=${encodeURIComponent(scramble)}`)}>
                {tr("Xem lời giải →", "See a solution →")}
              </a>
            )}
            <a className="btn" href={href(info.link)}>
              {tr("Học bước này →", "Learn this step →")}
            </a>
          </div>
          <p className="small muted">
            {tr(`${scramble ? scramble.split(" ").length : 0} nước. R, r, M, U… đọc ở trang Ký hiệu nếu chưa quen.`, `${scramble ? scramble.split(" ").length : 0} moves. See the Notation page if R, r, M, U… are new to you.`)}
          </p>
        </div>
        {state && (
          <Fig
            caption={tr(
              `Nhìn từ trước: mặt ${colorName(sc.F)} bên trái, mặt ${colorName(sc.R)} bên phải, mặt ${colorName(sc.U)} ở trên.`,
              `Seen from the front: ${colorName(sc.F)} face on the left, ${colorName(sc.R)} on the right, ${colorName(sc.U)} on top.`,
            )}
          >
            <CubeIso state={state} width={230} title={tr("Cube sau scramble", "The cube after the scramble")} />
          </Fig>
        )}
      </div>
      <section className="card soft" aria-labelledby="done-title" style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
        <Fig caption={tr("Hình cube khi bước này xong", "The cube when this step is done")}>
          <Finished kind={kind} scramble={scramble} />
        </Fig>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h3 id="done-title" style={{ marginTop: 0 }}>{tr("Khi xong bạn sẽ thấy", "When you are done you will see")}</h3>
          <p>{info.done()}</p>
          <h3>{tr("Sai ở đâu?", "Where did it go wrong?")}</h3>
          <p style={{ marginBottom: 0 }}>{info.wrong()}</p>
        </div>
      </section>
      <p className="small muted">
        {tr(
          <>
            Muốn tập một case CMLL hay một thuật toán cụ thể? Mỗi case ở <a href={href("/cmll/2-look")}>CMLL 2-look</a>, <a href={href("/cmll/all")}>đủ 42 case</a> và <a href={href("/lse")}>LSE</a>{" "}
            đều có dòng “Scramble luyện” riêng.
          </>,
          <>
            Want to drill one CMLL case or one specific algorithm? Every case on <a href={href("/cmll/2-look")}>CMLL 2-look</a>, <a href={href("/cmll/all")}>all 42 cases</a> and{" "}
            <a href={href("/lse")}>LSE</a> has its own “Practice scramble” line.
          </>,
        )}
      </p>
    </>
  );
}
