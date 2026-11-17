import { useEffect, useMemo, useState } from "react";
import { CubeIso } from "../components/cube-iso";
import { Icon } from "../components/icons";
import { CopyButton, Fig, PageHead } from "../components/ui";
import { colorName, tr, useLang } from "../lib/i18n";
import { currentScheme } from "../lib/palette";
import { href } from "../lib/router";
import { makeScramble, stateOfScramble, type StepKind } from "../lib/scramble";

interface Kind {
  id: StepKind;
  title: () => string;
  where: () => string;
  link: string;
}

const KINDS: Kind[] = [
  {
    id: "full",
    title: () => tr("Cả lời giải", "Whole solve"),
    where: () => tr("Cube xáo trộn hoàn toàn. Giải từ đầu: khối đầu, khối hai, CMLL, rồi LSE.", "A fully mixed cube. Solve from the start: first block, second block, CMLL, then LSE."),
    link: "/learn",
  },
  {
    id: "second-block",
    title: () => tr("Khối thứ hai", "Second block"),
    where: () => tr("Khối đầu (bên trái) đã xong, mọi thứ còn lại bị xáo. Việc của bạn: dựng khối bên phải.", "The first block (left) is done and everything else is mixed. Your job: build the right block."),
    link: "/learn/second-block",
  },
  {
    id: "cmll",
    title: () => "CMLL",
    where: () => tr("Hai khối đã xong, bốn góc tầng trên đang lệch, các cạnh bị xáo. Việc của bạn: giải bốn góc.", "Both blocks are done, the four top corners are off and the edges are mixed. Your job: solve the four corners."),
    link: "/cmll",
  },
  {
    id: "lse",
    title: () => tr("LSE (cả bước)", "LSE (whole step)"),
    where: () => tr("Hai khối và bốn góc đã xong, sáu cạnh bị xáo. Việc của bạn: giải cả sáu cạnh.", "Both blocks and the four corners are done and the six edges are mixed. Your job: solve all six edges."),
    link: "/lse",
  },
  {
    id: "eo",
    title: () => tr("LSE bước 1: EO", "LSE step 1: EO"),
    where: () => tr("Như LSE, nhưng chắc chắn có cạnh xấu. Việc của bạn: xoay hướng cạnh (EO).", "Like LSE, but there is always at least one bad edge. Your job: orient the edges (EO)."),
    link: "/lse",
  },
  {
    id: "ulur",
    title: () => tr("LSE bước 2: UL/UR", "LSE step 2: UL/UR"),
    where: () => tr("Mọi cạnh đã đúng hướng, UL và UR chưa đúng chỗ. Việc của bạn: đặt hai cạnh trái và phải.", "Every edge is oriented but UL and UR are not in place. Your job: place the left and right edges."),
    link: "/lse",
  },
  {
    id: "l4e",
    title: () => tr("LSE bước 3: bốn cạnh cuối", "LSE step 3: last four edges"),
    where: () => tr("Chỉ còn bốn cạnh UF, UB, DF, DB chưa đúng chỗ. Việc của bạn: giải bốn cạnh còn lại bằng M và U2.", "Only the four edges UF, UB, DF, DB are out of place. Your job: solve them with M and U2."),
    link: "/lse",
  },
];

export function PracticePage() {
  useLang();
  const [kind, setKind] = useState<StepKind>("full");
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
          <summary className="ttl" style={{ cursor: "pointer" }}>{tr("Luật sinh scramble (không bắt buộc đọc)", "How the scramble is made (optional)")}</summary>
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
          `Cách cầm cube: mặt ${colorName(sc.U)} ở trên, mặt ${colorName(sc.F)} ở trước (đổi màu ở trang chủ nếu cube của bạn khác), rồi làm scramble từ trạng thái đã giải.`,
          `How to hold the cube: ${colorName(sc.U)} on top and ${colorName(sc.F)} in front (change the colours on the home page if your cube differs), then do the scramble from the solved state.`,
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
