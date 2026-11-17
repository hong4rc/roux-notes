import { useMemo, useState } from "react";
import { applyAlg, invertAlg, type State } from "../../shared/cube";
import { caseScrambleOf, tidy } from "../lib/scramble";
import type { OrientAlg } from "../data/two-look";
import { AlgStepper } from "../components/alg-stepper";
import { CaseTop, OrientTop } from "../components/case-views";
import { AlgText, Callout, CopyButton, Fig, LearnedBox, PageHead, ScrambleLine, Why } from "../components/ui";
import {
  ALL_CORNER_STATES,
  CMLL_BY_ID,
  CMLL_CASES,
  GROUPS,
  GROUP_ORDER,
  fullAlg,
  headlightFaces,
  inverseCase,
  mirrorCase,
  moveCount,
  orientationOf,
  sameColorFaces,
  type CmllCase,
  type GroupId,
} from "../data/cmll";
import stats from "../data/cmll-stats.json";
import { ORIENT_ALGS, PERMUTE_ALGS } from "../data/two-look";
import { PermuteCard } from "../components/permute-card";
import { canonicalForOrient, planTwoLook } from "../data/two-look-plan";
import { useLang, tr } from "../lib/i18n";
import { href } from "../lib/router";
import { setOrientPick, useSettings, type OrientChoice } from "../lib/store";
import { fingerWords } from "../data/fingertricks";

export function CmllTabs({ active }: { active: "tong-quan" | "2-look" | "all" | "tim" }) {
  useLang();
  const items = [
    { id: "tong-quan", to: "/cmll", label: tr("Tổng quan & so sánh", "Overview & comparison") },
    { id: "2-look", to: "/cmll/2-look", label: tr("CMLL 2-look (cơ bản)", "CMLL 2-look (basic)") },
    { id: "all", to: "/cmll/all", label: tr("Đủ 42 case (nâng cao)", "All 42 cases (advanced)") },
    { id: "tim", to: "/finder", label: tr("Tìm case của tôi", "Find my case") },
  ] as const;
  return (
    <nav className="bar" aria-label={tr("Các mục CMLL", "CMLL sections")} style={{ marginTop: 6 }}>
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

// per-case probability, from how many of the 648 corner states fall into each case
const CASE_COUNT = new Map<string, number>();
for (const s of ALL_CORNER_STATES) if (s.caseId) CASE_COUNT.set(s.caseId, (CASE_COUNT.get(s.caseId) ?? 0) + 1);
const pct = (id: string) => (((CASE_COUNT.get(id) ?? 0) / 648) * 100).toFixed(1);

const movesText = (n: number | string) => tr(`${n} nước`, `${n} ${Number(n) === 1 ? "move" : "moves"}`);

const groupAvg = (g: GroupId) => {
  const list = CMLL_CASES.filter((c) => c.group === g);
  return (list.reduce((n, c) => n + moveCount(c.algs[0].alg), 0) / list.length).toFixed(1);
};

// ------------------------------------------------------------------ overview

export function CmllHome() {
  const { learned } = useSettings();
  useLang();
  return (
    <>
      <PageHead
        title={tr("CMLL: giải bốn góc tầng cuối", "CMLL: solve the last four corners")}
        crumbs={<a href={href("/")}>{tr("Trang chủ", "Home")}</a>}
        lead={tr(
          "Sau hai khối 1×2×3, chỉ còn bốn góc ở tầng trên chưa đúng chỗ. CMLL đưa cả bốn góc về đúng vị trí và đúng hướng trong một lượt, mặc kệ các cạnh.",
          "After the two 1×2×3 blocks, only the four corners of the top layer are still out of place. CMLL puts all four corners in the right position and orientation in one go, and ignores the edges.",
        )}
      />
      <CmllTabs active="tong-quan" />

      <h2>{tr("Mục tiêu và vị trí trong lượt giải", "The goal and where it fits in the solve")}</h2>
      <div className="figs">
        <Fig caption={tr("Trước CMLL: hai khối xong, bốn góc tầng trên lộn xộn", "Before CMLL: both blocks are done, the four top corners are mixed up")}>
          <CaseTop state={CMLL_BY_ID.get("s-left-bar")!.state} width={170} title={tr("Một case CMLL trước khi giải", "A CMLL case before solving")} />
        </Fig>
        <div className="arrow-between" aria-hidden>
          →
        </div>
        <Fig caption={tr("Sau CMLL: bốn góc đúng, các cạnh (xám) mặc kệ", "After CMLL: the four corners are right, the edges (grey) are ignored")}>
          <CaseTop state={applyAlg(CMLL_BY_ID.get("s-left-bar")!.state, fullAlg(CMLL_BY_ID.get("s-left-bar")!.algs[0]))} width={170} title={tr("Sau khi giải CMLL", "After solving CMLL")} />
        </Fig>
      </div>
      <Why title={tr("Vì sao CMLL bỏ qua các cạnh?", "Why does CMLL ignore the edges?")}>
        <p>
          {tr(
            <>
              Sáu cạnh còn lại (UF, UB, UL, UR, DF, DB) sẽ được giải ở bước LSE bằng đúng hai kiểu nước <code>M</code> và <code>U</code>. Hai kiểu nước đó
              không bao giờ phá hai khối hay bốn góc. Vì thế CMLL không cần giữ các cạnh tại chỗ, và nhờ được xáo trộn cạnh tùy ý nên các thuật toán CMLL
              ngắn hơn nhiều so với thuật toán phải giữ nguyên cạnh (như OLL hoặc PLL của CFOP).
            </>,
            <>
              The six remaining edges (UF, UB, UL, UR, DF, DB) are solved in the LSE step using only two kinds of move, <code>M</code> and <code>U</code>.
              Those moves never break the two blocks or the four corners. So CMLL does not need to keep the edges in place, and because it may scramble them
              freely, CMLL algorithms are much shorter than algorithms that must keep the edges intact (like OLL or PLL in CFOP).
            </>,
          )}
        </p>
        <p>
          {tr(
            <>
              Đổi lại, trước khi vào LSE bạn phải <strong>để nguyên bốn góc và hai khối</strong>: đó là điều duy nhất CMLL phải giữ.
            </>,
            <>
              In return, before you start LSE you must <strong>leave the four corners and the two blocks intact</strong>: that is the only thing CMLL has to protect.
            </>,
          )}
        </p>
      </Why>

      <h2>{tr("CMLL 2-look hay đủ 42 case?", "CMLL 2-look or all 42 cases?")}</h2>
      <p>
        {tr(
          <>
            Có hai cách giải bốn góc. <strong>2-look</strong> làm hai lượt: lượt đầu xoay cho cả bốn góc cùng quay vàng lên trên, lượt hai đổi chỗ góc.{" "}
            <strong>Đủ 42 case</strong> (còn gọi 1-look) nhận ra case ngay từ đầu và giải bằng đúng một thuật toán.
          </>,
          <>
            There are two ways to solve the four corners. <strong>2-look</strong> takes two steps: the first turns all four corners so yellow faces up, the second swaps the corners into place.{" "}
            <strong>All 42 cases</strong> (also called 1-look) recognises the case right away and solves it with a single algorithm.
          </>,
        )}
      </p>
      <div className="table-scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th></th>
              <th>2-look</th>
              <th>{tr("Đủ 42 case", "All 42 cases")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{tr("Số thuật toán phải nhớ", "Algorithms to memorise")}</td>
              <td>
                {tr(
                  <>
                    <strong>9</strong> (7 để xoay hướng + 2 để đổi chỗ)
                  </>,
                  <>
                    <strong>9</strong> (7 to orient + 2 to permute)
                  </>,
                )}
              </td>
              <td>
                {tr(
                  <>
                    <strong>42</strong> (mỗi case một thuật toán chính)
                  </>,
                  <>
                    <strong>42</strong> (one main algorithm per case)
                  </>,
                )}
              </td>
            </tr>
            <tr>
              <td>{tr("Số lần phải nhìn và nhận dạng", "Times you must look and recognise")}</td>
              <td>{tr("2 lần (nhận dạng hình vàng, rồi nhận dạng đèn pha)", "2 times (recognise the yellow shape, then the headlights)")}</td>
              <td>{tr("1 lần (nhận dạng cả hai điều cùng lúc)", "1 time (recognise both things at once)")}</td>
            </tr>
            <tr>
              <td>{tr("Số nước trung bình*", "Average number of moves*")}</td>
              <td>
                {tr(
                  <>
                    <strong>{stats.twoLookAvg}</strong> nước (nhiều nhất {stats.twoLookMax})
                  </>,
                  <>
                    <strong>{stats.twoLookAvg}</strong> moves (at most {stats.twoLookMax})
                  </>,
                )}
              </td>
              <td>
                {tr(
                  <>
                    <strong>{stats.fullAvg}</strong> nước (nhiều nhất {stats.fullMax})
                  </>,
                  <>
                    <strong>{stats.fullAvg}</strong> moves (at most {stats.fullMax})
                  </>,
                )}
              </td>
            </tr>
            <tr>
              <td>{tr("Cần dùng hai lần thuật toán", "Needs two algorithms")}</td>
              <td>
                {tr(
                  `${Math.round((stats.twoLookTwoAlgs / stats.states) * 100)}% trường hợp (còn lại ${Math.round((stats.twoLookOneAlg / stats.states) * 100)}% chỉ cần một)`,
                  `${Math.round((stats.twoLookTwoAlgs / stats.states) * 100)}% of cases (the other ${Math.round((stats.twoLookOneAlg / stats.states) * 100)}% need only one)`,
                )}
              </td>
              <td>{tr("Gần như luôn một lần", "Almost always just one")}</td>
            </tr>
            <tr>
              <td>{tr("Hợp với", "Good for")}</td>
              <td>{tr("Người mới học Roux, hoặc muốn vào LSE sớm", "People new to Roux, or who want to reach LSE sooner")}</td>
              <td>{tr("Người đã quen Roux và thấy CMLL là chỗ chậm nhất", "People used to Roux who find CMLL their slowest step")}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="small muted">
        {tr(
          "*Tính trên cả 648 cách bốn góc có thể nằm sau khi hai khối xong, đếm cả các nước U căn chỉnh (một nước U2 tính một nước). Số liệu do chính mô phỏng của trang này tính, dùng các thuật toán trong danh sách bên dưới.",
          "*Counted over all 648 ways the four corners can sit once the two blocks are done, including the U alignment moves (one U2 counts as one move). The numbers come from this site's own simulation, using the algorithms listed below.",
        )}
      </p>

      <Why title={tr("Vì sao nhiều người vẫn bắt đầu bằng 2-look?", "Why do many people still start with 2-look?")}>
        <p>
          {tr(
            "Chín thuật toán đủ để giải mọi trường hợp, và hầu hết bạn đã biết từ CFOP (Sune, Antisune, Pi, H, T, U, L và hai thuật toán hoán vị). Bạn có thể luyện LSE và hai khối trước, rồi mới học dần các case riêng lẻ ở những nhóm hay gặp. Số nước thêm ra chủ yếu làm chậm bạn ở chính bước CMLL, nên khi CMLL trở thành điểm nghẽn thì mới là lúc đáng đầu tư học đủ.",
            "Nine algorithms are enough to solve every case, and you probably know most of them from CFOP (Sune, Antisune, Pi, H, T, U, L and two permutation algorithms). You can practise LSE and the two blocks first, then learn single cases from the groups you meet most. The extra moves mostly slow you down in the CMLL step itself, so only when CMLL becomes the bottleneck is it worth investing in the full set.",
          )}
        </p>
      </Why>

      <h2>{tr("Lộ trình học đủ 42 case", "A path to learning all 42 cases")}</h2>
      <ol>
        <li>
          {tr(
            <>
              <strong>2-look trước.</strong> Hai thuật toán hoán vị của 2-look chính là hai case nhóm “Đã đúng hướng”, nên bạn đã biết 2/42 case.
            </>,
            <>
              <strong>2-look first.</strong> The two permutation algorithms of 2-look are exactly the two cases of the “Oriented” group, so you already know 2 of the 42 cases.
            </>,
          )}
        </li>
        <li>
          {tr(
            <>
              <strong>Sune và Antisune (12 case).</strong> Thuật toán ngắn (trung bình {groupAvg("S")} và {groupAvg("As")} nước), dùng lại cùng một ngón tay.
            </>,
            <>
              <strong>Sune and Antisune (12 cases).</strong> Short algorithms (on average {groupAvg("S")} and {groupAvg("As")} moves) that reuse the same finger tricks.
            </>,
          )}
        </li>
        <li>
          {tr(
            <>
              <strong>U, T, L (18 case)</strong>: trung bình {groupAvg("U")}, {groupAvg("T")} và {groupAvg("L")} nước.
            </>,
            <>
              <strong>U, T, L (18 cases)</strong>: on average {groupAvg("U")}, {groupAvg("T")} and {groupAvg("L")} moves.
            </>,
          )}
        </li>
        <li>
          {tr(
            <>
              <strong>Pi và H (10 case)</strong>: dài hơn ({groupAvg("Pi")} và {groupAvg("H")} nước), học sau cùng.
            </>,
            <>
              <strong>Pi and H (10 cases)</strong>: longer ({groupAvg("Pi")} and {groupAvg("H")} moves), learn them last.
            </>,
          )}
        </li>
      </ol>
      <p>
        {tr(
          <>
            Bạn đang đánh dấu <strong>{learned.filter((id) => CMLL_BY_ID.has(id)).length}/42</strong> case là đã thuộc.
          </>,
          <>
            You have marked <strong>{learned.filter((id) => CMLL_BY_ID.has(id)).length}/42</strong> cases as learned.
          </>,
        )}{" "}
        <a href={href("/cmll/all")}>{tr("Mở thư viện đủ 42 case →", "Open the library of all 42 cases →")}</a>
      </p>
    </>
  );
}

// ------------------------------------------------------------------ 2-look

/**
 * One orientation shape of step 1. The picture is the shape; a new scramble is another case of the same group, which has the same
 * shape up to a U turn (checked in verify-all), so the picture stays and the learner turns U to match it.
 */
function OrientCard({ a, state, scramble }: { a: OrientAlg; state: State; scramble: string }) {
  const [sc, setSc] = useState(scramble);
  const group = CMLL_CASES.filter((c) => c.group === a.group);
  return (
    <div id={`orient-${a.group.toLowerCase()}`} className="card" style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
      <OrientTop state={state} width={118} title={tr(`Hình ${a.name}: chỉ hiện sticker vàng`, `Shape ${a.name}: only the yellow stickers are shown`)} />
      <div style={{ flex: 1, minWidth: 190 }}>
        <h3 style={{ margin: "0 0 2px" }}>{a.name}</h3>
        <p className="small muted" style={{ margin: "0 0 4px" }}>
          {GROUPS[a.group].blurb}
        </p>
        <div className="alg-row">
          <AlgText alg={a.alg} />
        </div>
        <div className="alg-row">
          <CopyButton text={a.alg} />
        </div>
        <div className="small">{a.note}</div>
        <ScrambleLine scramble={sc} compact onReroll={() => setSc(caseScrambleOf(group[Math.floor(Math.random() * group.length)]))} />
      </div>
      {a.options && <OrientOptions a={a} />}
    </div>
  );
}

function OrientOptions({ a }: { a: OrientAlg }) {
  const { orient } = useSettings();
  const opts = a.options!;
  const g = a.group as OrientChoice;
  const picked = Math.min(orient[g], opts.length - 1);
  return (
    <details className="orient-options">
      <summary className="small">
        {tr(`Có ${opts.length} cách làm, đang dùng cách ${moveCount(opts[picked].alg)} nước. Bấm để xem và đổi.`, `${opts.length} ways; using the ${moveCount(opts[picked].alg)}-move one. Tap to see and change.`)}
      </summary>
      <fieldset className="perm-options">
      {opts.map((o, i) => (
        <label key={o.alg} className={`perm-opt ${i === picked ? "on" : ""}`}>
          <input type="radio" name={`orient-${a.group}`} checked={i === picked} onChange={() => setOrientPick(g, i)} />
          <span className="perm-body">
            <span className="perm-head">
              <strong>{o.title}</strong>
              <span className="chip-static">{tr(`${moveCount(o.alg)} nước`, `${moveCount(o.alg)} moves`)}</span>
            </span>
            <span className="alg-row">
              <AlgText alg={o.alg} />
            </span>
            <span className="alg-row" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <CopyButton text={o.alg} />
              {o.source && (
                <a className="tag" href={o.source.url} target="_blank" rel="noreferrer">
                  {o.source.name}
                </a>
              )}
            </span>
            <span className="perm-notes small">
              {o.pros.map((t) => (
                <span key={t} className="pro">
                  + {t}
                </span>
              ))}
              {o.cons.map((t) => (
                <span key={t} className="con">
                  − {t}
                </span>
              ))}
            </span>
            {o.fingers && (
              <span className="small orient-fingers">
                <span>
                  {tr("Từng nước", "Move by move")} ({o.fingers.by},{" "}
                  <a href={o.fingers.source.url} target="_blank" rel="noreferrer">
                    {tr("nguồn", "source")}
                  </a>
                  ):
                </span>
                <ol>
                  {o.alg.split(" ").map((m, j) => (
                    <li key={j}>
                      <code translate="no">{m}</code> {o.fingers!.steps[j] ?? ""}
                    </li>
                  ))}
                </ol>
                {o.fingers.note && <span className="muted">{o.fingers.note}</span>}
              </span>
            )}
          </span>
        </label>
      ))}
      <p className="small muted" style={{ margin: "6px 0 0" }}>
        {tr("Công thức bạn chọn cũng được dùng ở trang “Giải scramble”.", "The algorithm you pick is also used on the “Solve” page.")}
      </p>
      </fieldset>
    </details>
  );
}

export function CmllTwoLook() {
  const lang = useLang();
  const orient = useMemo(
    () =>
      ORIENT_ALGS.map((a) => {
        const state = canonicalForOrient(a);
        return { a, state, scramble: tidy(ALL_CORNER_STATES.find((l) => l.state === state)?.scramble ?? "") };
      }),
    [],
  );
  const permuteStates = {
    adjacent: CMLL_BY_ID.get("o-adjacent-swap")!,
    diagonal: CMLL_BY_ID.get("o-diagonal-swap")!,
  };
  const example = CMLL_BY_ID.get("u-front-row")!;
  const { perm } = useSettings();
  const plan = useMemo(() => planTwoLook(example.state)!, [example, lang, perm]);
  const [exStep, setExStep] = useState(0);
  return (
    <>
      <PageHead
        title="CMLL 2-look"
        crumbs={
          <>
            <a href={href("/cmll")}>CMLL</a> › 2-look
          </>
        }
        lead={tr(
          "Giải bốn góc bằng hai lượt: lượt 1 cho cả bốn góc cùng quay vàng lên trên, lượt 2 đổi chỗ góc cho đúng. Tổng cộng chín thuật toán.",
          "Solve the four corners in two steps: step 1 turns all four corners so yellow faces up, step 2 swaps the corners into the right places. Nine algorithms in total.",
        )}
      />
      <CmllTabs active="2-look" />

      <Callout kind="tip" title={tr("Nhắc lại cách đọc hình", "How to read the pictures, again")}>
        <p style={{ margin: 0 }}>
          {tr(
            <>
              Mọi hình nhìn từ trên xuống: <strong>mặt trước ở phía dưới hình</strong>. Ô lớn ở giữa là mặt trên, các dải mỏng quanh viền là sticker bên hông
              của các góc. Cạnh được tô xám vì CMLL không quan tâm cạnh. Màu vàng là màu tâm mặt trên.
            </>,
            <>
              Every picture looks from above: <strong>the front face is at the bottom of the picture</strong>. The big square in the middle is the top face, and the thin strips around the border are the side stickers
              of the corners. Edges are grey because CMLL does not care about edges. Yellow is the colour of the top centre.
            </>,
          )}
        </p>
      </Callout>

      <h2>{tr("Lượt 1: xoay hướng bốn góc", "Step 1: orient the four corners")}</h2>
      <p>
        {tr(
          <>
            Nhìn xem có mấy góc đã có vàng ở mặt trên và các sticker vàng còn lại nằm ở đâu. Hình dạng đó cho biết bạn thuộc nhóm nào trong bảy nhóm.{" "}
            <strong>Xoay tầng trên (U) cho giống hình</strong> rồi làm thuật toán.
          </>,
          <>
            Check how many corners already have yellow on top and where the other yellow stickers are. That shape tells you which of the seven groups you have.{" "}
            <strong>Turn the top layer (U) to match the picture</strong>, then do the algorithm.
          </>,
        )}
      </p>
      <Why title={tr("Vì sao phải xoay U cho giống hình trước?", "Why turn U to match the picture first?")}>
        <p>
          {tr(
            "Một thuật toán xoay hướng chỉ đúng khi các góc nằm đúng chỗ nó mong đợi: nó xoay những góc ở vị trí cố định (trước-phải, trước-trái…), không “biết” góc nào có vàng. Xoay U trước đưa cả cụm hình về đúng góc nhìn đó. Sau lượt này hướng đã xong, vị trí góc chưa chắc đúng; đó là việc của lượt 2.",
            "An orientation algorithm only works when the corners sit where it expects them: it turns corners in fixed positions (front-right, front-left…) and does not “know” which corner has yellow. Turning U first moves the whole pattern into that view. After this step the orientation is done, but the corner positions may still be wrong; that is the job of step 2.",
          )}
        </p>
      </Why>
      <div className="grid cols-2">
        {orient.map(({ a, state, scramble }) => (
          <OrientCard key={a.name} a={a} state={state} scramble={scramble} />
        ))}
      </div>

      <h2>{tr("Lượt 2: đổi chỗ góc", "Step 2: swap the corners")}</h2>
      <p>
        {tr(
          <>
            Khi cả bốn góc đã vàng lên trên, chỉ còn ba khả năng: đã đúng (chỉ xoay U), phải đổi hai góc kề nhau, hoặc đổi hai góc chéo nhau. Tìm{" "}
            <strong>đèn pha</strong>: hai sticker cạnh nhau, cùng màu, trên cùng một mặt.
          </>,
          <>
            When all four corners have yellow on top, only three cases remain: already correct (just turn U), swap two adjacent corners, or swap two diagonal corners. Look for{" "}
            <strong>headlights</strong>: two stickers side by side, the same colour, on the same face.
          </>,
        )}
      </p>
      <div className="perm-list">
        {PERMUTE_ALGS.map((p) => (
          <PermuteCard key={p.id} p={p} base={permuteStates[p.id]} />
        ))}
      </div>
      <Why title={tr("Vì sao dùng đèn pha để nhận ra loại đổi chỗ?", "Why use headlights to tell which swap you need?")}>
        <p>
          {tr(
            "Các góc đã vàng lên trên thì màu hai bên hông của chúng chỉ còn phụ thuộc vào góc nào đang đứng ở đâu. Hai góc kề nhau mà đứng đúng cặp màu thì sticker bên hông của chúng trùng màu, tạo thành đèn pha. Nếu đổi chỗ hai góc chéo nhau thì không còn cặp kề nhau nào trùng màu, nên không có đèn pha.",
            "Once the corners have yellow on top, the colours on their sides depend only on which corner sits where. Two adjacent corners that sit as the right colour pair have side stickers of the same colour, which makes headlights. If two diagonal corners are swapped, no adjacent pair matches in colour, so there are no headlights.",
          )}
        </p>
        <p>
          {tr(
            "Với đổi hai góc kề nhau, xoay U cho đèn pha nằm ở mặt trái (như hình) rồi mới làm thuật toán; làm xong có thể cần thêm một nước U để cả bốn góc khớp với hai khối.",
            "For swapping two adjacent corners, turn U so the headlights are on the left face (as in the picture) and then do the algorithm; afterwards you may need one more U move so all four corners match the two blocks.",
          )}
        </p>
      </Why>

      <h2>{tr("Ví dụ trọn vẹn một case", "A complete example of one case")}</h2>
      <p>
        {tr(
          "Case này (nhóm U) cần cả hai lượt. Bấm qua từng lượt để xem hình trước và sau lượt đó, rồi xem từng nước ở trình xem bên dưới.",
          "This case (group U) needs both steps. Click through the steps to see the picture before and after each one, then watch each move in the viewer below.",
        )}
      </p>
      <div className="bar">
        {plan.looks.map((l, i) => (
          <button key={i} className="chip" aria-pressed={exStep === i} onClick={() => setExStep(i)}>
            {l.title}
          </button>
        ))}
      </div>
      {plan.looks[exStep] && (
        <div className="figs">
          <Fig caption={tr("Trước lượt này", "Before this step")}>
            <CaseTop state={plan.states[exStep]} width={150} />
          </Fig>
          <div className="arrow-between" aria-hidden>
            →
          </div>
          <Fig caption={tr("Sau lượt này", "After this step")}>
            <CaseTop state={plan.states[exStep + 1]} width={150} />
          </Fig>
          <div style={{ minWidth: 220 }}>
            <AlgText alg={plan.looks[exStep].alg} pre={plan.looks[exStep].pre} post={plan.looks[exStep].post} />
            <p className="small muted">
              {tr(
                `Phần có gạch chấm là nước U căn chỉnh. Tổng cả hai lượt: ${plan.moves} nước, trong khi thuật toán đủ 42 case của riêng case này chỉ cần ${moveCount(example.algs[0].alg) + (example.algs[0].pre ? 1 : 0)} nước.`,
                `The dotted part is the U alignment move. Both steps together take ${plan.moves} moves, while the all-42-cases algorithm for this one case needs only ${moveCount(example.algs[0].alg) + (example.algs[0].pre ? 1 : 0)} moves.`,
              )}
            </p>
          </div>
        </div>
      )}
      {plan.looks[exStep] && plan.looks[exStep].alg && (
        <AlgStepper
          start={plan.states[exStep]}
          alg={plan.looks[exStep].alg}
          pre={plan.looks[exStep].pre}
          post={plan.looks[exStep].post}
          doneText={
            orientationOf(plan.states[exStep]).some((o) => o !== 0)
              ? tr("Xong: bốn góc đã quay vàng lên", "Done: all four corners have yellow on top")
              : tr("Xong: bốn góc đã đúng chỗ", "Done: all four corners are in place")
          }
        />
      )}
      <Callout kind="info" title={tr("Khi nào chuyển sang đủ 42 case?", "When to move on to all 42 cases?")}>
        <p style={{ margin: 0 }}>
          {tr(
            <>
              Khi các bước khác đã ổn và bạn thấy hai lượt CMLL làm chậm mình. Bắt đầu từ các case bạn hay gặp nhất, đánh dấu “Đã thuộc” trong{" "}
              <a href={href("/cmll/all")}>thư viện 42 case</a> để theo dõi tiến độ.
            </>,
            <>
              When your other steps are solid and the two CMLL steps slow you down. Start with the cases you meet most often, and tick “Learned” in the{" "}
              <a href={href("/cmll/all")}>library of 42 cases</a> to track your progress.
            </>,
          )}
        </p>
      </Callout>
    </>
  );
}

// ------------------------------------------------------------------ library

export function CmllLibrary() {
  const { learned } = useSettings();
  const lang = useLang();
  const [group, setGroup] = useState<GroupId | "all">("all");
  const [q, setQ] = useState("");
  const [onlyTodo, setOnlyTodo] = useState(false);
  const known = CMLL_CASES.filter((c) => learned.includes(c.id)).length;

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return CMLL_CASES.filter((c) => {
      if (group !== "all" && c.group !== group) return false;
      if (onlyTodo && learned.includes(c.id)) return false;
      if (!needle) return true;
      const hay = [GROUPS[c.group].label, c.group, c.sourceName, ...c.algs.map((a) => a.alg)].join(" ").toLowerCase();
      return needle.split(/\s+/).every((w) => hay.includes(w));
    });
  }, [group, q, onlyTodo, learned, lang]);

  return (
    <>
      <PageHead
        title={tr("Thư viện đủ 42 case CMLL", "Library of all 42 CMLL cases")}
        crumbs={
          <>
            <a href={href("/cmll")}>CMLL</a> › {tr("Đủ 42 case", "All 42 cases")}
          </>
        }
        lead={tr("Mỗi hình là một cách bốn góc có thể nằm. Bấm vào hình để xem thuật toán, từng bước và lý do.", "Each picture is one way the four corners can sit. Click a picture to see the algorithm, the step-by-step view and the reasons.")}
      />
      <CmllTabs active="all" />
      <Callout kind="tip" title={tr("Chưa biết mình đang gặp case nào?", "Not sure which case you have?")}>
        <p style={{ margin: 0 }}>
          {tr(
            <>
              Dùng <a href={href("/finder")}>công cụ tìm case</a>: chạm vào các sticker vàng trên hình, trang sẽ chỉ ra đúng case kèm nước U cần xoay trước.
            </>,
            <>
              Use the <a href={href("/finder")}>case finder</a>: tap the yellow stickers on the picture and the page shows the exact case, with the U move to turn first.
            </>,
          )}
        </p>
      </Callout>

      <div className="bar">
        <label className="sr-only" htmlFor="q">
          {tr("Tìm case", "Search cases")}
        </label>
        <input id="q" className="input" type="search" placeholder={tr("Tìm: sune, pi, left bar, r u' …", "Search: sune, pi, left bar, r u' …")} value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: "1 1 220px" }} />
        <label className="learned-box" style={{ marginLeft: 6 }}>
          <input type="checkbox" checked={onlyTodo} onChange={() => setOnlyTodo(!onlyTodo)} />
          {tr("Chỉ hiện chưa thuộc", "Only show not learned")}
        </label>
      </div>
      <div className="bar" role="group" aria-label={tr("Lọc theo nhóm", "Filter by group")}>
        <button className="chip" aria-pressed={group === "all"} onClick={() => setGroup("all")}>
          {tr("Tất cả", "All")} ({CMLL_CASES.length})
        </button>
        {GROUP_ORDER.map((g) => (
          <button key={g} className="chip" aria-pressed={group === g} onClick={() => setGroup(g)}>
            {GROUPS[g].label} ({CMLL_CASES.filter((c) => c.group === g).length})
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "6px 0 14px" }}>
        <div className="progress" style={{ flex: 1, maxWidth: 360 }} role="progressbar" aria-label={tr("Tiến độ đã thuộc", "Learned progress")} aria-valuenow={known} aria-valuemin={0} aria-valuemax={42}>
          <i style={{ width: `${(known / 42) * 100}%` }} />
        </div>
        <span>
          {tr("Đã thuộc", "Learned")} <strong>{known}/42</strong>
        </span>
      </div>

      {list.length === 0 && <p className="muted">{tr("Không có case nào khớp. Thử bỏ bớt từ khóa hoặc bộ lọc.", "No case matches. Try removing some keywords or filters.")}</p>}
      {GROUP_ORDER.map((g) => {
        const inGroup = list.filter((c) => c.group === g);
        if (!inGroup.length) return null;
        return (
          <section key={g} aria-labelledby={`g-${g}`}>
            <h2 id={`g-${g}`} style={{ marginBottom: 2 }}>
              {GROUPS[g].label}
            </h2>
            <p className="small muted" style={{ marginTop: 0, maxWidth: "70ch" }}>
              {GROUPS[g].blurb}
            </p>
            <div className="case-grid">
              {inGroup.map((c) => (
                <CaseCard key={c.id} c={c} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

export function CaseCard({ c }: { c: CmllCase }) {
  const { learned } = useSettings();
  const isDone = learned.includes(c.id);
  return (
    <a className="card case-card" href={href(`/cmll/${c.id}`)} aria-label={`${GROUPS[c.group].label} ${c.sourceName}${isDone ? tr(" (đã thuộc)", " (learned)") : ""}`}>
      {isDone && (
        <span className="done tag ok" aria-hidden>
          ✓
        </span>
      )}
      <CaseTop state={c.state} width={132} />
      <div className="nm">
        {GROUPS[c.group].label} · {c.sourceName}
      </div>
      <div className="sub" translate="no">
        {movesText(moveCount(c.algs[0].alg))} · {pct(c.id)}%
      </div>
    </a>
  );
}

// ------------------------------------------------------------------ detail

const recognizeWhy = (g: GroupId): string =>
  ({
    S: tr(
      "Sune biến ba góc thành một vòng xoay cùng chiều. Nhìn thấy đúng một góc vàng nằm trên, ba góc còn lại có vàng quay ra mặt bên theo một vòng, là biết đó là họ Sune.",
      "Sune turns three corners in one cycle, all the same way. If you see exactly one corner with yellow on top, and the other three have yellow turned to the side in a cycle, you know it is the Sune family.",
    ),
    As: tr(
      "Antisune là hình đối xứng của Sune: cũng một góc vàng trên mặt trên, nhưng vàng của ba góc còn lại quay theo chiều ngược lại.",
      "Antisune is the mirror image of Sune: also one corner with yellow on top, but the yellow of the other three corners turns the opposite way.",
    ),
    H: tr(
      "Hình H không có góc nào vàng trên mặt trên, và các sticker vàng nằm thành hai cặp ở mặt trước và mặt sau, nên rất dễ nhận ngay khi nhìn từ trên xuống.",
      "The H shape has no corner with yellow on top, and the yellow stickers form two pairs on the front and back faces, so it is very easy to spot from above.",
    ),
    Pi: tr(
      "Pi cũng không có góc vàng nào trên mặt trên, nhưng các sticker vàng không đối xứng như H: một mặt bên có cặp vàng, hai mặt còn lại mỗi mặt một sticker.",
      "Pi also has no corner with yellow on top, but the yellow stickers are not symmetric like H: one side face has a yellow pair, and each of the other two faces has one sticker.",
    ),
    U: tr(
      "Hai góc kề nhau đã vàng lên trên là đặc điểm chung của U và T. U phân biệt bằng cặp vàng nằm kề nhau trên cùng một mặt bên.",
      "Two adjacent corners with yellow on top is what U and T have in common. U is told apart by a yellow pair side by side on the same side face.",
    ),
    T: tr(
      "Hai góc kề nhau đã vàng lên trên, nhưng hai sticker vàng còn lại ở hai mặt đối nhau (trái và phải): đó là chữ T.",
      "Two adjacent corners have yellow on top, but the two remaining yellow stickers are on opposite faces (left and right): that is the T.",
    ),
    L: tr(
      "Hai góc vàng nằm chéo nhau trên mặt trên: dấu hiệu của L. Hai sticker vàng còn lại ở hai mặt bên vuông góc với nhau.",
      "Two diagonal corners with yellow on top is the sign of L. The two remaining yellow stickers are on two side faces at right angles to each other.",
    ),
    O: tr(
      "Cả bốn góc đã vàng lên trên, nên chỉ cần nhìn các cặp sticker bên hông: có đèn pha là đổi hai góc kề nhau, không có đèn pha là đổi hai góc chéo nhau.",
      "All four corners already have yellow on top, so just look at the pairs of side stickers: headlights mean swapping two adjacent corners, no headlights mean swapping two diagonal corners.",
    ),
  })[g];

function recognition(c: CmllCase): string[] {
  const out: string[] = [];
  const oriented = orientationOf(c.state).filter((o) => o === 0).length;
  out.push(tr(`${oriented} trong 4 góc đã có sticker vàng trên mặt trên.`, `${oriented} of the 4 corners already have a yellow sticker on the top face.`));
  const heads = headlightFaces(c.state);
  out.push(
    heads.length
      ? tr(
          `Đèn pha (hai sticker cạnh nhau cùng màu, không phải vàng) ở mặt ${heads.map((h) => h.label).join(" và ")}.`,
          `Headlights (two stickers side by side with the same colour, not yellow) on the ${heads.map((h) => h.label).join(" and ")} face.`,
        )
      : tr("Không có đèn pha.", "No headlights."),
  );
  const bars = sameColorFaces(c.state).filter((x) => x.color === 0);
  if (bars.length) out.push(tr(`Hai sticker vàng kề nhau trên mặt ${bars.map((b) => b.label).join(" và ")}.`, `Two yellow stickers side by side on the ${bars.map((b) => b.label).join(" and ")} face.`));
  return out;
}

function CaseScramble({ c }: { c: CmllCase }) {
  const [sc, setSc] = useState(() => tidy(invertAlg(fullAlg(c.algs[0]))));
  return <ScrambleLine scramble={sc} onReroll={() => setSc(caseScrambleOf(c))} />;
}

export function CmllDetail({ id }: { id: string }) {
  const c = CMLL_BY_ID.get(id);
  const [pick, setPick] = useState(0);
  useLang();
  if (!c)
    return (
      <>
        <PageHead title={tr("Không tìm thấy case này", "Case not found")} />
        <p>
          <a href={href("/cmll/all")}>{tr("← Về thư viện", "← Back to the library")}</a>
        </p>
      </>
    );
  const idx = CMLL_CASES.indexOf(c);
  const prev = CMLL_CASES[(idx + CMLL_CASES.length - 1) % CMLL_CASES.length];
  const next = CMLL_CASES[(idx + 1) % CMLL_CASES.length];
  const alg = c.algs[Math.min(pick, c.algs.length - 1)];
  const mirror = mirrorCase(c);
  const inverse = inverseCase(c);
  return (
    <>
      <PageHead
        title={`${GROUPS[c.group].label} · ${c.sourceName}`}
        crumbs={
          <>
            <a href={href("/cmll")}>CMLL</a> › <a href={href("/cmll/all")}>{tr("Đủ 42 case", "All 42 cases")}</a> › {GROUPS[c.group].label}
          </>
        }
        lead={GROUPS[c.group].blurb}
      />
      <div className="detail-top">
        <Fig caption={tr("Case này nhìn từ trên xuống (mặt trước ở phía dưới)", "This case seen from above (the front face is at the bottom)")}>
          <CaseTop state={c.state} width={250} title={tr(`Case ${GROUPS[c.group].label} ${c.sourceName}`, `${GROUPS[c.group].label} ${c.sourceName} case`)} />
        </Fig>
        <div>
          <p style={{ marginTop: 0 }}>
            <span className="tag">{tr(`Gặp khoảng ${pct(c.id)}% số lần`, `Appears about ${pct(c.id)}% of the time`)}</span>{" "}
            <span className="tag">{tr("Tên theo Ruwix:", "Name on Ruwix:")} {c.sourceName}</span>
          </p>
          <LearnedBox id={c.id} label={tr("Mình đã thuộc case này", "I have learned this case")} />
          <h2 style={{ marginTop: "0.8em" }}>{tr("Thuật toán", "Algorithm")}</h2>
          {c.algs.map((a, i) => (
            <div key={i} className="alg-row" style={{ alignItems: "center" }}>
              <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                <input type="radio" name="alg" checked={pick === i} onChange={() => setPick(i)} aria-label={tr(`Chọn thuật toán ${i + 1} để xem từng bước`, `Choose algorithm ${i + 1} to see it step by step`)} />
                <span className="small muted">{i === 0 ? tr("Chính", "Main") : tr("Khác", "Other")}</span>
              </label>
              <AlgText alg={a.alg} pre={a.pre} post={a.post} />
              <CopyButton text={fullAlg(a)} />
              <span className="tag" translate="no">
                {movesText(moveCount(a.alg))} · {a.sources.join(", ")}
              </span>
              {a.votes !== undefined && (
                <a className="tag" href={a.url} target="_blank" rel="noreferrer">
                  {tr(`${a.votes} phiếu`, `${a.votes} votes`)}
                </a>
              )}
              {a.finger && (
                <div className="small alg-finger">
                  <span className="muted">
                    {tr("Ngón tay theo John Mark:", "Fingers by John Mark:")} <code translate="no">{a.finger}</code>
                  </span>
                  <ul>
                    {fingerWords(a.finger).map((f, j) => (
                      <li key={j}>{f.words}</li>
                    ))}
                    <li className="muted">{tr("Các nước không ghi ngón: làm theo cách thường.", "Moves with no finger given: the usual way.")}</li>
                  </ul>
                </div>
              )}
            </div>
          ))}
          <p className="small muted">
            {tr(
              "Phần gạch chấm là nước U căn chỉnh (AUF): làm trước hoặc sau thuật toán để hình khớp. Chọn nút tròn bên trái để xem thuật toán nào ở phần từng bước.",
              "The dotted part is the U alignment move (AUF): do it before or after the algorithm so the picture matches. Pick the round button on the left to choose which algorithm the step-by-step view shows.",
            )}
          </p>
          <p className="small muted">
            {tr(
              <>
                Thứ tự theo số phiếu của người chơi trên <a href="https://speedcubedb.com/a/3x3/CMLL" target="_blank" rel="noreferrer">SpeedCubeDB</a>; bằng phiếu thì cách ít
                nước ngoài R, U, r, M (ít phải đổi tay cầm) đứng trước. Số phiếu nhỏ và lẫn người chơi một tay, nên chỉ để tham khảo. Ký hiệu ngón tay là của bảng
                CMLL hai tay của John Mark (<a href="https://docs.google.com/spreadsheets/d/1T94xPQU6-bIXUpT0GbdVNFLbpryEgXEmeJcI77SejEk" target="_blank" rel="noreferrer">bảng</a>,{" "}
                <a href="https://youtu.be/w2xNpUkRbZk" target="_blank" rel="noreferrer">video giải thích ký hiệu</a>), viết theo hệ ký hiệu DeeDubb (
                <a href="https://ruwix.com/the-rubiks-cube/notation/advanced/" target="_blank" rel="noreferrer">Ruwix</a>). Lời dịch theo hệ đó: chữ hoa là tay phải, chữ thường là
                tay trái; ở mặt trên, số 1 đến 4 là góc sau trái, sau phải, trước phải, trước trái. Ở các mặt khác chưa có nguồn viết về con số, nên lời dịch chỉ nói tay và ngón.
              </>,
              <>
                Ordered by player votes on <a href="https://speedcubedb.com/a/3x3/CMLL" target="_blank" rel="noreferrer">SpeedCubeDB</a>; on a tie, the one with fewer turns
                outside R, U, r, M (less regripping) comes first. The vote counts are small and include one-handed solvers, so take them as a hint. The finger code
                is from John Mark's two-handed CMLL sheet (<a href="https://docs.google.com/spreadsheets/d/1T94xPQU6-bIXUpT0GbdVNFLbpryEgXEmeJcI77SejEk" target="_blank" rel="noreferrer">sheet</a>,{" "}
                <a href="https://youtu.be/w2xNpUkRbZk" target="_blank" rel="noreferrer">video explaining the code</a>), written in the DeeDubb notation (
                <a href="https://ruwix.com/the-rubiks-cube/notation/advanced/" target="_blank" rel="noreferrer">Ruwix</a>). The words follow that notation: upper case is the right
                hand, lower case the left; on the top face the numbers 1 to 4 are the back left, back right, front right and front left corners. No written source gives the
                numbers on the other faces, so there the words only say the hand and finger.
              </>,
            )}
          </p>
        </div>
      </div>

      <h2>{tr("Luyện case này", "Practise this case")}</h2>
      <p className="small muted">
        {tr(
          "Cầm cube đã giải, làm đúng chuỗi dưới đây: bạn sẽ có hai khối đã xong và bốn góc đúng như hình. Rồi dùng thuật toán để giải lại.",
          "Take a solved cube and do exactly the moves below: you will have both blocks done and the four corners exactly as in the picture. Then use the algorithm to solve it again.",
        )}
      </p>
      <CaseScramble c={c} />

      <h2>{tr("Từng bước", "Step by step")}</h2>
      <AlgStepper start={c.state} alg={alg.alg} pre={alg.pre} post={alg.post} doneText={tr("Xong: bốn góc đã đúng", "Done: all four corners are right")} />

      <h2>{tr("Cách nhận ra case này", "How to recognise this case")}</h2>
      <ul>
        {recognition(c).map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <Why title={tr(`Vì sao nhìn thế này lại biết là họ ${GROUPS[c.group].label}?`, `Why does this look mean the ${GROUPS[c.group].label} family?`)}>
        <p>{recognizeWhy(c.group)}</p>
      </Why>
      <Why title={tr("Vì sao thuật toán này giữ nguyên hai khối?", "Why does this algorithm keep both blocks intact?")}>
        <p>
          {tr(
            <>
              Thuật toán chỉ dùng các nước mở một khối ra rồi đóng lại đúng nguyên trạng (ví dụ <code>R</code> và <code>R'</code> luôn đi thành cặp, hoặc{" "}
              <code>F</code> và <code>F'</code> bao quanh phần việc). Trong lúc làm, khối có thể bị mở tạm; trình xem từng bước ở trên báo rõ lúc nào khối
              bị mở và lúc nào được trả lại.
            </>,
            <>
              The algorithm only uses moves that open a block and then close it back exactly as it was (for example <code>R</code> and <code>R'</code> always come as a pair, or{" "}
              <code>F</code> and <code>F'</code> wrap around the work). While it runs, a block may be opened for a moment; the step-by-step viewer above shows exactly when a block
              is opened and when it is put back.
            </>,
          )}
        </p>
        <p>
          {tr(
            <>
              Các cạnh ở lát giữa và tầng trên được phép xáo trộn, vì bước LSE sau đó sẽ sắp lại chúng chỉ bằng <code>M</code> và <code>U</code>.
            </>,
            <>
              The edges in the middle slice and the top layer may be scrambled, because the LSE step afterwards puts them in order using only <code>M</code> and <code>U</code>.
            </>,
          )}
        </p>
      </Why>

      <h2>{tr("Các case liên quan", "Related cases")}</h2>
      <div className="case-grid" style={{ maxWidth: 420 }}>
        {mirror && mirror.id !== c.id && (
          <div>
            <p className="small muted" style={{ margin: "0 0 4px" }}>
              {tr("Case gương (đổi trái ↔ phải)", "Mirror case (swap left ↔ right)")}
            </p>
            <CaseCard c={mirror} />
          </div>
        )}
        {inverse && inverse.id !== c.id && inverse.id !== mirror?.id && (
          <div>
            <p className="small muted" style={{ margin: "0 0 4px" }}>
              {tr("Case nghịch đảo (làm ngược thuật toán)", "Inverse case (the algorithm done backwards)")}
            </p>
            <CaseCard c={inverse} />
          </div>
        )}
      </div>
      {mirror?.id === c.id && inverse?.id === c.id && <p className="muted small">{tr("Case này tự đối xứng: gương và nghịch đảo đều là chính nó.", "This case is symmetric: its mirror and its inverse are the case itself.")}</p>}

      <hr />
      <div className="bar" style={{ justifyContent: "space-between" }}>
        <a className="btn small" href={href(`/cmll/${prev.id}`)}>
          ← {GROUPS[prev.group].label} · {prev.sourceName}
        </a>
        <a className="btn small" href={href(`/cmll/${next.id}`)}>
          {GROUPS[next.group].label} · {next.sourceName} →
        </a>
      </div>
    </>
  );
}
