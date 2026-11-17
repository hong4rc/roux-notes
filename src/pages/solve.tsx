import { useEffect, useMemo, useRef, useState } from "react";
import { MovePlayer } from "../components/move-player";
import { CaseTop } from "../components/case-views";
import { LseView } from "../components/lse-view";
import { AlgText, CopyButton, Fig, PageHead } from "../components/ui";
import { Icon } from "../components/icons";
import { colorName, tr, useLang } from "../lib/i18n";
import { currentScheme } from "../lib/palette";
import { href, useRoute } from "../lib/router";
import { wcaScramble } from "../lib/scramble";
import { solveRouxSteps, SolveError, type Level, type PartKind, type Solution, type Step, type StepId } from "../lib/solve";
import type { State } from "../../shared/cube";
import { guideFor } from "../data/finger-guides";


const STEP_INFO: Record<StepId, { title: () => string; what: () => string }> = {
  fb: {
    title: () => tr("Khối đầu", "First block"),
    what: () => tr("Dựng một khối nhỏ 1×2×3 ở bên trái, sát đáy.", "Build a small 1×2×3 block on the left, at the bottom."),
  },
  sb: {
    title: () => tr("Khối thứ hai", "Second block"),
    what: () =>
      tr(
        "Dựng khối giống vậy ở bên phải. Chỉ xoay R, r, M, U nên khối trái không bị đụng tới. Cuối bước này, tâm giữa cũng thẳng hàng.",
        "Build the same kind of block on the right. Only R, r, M and U turn, so the left block is never touched. At the end the middle centres are lined up too.",
      ),
  },
  cmll: {
    title: () => "CMLL",
    what: () => tr("Đưa bốn góc trên cùng về đúng chỗ, đúng hướng.", "Put the four top corners in the right place, facing the right way."),
  },
  lse: {
    title: () => tr("LSE: sáu cạnh cuối", "LSE: the last six edges"),
    what: () => tr("Chỉ còn sáu cạnh. Chỉ xoay M và U là xong cube.", "Only six edges are left. Turning just M and U finishes the cube."),
  },
};

/** what a part leaves behind, and why it is worth doing, in plain words */
function goalOf(kind: PartKind): { goal: string; why: string } {
  const sc = currentScheme();
  const [U, D, L, R] = [colorName(sc.U), colorName(sc.D), colorName(sc.L), colorName(sc.R)];
  switch (kind) {
    case "fb":
      return {
        goal: tr(`Bên trái, sát đáy, có một khối nhỏ 1×2×3 đúng màu: ba cạnh và hai góc của mặt ${L}.`, `On the left, at the bottom, a small 1×2×3 block with the right colours: three edges and two corners of the ${L} face.`),
        why: tr("Khối này là chỗ dựa. Từ giờ không đụng tới nó nữa.", "This block is the base. From now on it is not touched."),
      };
    case "sb":
      return {
        goal: tr(`Bên phải cũng có một khối như vậy (mặt ${R}), và tâm giữa thẳng hàng: tâm trên là ${U}.`, `The right side has the same kind of block (${R} face), and the middle centres are lined up: the top centre is ${U}.`),
        why: tr("Có hai khối rồi thì chỉ còn tầng trên và lát giữa. Các bước sau nhẹ hơn nhiều.", "With two blocks done, only the top layer and the middle slice are left. The rest is much lighter."),
      };
    case "orient":
      return {
        goal: tr(`Cả bốn góc trên cùng có màu ${U} nhìn lên trời. Góc nào ở chỗ nào thì chưa cần đúng.`, `All four top corners have ${U} looking up. Which corner sits where does not matter yet.`),
        why: tr("Chia làm hai lượt thì chỉ cần nhớ 7 + 2 công thức, thay vì 42.", "Two looks need only 7 + 2 algorithms instead of 42."),
      };
    case "permute":
      return {
        goal: tr("Bốn góc về đúng chỗ: mỗi góc khớp màu với hai mặt bên cạnh nó.", "The four corners go to their places: each corner matches the colours of the faces beside it."),
        why: tr(`Màu ${U} đã nhìn lên từ lượt 1. Lượt này chỉ đổi chỗ hai góc.`, `${U} already looks up after look 1. This look only swaps two corners.`),
      };
    case "one-look":
      return {
        goal: tr(`Một công thức làm xong cả hai việc: màu ${U} nhìn lên và mỗi góc đúng chỗ.`, `One algorithm does both jobs: ${U} looks up and every corner is in its place.`),
        why: tr("Nhanh hơn hai lượt, nhưng phải nhớ 42 công thức.", "Faster than two looks, but you have to remember 42 algorithms."),
      };
    case "auf":
      return {
        goal: tr("Bốn góc đã đúng, chỉ cần xoay mặt trên cho khớp màu với hai khối.", "The corners are right already; just turn the top so the colours match the blocks."),
        why: tr("Một nước U là đủ.", "One U turn is enough."),
      };
    case "eo":
      return {
        goal: tr(`Cả sáu cạnh có màu ${U} hoặc ${D} nhìn lên trên hoặc xuống dưới. Chỗ đứng chưa cần đúng.`, `All six edges have their ${U} or ${D} sticker looking up or down. Where they sit does not matter yet.`),
        why: tr("Khi mọi cạnh đã “ngửa”, các bước sau chỉ còn đổi chỗ, không phải lật nữa.", "Once every edge “faces up”, the next steps only move edges around; no more flipping."),
      };
    case "ulur":
      return {
        goal: tr(
          `Cạnh ${U}-${L} về chỗ trên-trái (UL), cạnh ${U}-${R} về chỗ trên-phải (UR). Bốn góc cũng khớp màu với hai khối.`,
          `The ${U}-${L} edge goes to the top left (UL) and the ${U}-${R} edge to the top right (UR). The corners match the blocks too.`,
        ),
        why: tr(
          "Đặt xong hai cạnh này thì bốn cạnh còn lại đều nằm trên một vòng dọc ở giữa (lát M), và chỉ cần M với U2 là xếp xong. Cách đọc công thức: U đưa cạnh tới phía trước hoặc phía sau; M2 chở cạnh ở giữa lên hoặc xuống, giữa trên và dưới.",
          "With these two edges placed, the other four all sit on one upright ring in the middle (the M slice), and M with U2 is all you need. Reading the moves: U brings an edge to the front or the back; M2 carries the middle edges up or down, between top and bottom.",
        ),
      };
    case "l4e":
      return {
        goal: tr("Bốn cạnh cuối (trên-trước, trên-sau, dưới-trước, dưới-sau) về đúng chỗ, tâm thẳng hàng. Cube xong!", "The last four edges (top front, top back, bottom front, bottom back) go home and the centres line up. The cube is solved!"),
        why: tr("Chỉ dùng M và U2: U2 đổi chỗ UL với UR, rồi lần U2 sau trả lại, nên hai cạnh vừa đặt không bị hỏng.", "Only M and U2: one U2 swaps UL and UR and the next U2 swaps them back, so the edges you just placed stay safe."),
      };
    case "l6e":
      return {
        goal: tr("Giải cả sáu cạnh một mạch, cube xong.", "Solve all six edges in one go; the cube is done."),
        why: tr("Máy tìm đường ngắn nhất cho cả ba việc cùng lúc. Người chơi giỏi học dần từng mẩu của cách này.", "The computer finds the shortest way to do all three jobs at once. Strong players learn pieces of it over time."),
      };
  }
}

const levelLabel = (step: "cmll" | "lse", l: Level) =>
  step === "cmll"
    ? l === "basic"
      ? tr("Cơ bản: 2 lần nhìn (ít công thức)", "Basic: 2 looks (few algorithms)")
      : tr("Nâng cao: 1 lần (42 công thức)", "Advanced: 1 look (42 algorithms)")
    : l === "basic"
      ? tr("Cơ bản: 3 bước nhỏ", "Basic: 3 small steps")
      : tr("Nâng cao: đường ngắn nhất", "Advanced: the shortest way");

const count = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export function SolvePage() {
  useLang();
  const { query } = useRoute();
  const fromUrl = query.get("s") ?? "";
  const [text, setText] = useState(fromUrl);
  // the levels live in the address too, so a shared link opens with the same choices
  const [cmll, setCmll] = useState<Level>(query.get("cmll") === "advanced" ? "advanced" : "basic");
  const [lse, setLse] = useState<Level>(query.get("lse") === "advanced" ? "advanced" : "basic");
  const [result, setResult] = useState<{ scramble: string; steps: Step[]; sol?: Solution; error?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const runId = useRef(0);
  const lastRun = useRef("");

  // one step at a time, with a pause between them so each step shows as soon as it is found
  // (the first solve also builds the search tables: about two seconds in all)
  const run = (scramble: string) => {
    const clean = scramble.replace(/\s+/g, " ").trim();
    if (!clean) return;
    const id = ++runId.current;
    lastRun.current = clean;
    setBusy(true);
    setResult({ scramble: clean, steps: [] });
    let it: ReturnType<typeof solveRouxSteps> | null = null;
    const tick = () => {
      if (id !== runId.current) return; // a newer solve has started
      try {
        it ??= solveRouxSteps(clean, { cmll, lse });
        const r = it.next();
        if (r.done) {
          setResult((old) => (old ? { ...old, sol: r.value } : old));
          setBusy(false);
          return;
        }
        setResult((old) => (old ? { ...old, steps: [...old.steps, r.value] } : old));
        window.setTimeout(tick, 30);
      } catch (e) {
        setResult((old) => ({ scramble: clean, steps: old?.steps ?? [], error: e instanceof SolveError ? e.message : String(e) }));
        setBusy(false);
      }
    };
    window.setTimeout(tick, 30);
    const extra = `${cmll === "advanced" ? "&cmll=advanced" : ""}${lse === "advanced" ? "&lse=advanced" : ""}`;
    const want = `#/solve?s=${encodeURIComponent(clean)}${extra}`;
    if (location.hash !== want) history.replaceState(null, "", want);
  };

  // a link with ?s= solves right away. The page writes its own scramble into the address too; that must not start a second solve
  // (it once raced and brought back the old scramble), so only a scramble different from the last one solved counts.
  useEffect(() => {
    if (fromUrl && fromUrl !== lastRun.current) {
      setText(fromUrl);
      run(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromUrl]);
  // changing a level solves the same scramble again
  useEffect(() => {
    if (lastRun.current) run(lastRun.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmll, lse]);

  const sc = currentScheme();
  const sol = result?.sol;
  const steps = result?.steps ?? [];
  const ORDER: StepId[] = ["fb", "sb", "cmll", "lse"];
  const next = !sol && !result?.error && result ? ORDER[steps.length] : undefined;
  return (
    <>
      <PageHead
        title={tr("Giải scramble này", "Solve this scramble")}
        lead={tr(
          "Dán một scramble vào ô dưới. Máy sẽ chỉ bạn giải nó theo Roux, từng bước một, và nói rõ mỗi bước dùng công thức nào.",
          "Paste a scramble in the box below. The computer shows you how to solve it with Roux, one step at a time, and says which algorithm each step uses.",
        )}
      />
      <div className="card">
        <label htmlFor="scramble-in" className="small">
          {tr("Scramble (làm trên cube đã giải)", "Scramble (done on a solved cube)")}
        </label>
        <textarea
          id="scramble-in"
          className="input"
          rows={2}
          value={text}
          translate="no"
          spellCheck={false}
          placeholder={tr("Ví dụ: R U R' U' R …", "Example: R U R' U' R …")}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              run(text);
            }
          }}
          style={{ width: "100%", fontFamily: "var(--mono, monospace)", resize: "vertical" }}
        />
        <div className="bar">
          <button className="btn primary" onClick={() => run(text)} disabled={busy || !text.trim()}>
            {busy ? tr("Đang tính…", "Working…") : tr("Giải", "Solve")}
          </button>
          <button
            className="btn"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const s = await wcaScramble().finally(() => setBusy(false));
              setText(s);
              run(s);
            }}
          >
            <Icon name="reroll" /> {tr("Scramble ngẫu nhiên", "Random scramble")}
          </button>
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>
          {tr(
            `Cầm cube: mặt ${colorName(sc.U)} ở trên, mặt ${colorName(sc.F)} ở trước, suốt từ đầu đến cuối (không xoay cả khối).`,
            `Hold the cube with ${colorName(sc.U)} on top and ${colorName(sc.F)} in front, from start to finish (no whole-cube turns).`,
          )}
        </p>
      </div>

      {result?.error && (
        <div className="callout warn" role="alert">
          <div className="ttl">{tr("Chưa giải được", "Could not solve")}</div>
          <p>{result.error}</p>
        </div>
      )}

      {result && (steps.length > 0 || next) && (
        <>
          <div className="callout tip">
            <div className="ttl">{tr("Cách đọc hình", "How to read the pictures")}</div>
            <p style={{ margin: 0 }}>
              {tr(
                `Chữ trên hình cho biết mặt nào là mặt nào: U là mặt trên (lúc đầu màu ${colorName(sc.U)}), F là mặt trước, đối diện bạn (màu ${colorName(sc.F)}), R là mặt phải (màu ${colorName(sc.R)}). Mỗi bước có nút ▶ để xem từng nước một, kèm một câu nói nước đó xoay thế nào.`,
                `The letters on the pictures say which face is which: U is the top (${colorName(sc.U)} at the start), F is the front, facing you (${colorName(sc.F)}), R is the right (${colorName(sc.R)}). Each step has a ▶ button to watch one move at a time, with a sentence saying how that move turns.`,
              )}{" "}
              <a href={href("/glossary?at=luot-tay")}>{tr("Bảng lướt tay: ngón nào làm nước nào →", "Finger-trick table: which finger does which move →")}</a>
            </p>
          </div>
          <h2>{tr("Tóm tắt", "Summary")}</h2>
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{tr("Bước", "Step")}</th>
                  <th>{tr("Công thức", "Algorithm")}</th>
                  <th>{tr("Số nước", "Moves")}</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((st, i) => (
                  <tr key={st.id}>
                    <td>
                      <a href={`#step-${st.id}`} onClick={(e) => (e.preventDefault(), document.getElementById(`step-${st.id}`)?.scrollIntoView({ behavior: "smooth" }))}>
                        {i + 1}. {STEP_INFO[st.id].title()}
                      </a>
                    </td>
                    <td>
                      {st.parts.length === 0 || st.parts.every((p) => !count(p.pre + p.alg + p.post)) ? (
                        <span className="muted small">{tr("đã xong sẵn", "already done")}</span>
                      ) : (
                        st.parts.map((p, k) => (count(p.pre + " " + p.alg + " " + p.post) ? <AlgText key={k} alg={p.alg} pre={p.pre} post={p.post} /> : null))
                      )}
                    </td>
                    <td>{st.moves}</td>
                  </tr>
                ))}
                {next && (
                  <tr>
                    <td>
                      {steps.length + 1}. {STEP_INFO[next].title()}
                    </td>
                    <td className="muted small" aria-live="polite">
                      {tr("đang tính…", "working…")}
                    </td>
                    <td />
                  </tr>
                )}
                {sol && (
                  <tr>
                    <th>{tr("Tổng", "Total")}</th>
                    <td className="small muted">{tr("tính cả các nước U xoay cho khớp", "U turns for lining up included")}</td>
                    <th>{sol.moves}</th>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {sol && (
            <div className="alg-row" style={{ alignItems: "center" }}>
              <span className="small muted">{tr("Cả lời giải:", "The whole solution:")}</span>
              <span className="alg" translate="no">
                {sol.text}
              </span>
              <CopyButton text={sol.text} />
            </div>
          )}
          <p className="small muted">
            {tr(
              "Nước U in nhạt là nước xoay mặt trên cho khớp hình (AUF). Nó vẫn là một nước, nên vẫn được đếm.",
              "A faded U is a turn of the top layer to line things up (AUF). It is still a move, so it is still counted.",
            )}
          </p>

          {steps.map((st, i) => (
            <StepCard
              key={st.id}
              step={st}
              n={i + 1}
              level={st.id === "cmll" ? { value: cmll, set: setCmll } : st.id === "lse" ? { value: lse, set: setLse } : undefined}
            />
          ))}
          {next && (
            <section className="card soft" style={{ marginTop: 18 }} aria-live="polite">
              <h3 style={{ margin: 0 }}>
                {steps.length + 1}. {STEP_INFO[next].title()} <span className="muted small">{tr("· máy đang tính…", "· the computer is working…")}</span>
              </h3>
            </section>
          )}

          <div className="callout info">
            <div className="ttl">{tr("Máy giải khác người giải thế nào?", "How is the computer different from a person?")}</div>
            <ul className="small" style={{ margin: 0 }}>
              <li>
                {tr(
                  "Hai khối: máy thử mọi cách và chọn cách ngắn nhất. Người chơi thật thường làm dài hơn vài nước, vì phải nhìn và nghĩ.",
                  "The two blocks: the computer tries every way and picks the shortest. Real players usually take a few more moves, because they have to look and think.",
                )}
              </li>
              <li>
                {tr(
                  "CMLL và LSE: máy dùng đúng công thức có trên trang học, để bạn tra lại được.",
                  "CMLL and LSE: the computer uses the same algorithms the learning pages show, so you can look them up.",
                )}
              </li>
            </ul>
          </div>
        </>
      )}
    </>
  );
}

function LevelSwitch({ step, value, set }: { step: "cmll" | "lse"; value: Level; set: (l: Level) => void }) {
  return (
    <div className="bar" role="group" aria-label={step === "cmll" ? tr("Cách giải CMLL", "How to solve CMLL") : tr("Cách giải LSE", "How to solve LSE")}>
      <span className="small">{tr("Cách giải:", "Way to solve:")}</span>
      {(["basic", "advanced"] as const).map((l) => (
        <button key={l} className="chip" aria-pressed={value === l} onClick={() => set(l)}>
          {levelLabel(step, l)}
        </button>
      ))}
    </div>
  );
}

/** what one part looks like before and after it is done */
function PartPictures({ step, before, after }: { step: StepId; before: State; after: State }) {
  if (step === "cmll")
    return (
      <div className="part-pics">
        <Fig caption={tr("Trước", "Before")}>
          <CaseTop state={before} width={96} title={tr("Bốn góc trước lượt này", "The four corners before this look")} />
        </Fig>
        <span aria-hidden="true">→</span>
        <Fig caption={tr("Sau", "After")}>
          <CaseTop state={after} width={96} title={tr("Bốn góc sau lượt này", "The four corners after this look")} />
        </Fig>
      </div>
    );
  if (step === "lse")
    return (
      <div className="part-pics">
        <Fig caption={tr("Sau phần này (trên / dưới)", "After this part (top / bottom)")}>
          <LseView state={after} mode="all" width={92} />
        </Fig>
      </div>
    );
  return null;
}

function StepCard({ step, n, level }: { step: Step; n: number; level?: { value: Level; set: (l: Level) => void } }) {
  const info = STEP_INFO[step.id];
  const lang = useLang();
  const moves = useMemo(() => step.parts.flatMap((p) => `${p.pre} ${p.alg} ${p.post}`.split(" ").filter(Boolean)), [step]);
  const fingers = useMemo(
    () =>
      step.parts.flatMap((p) => {
        const n = (x: string) => x.split(" ").filter(Boolean).length;
        const g = guideFor(p.alg);
        const at = (i: number) => (g?.steps[i] ? { by: g.by, text: g.steps[i]! } : null);
        return [...Array(n(p.pre)).fill(null), ...Array.from({ length: n(p.alg) }, (_, i) => at(i)), ...Array(n(p.post)).fill(null)];
      }),
    // words follow the language
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, lang],
  );
  const aligning = useMemo(
    () => step.parts.flatMap((p) => [...p.pre.split(" ").filter(Boolean).map(() => true), ...p.alg.split(" ").filter(Boolean).map(() => false), ...p.post.split(" ").filter(Boolean).map(() => true)]),
    [step],
  );
  let before = step.before;
  return (
    <section id={`step-${step.id}`} className="card" style={{ marginTop: 18 }}>
      <h3 style={{ marginTop: 0 }}>
        {n}. {info.title()} <span className="tag">{tr(`${step.moves} nước`, `${step.moves} moves`)}</span>
      </h3>
      <p>{info.what()}</p>
      {level && (step.id === "cmll" || step.id === "lse") && <LevelSwitch step={step.id} value={level.value} set={level.set} />}
      <div className="step-body">
        <MovePlayer start={step.before} moves={moves} aligning={aligning} fingers={fingers} width={210} turn={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {step.parts.length === 0 && <p className="muted">{tr("Bước này đã xong sẵn, không cần làm gì.", "This step is already done, nothing to do.")}</p>}
          <ol className="part-list">
            {step.parts.map((p, k) => {
              const m = count(`${p.pre} ${p.alg} ${p.post}`);
              const from = before;
              before = p.after ?? before;
              return (
                <li key={k}>
                  <div>
                    <b>{p.label}</b> <span className="muted small">· {tr(`${m} nước`, `${m} moves`)}</span>
                  </div>
                  <p className="part-goal">
                    <b>{tr("Mục tiêu:", "Goal:")}</b> {goalOf(p.kind).goal}
                  </p>
                  <p className="small muted part-why">
                    <b>{tr("Vì sao:", "Why:")}</b> {goalOf(p.kind).why}
                  </p>
                  {m === 0 && <span className="muted small">{tr("Đã đúng sẵn, bỏ qua phần này.", "Already right, skip this part.")}</span>}
                  {p.pre && (
                    <div className="part-line">
                      <span className="part-tag">{tr("Xoay trước", "Turn first")}</span> <AlgText alg="" pre={p.pre} />{" "}
                      <span className="small muted">
                        {tr(
                          "xoay mặt trên cho các góc trông giống hình mẫu của công thức. Công thức chỉ đúng khi cầm đúng góc nhìn đó.",
                          "turn the top so the corners look like the algorithm's picture. The algorithm only works from that view.",
                        )}
                      </span>
                    </div>
                  )}
                  {p.alg && (
                    <div className="part-line">
                      {(p.pre || p.post) && <span className="part-tag">{tr("Công thức", "Algorithm")}</span>} <AlgText alg={p.alg} />
                    </div>
                  )}
                  {p.post && (
                    <div className="part-line">
                      <span className="part-tag">{tr("Xoay sau", "Turn after")}</span> <AlgText alg="" post={p.post} />{" "}
                      <span className="small muted">{tr("xoay mặt trên cho bốn góc khớp màu với hai khối.", "turn the top so the corners match the blocks.")}</span>
                    </div>
                  )}
                  {p.after && m > 0 && <PartPictures step={step.id} before={from} after={p.after} />}
                  <a className="small" href={href(p.link)}>
                    {p.link.startsWith("/cmll")
                      ? tr("Xem case này trên trang học →", "See this case on the learning page →")
                      : p.link.startsWith("/lse")
                        ? tr("Học phần này trên trang LSE →", "Learn this part on the LSE page →")
                        : tr("Học bước này →", "Learn this step →")}
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
