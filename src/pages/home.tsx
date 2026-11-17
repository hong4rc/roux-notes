import { applyAlg, invertAlg, solvedState } from "../../shared/cube";
import { CubeIso } from "../components/cube-iso";
import { Fig } from "../components/ui";
import { CMLL_CASES } from "../data/cmll";
import { tr } from "../lib/i18n";
import { Icon } from "../components/icons";
import { href } from "../lib/router";
import { useSettings } from "../lib/store";

export function HomePage() {
  const { learned } = useSettings();
  const known = CMLL_CASES.filter((c) => learned.includes(c.id)).length;
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
            <a className="btn accent" href={href("/learn")}>
              {tr("Học từ đầu", "Start learning")}
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

      <h2>{tr("Có gì ở đây", "What is here")}</h2>
      <div className="grid cols-3">
        <a className="card" href={href("/learn")}>
          <h3 style={{ marginTop: 0 }}><Icon name="blocks" className="ico-card" /> {tr("Học từng bước", "Learn step by step")}</h3>
          <p style={{ margin: 0 }}>{tr("Khối đầu, khối thứ hai, CMLL, LSE: hình minh họa, lý do và lỗi hay gặp.", "First block, second block, CMLL, LSE: pictures, reasons and common mistakes.")}</p>
        </a>
        <a className="card" href={href("/cmll")}>
          <h3 style={{ marginTop: 0 }}><Icon name="puzzle" className="ico-card" /> {tr("CMLL: 2-look và đủ 42 case", "CMLL: 2-look and all 42 cases")}</h3>
          <p style={{ margin: 0 }}>{tr("So sánh hai cách, mỗi case có hai thuật toán, từng bước và lý do.", "Compare the two ways; every case has two algorithms, the steps and the reasons.")}</p>
        </a>
        <a className="card" href={href("/lse")}>
          <h3 style={{ marginTop: 0 }}><Icon name="dial" className="ico-card" /> {tr("LSE: sáu cạnh cuối", "LSE: the last six edges")}</h3>
          <p style={{ margin: 0 }}>{tr("EO, UL/UR và 4c: tra thuật toán ngắn nhất theo đúng cấu hình của bạn.", "EO, UL/UR and 4c: look up the shortest algorithm for your exact configuration.")}</p>
        </a>
        <a className="card" href={href("/finder")}>
          <h3 style={{ marginTop: 0 }}><Icon name="search" className="ico-card" /> {tr("Tìm case", "Find your case")}</h3>
          <p style={{ margin: 0 }}>{tr("Chạm vào sticker trên hình, chọn đèn pha, thấy ngay thuật toán.", "Tap the stickers on the picture, choose the headlights, and see the algorithm at once.")}</p>
        </a>
        <a className="card" href={href("/about")}>
          <h3 style={{ marginTop: 0 }}><Icon name="scroll" className="ico-card" /> {tr("Ai tạo ra Roux?", "Who created Roux?")}</h3>
          <p style={{ margin: 0 }}>{tr("Lịch sử, so với CFOP, điểm mạnh và điểm yếu, ai đang dùng.", "History, comparison with CFOP, strengths and weaknesses, and who uses it.")}</p>
        </a>
        <a className="card" href={href("/practice")}>
          <h3 style={{ marginTop: 0 }}><Icon name="dice" className="ico-card" /> {tr("Luyện tập", "Practice")}</h3>
          <p style={{ margin: 0 }}>{tr("Scramble ngẫu nhiên cho từng bước, có hình cube sau khi xáo.", "Random scrambles for each step, with a picture of the cube after the scramble.")}</p>
        </a>
        <a className="card" href={href("/solve")}>
          <h3 style={{ marginTop: 0 }}><Icon name="list" className="ico-card" /> {tr("Giải scramble này", "Solve a scramble")}</h3>
          <p style={{ margin: 0 }}>{tr("Dán một scramble, xem từng bước khối đầu, khối hai, CMLL và LSE.", "Paste a scramble and see each step: first block, second block, CMLL and LSE.")}</p>
        </a>
        <a className="card" href={href("/glossary")}>
          <h3 style={{ marginTop: 0 }}><Icon name="book" className="ico-card" /> {tr("Ký hiệu và thuật ngữ", "Notation and glossary")}</h3>
          <p style={{ margin: 0 }}>{tr("Cách đọc R U R', và các từ như AUF, EO, đèn pha.", "How to read R U R', and words such as AUF, EO and headlights.")}</p>
        </a>
      </div>

      <h2>{tr("Tiến độ của bạn", "Your progress")}</h2>
      <div className="card" style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ margin: 0 }}>
          {tr(
            <>
              Đã thuộc <strong>{known}/42</strong> case CMLL. Dữ liệu này lưu ngay trong trình duyệt của bạn.
            </>,
            <>
              Learned <strong>{known}/42</strong> CMLL cases. This data is saved right in your browser.
            </>,
          )}
        </p>
        <a className="btn" href={href(known >= CMLL_CASES.length ? "/practice" : "/cmll/all")}>
          {known >= CMLL_CASES.length ? tr("Luyện tập →", "Practice →") : tr("Học tiếp: thư viện 42 case →", "Keep learning: the 42-case library →")}
        </a>
      </div>
    </>
  );
}
