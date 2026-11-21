import { applyAlg, invertAlg, solvedState } from "../../shared/cube";
import { CubeIso } from "../components/cube-iso";
import { Fig } from "../components/ui";
import { CMLL_CASES } from "../data/cmll";
import { tr } from "../lib/i18n";
import { Icon } from "../components/icons";
import { href } from "../lib/router";
import { toggleStepDone, useSettings, type StepId } from "../lib/store";

interface CourseStep {
  id: StepId;
  to: string;
  title: string;
  text: string;
}

const steps = (): CourseStep[] => [
  { id: "first-block", to: "/learn/first-block", title: tr("Bước 1: Khối đầu", "Step 1: First block"), text: tr("Dựng khối 1×2×3 bên trái bằng mắt, không cần thuật toán.", "Build the 1×2×3 block on the left by eye, no algorithm needed.") },
  { id: "second-block", to: "/learn/second-block", title: tr("Bước 2: Khối thứ hai", "Step 2: Second block"), text: tr("Dựng khối 1×2×3 bên phải mà không phá khối trái.", "Build the 1×2×3 block on the right without breaking the left one.") },
  { id: "cmll-2-look", to: "/cmll/2-look", title: tr("Bước 3: CMLL 2-look", "Step 3: CMLL 2-look"), text: tr("Giải bốn góc tầng trên bằng hai lượt, chín thuật toán.", "Solve the four top corners in two looks with nine algorithms.") },
  { id: "lse", to: "/lse", title: tr("Bước 4: LSE", "Step 4: LSE"), text: tr("Giải sáu cạnh cuối chỉ bằng nước M và U.", "Solve the last six edges with only M and U moves.") },
];

export function HomePage() {
  const { learned, stepsDone } = useSettings();
  const known = CMLL_CASES.filter((c) => learned.includes(c.id)).length;
  const list = steps();
  const next = list.find((st) => !stepsDone.includes(st.id));
  const started = stepsDone.length > 0;
  const startLabel = (st: CourseStep) => `${started ? tr("Tiếp tục", "Continue") : tr("Bắt đầu", "Start")}: ${st.title}`;
  // the state after the second block: both blocks and the centres are right; the top corners and the M slice are not
  const demo = applyAlg(applyAlg(solvedState(), invertAlg("R U R' U R U2 R'")), "U M' U M");
  return (
    <>
      <section className="hero">
        <div>
          <h1>
            {tr(
              <>
                Học Rubik <span className="scribble">phương pháp Roux</span> bằng tiếng Việt
              </>,
              <>
                Learn Rubik’s Cube with the <span className="scribble">Roux method</span>
              </>,
            )}
          </h1>
          <p className="lead" style={{ fontSize: "1.2rem", color: "var(--ink-soft)", maxWidth: "52ch" }}>
            {tr(
              <>
                Từng bước, có hình vẽ tay, và lúc nào cũng nói rõ <strong>vì sao</strong> bạn làm như vậy. Từ khối đầu đến đủ 42 case CMLL và LSE, kèm công cụ tìm đúng case đang nằm trên cube của bạn.
              </>,
              <>
                Step by step, with hand-drawn pictures, and always clear about <strong>why</strong> you do each thing. From the first block to all 42 CMLL cases and LSE, with a tool that finds the exact case on your cube.
              </>,
            )}
          </p>
          <div className="bar" style={{ marginTop: 18 }}>
            <a className="btn accent" href={href(next ? next.to : "/cmll/all")}>
              {next ? startLabel(next) : tr("Học tiếp: đủ 42 case CMLL", "Keep learning: all 42 CMLL cases")}
            </a>
            <a className="btn" href={href("/finder")}>
              <Icon name="search" /> {tr("Tìm case của tôi", "Find my case")}
            </a>
            <a className="btn" href={href("/about")}>
              {tr("Roux là gì?", "What is Roux?")}
            </a>
          </div>
        </div>
        <Fig caption={tr("Sau hai khối: hai khối đã đúng, còn bốn góc trên (CMLL) và sáu cạnh (LSE)", "After two blocks: both blocks are done, the four top corners (CMLL) and six edges (LSE) are not")}>
          <CubeIso state={demo} width={300} title={tr("Khối Rubik minh họa", "Illustrated Rubik’s Cube")} />
        </Fig>
      </section>

      <h2>{tr("Lộ trình bốn bước", "The four-step course")}</h2>
      <p>
        {tr(
          <>
            Làm lần lượt từ trên xuống. Trước khi bắt đầu, đọc <a href={href("/glossary")}>Chuẩn bị: Ký hiệu</a> (khoảng hai phút) để hiểu các chữ như R, U, M. Xong mỗi bước, tick “Đã xong” để trang nhớ bạn đang ở đâu.
          </>,
          <>
            Go from top to bottom. Before you start, read <a href={href("/glossary")}>Preparation: Notation</a> (about two minutes) so letters such as R, U and M make sense. After each step, tick “Done” so the site remembers where you are.
          </>,
        )}
      </p>
      <div className="course-strip">
        {list.map((st) => {
          const done = stepsDone.includes(st.id);
          const current = next?.id === st.id;
          return (
            <div key={st.id} className={`card course-step ${current ? "current" : ""} ${done ? "done" : ""}`}>
              <h3>
                <a href={href(st.to)}>{st.title}</a>
              </h3>
              <p className="small">{st.text}</p>
              <div className="course-step-foot">
                <a className={`btn small ${current ? "accent" : ""}`} href={href(st.to)}>
                  {current ? (started ? tr("Tiếp tục", "Continue") : tr("Bắt đầu", "Start")) : done ? tr("Xem lại", "Review") : tr("Mở", "Open")}
                </a>
                <label className="check-label">
                  <input type="checkbox" checked={done} onChange={() => toggleStepDone(st.id)} /> {tr("Đã xong", "Done")}
                </label>
              </div>
            </div>
          );
        })}
      </div>
      <p className="small muted">
        {tr(
          <>
            Sau bốn bước là hai phần nâng cao: <a href={href("/cmll/all")}>Nâng cao A, đủ 42 case CMLL</a> và <a href={href("/learn/advanced")}>Nâng cao B, tối ưu</a>.
          </>,
          <>
            After the four steps come two advanced parts: <a href={href("/cmll/all")}>Advanced A, all 42 CMLL cases</a> and <a href={href("/learn/advanced")}>Advanced B, optimization</a>.
          </>,
        )}
      </p>

      <h2>{tr("Tiến độ của bạn", "Your progress")}</h2>
      <div className="card" style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ margin: 0 }}>
          {tr(
            <>
              Đã xong <strong>{stepsDone.length}/4</strong> bước. Đã thuộc <strong>{known}/42</strong> case CMLL. Dữ liệu này lưu ngay trong trình duyệt của bạn.
            </>,
            <>
              Finished <strong>{stepsDone.length}/4</strong> steps. Learned <strong>{known}/42</strong> CMLL cases. This data is saved right in your browser.
            </>,
          )}
        </p>
        <a className="btn" href={href(next ? next.to : known >= CMLL_CASES.length ? "/practice" : "/cmll/all")}>
          {next
            ? tr(`Học tiếp: ${next.title} →`, `Keep learning: ${next.title} →`)
            : known >= CMLL_CASES.length
              ? tr("Luyện tập →", "Practice →")
              : tr("Học tiếp: Nâng cao A, đủ 42 case CMLL →", "Keep learning: Advanced A, all 42 CMLL cases →")}
        </a>
      </div>

      <h2>{tr("Công cụ", "Tools")}</h2>
      <div className="grid cols-4 tools-row">
        <a className="card soft" href={href("/practice")}>
          <h3 style={{ marginTop: 0 }}><Icon name="dice" className="ico-card" /> {tr("Luyện tập", "Practice")}</h3>
          <p className="small" style={{ margin: 0 }}>{tr("Scramble ngẫu nhiên cho từng bước, có hình cube sau khi xáo.", "Random scrambles for each step, with a picture of the cube after the scramble.")}</p>
        </a>
        <a className="card soft" href={href("/solve")}>
          <h3 style={{ marginTop: 0 }}><Icon name="list" className="ico-card" /> {tr("Giải scramble này", "Solve a scramble")}</h3>
          <p className="small" style={{ margin: 0 }}>{tr("Dán một scramble, xem từng bước khối đầu, khối hai, CMLL và LSE.", "Paste a scramble and see each step: first block, second block, CMLL and LSE.")}</p>
        </a>
        <a className="card soft" href={href("/glossary")}>
          <h3 style={{ marginTop: 0 }}><Icon name="book" className="ico-card" /> {tr("Ký hiệu và thuật ngữ", "Notation and glossary")}</h3>
          <p className="small" style={{ margin: 0 }}>{tr("Cách đọc R U R', và các từ như AUF, EO, đèn pha, được giải thích bằng lời thường.", "How to read R U R', and words such as AUF, EO and headlights, explained in plain words.")}</p>
        </a>
        <a className="card soft" href={href("/about")}>
          <h3 style={{ marginTop: 0 }}><Icon name="scroll" className="ico-card" /> {tr("Roux là gì?", "What is Roux?")}</h3>
          <p className="small" style={{ margin: 0 }}>{tr("Ai tạo ra Roux, so với CFOP, điểm mạnh và điểm yếu.", "Who created Roux, how it compares with CFOP, strengths and weaknesses.")}</p>
        </a>
      </div>
    </>
  );
}
