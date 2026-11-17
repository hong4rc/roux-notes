import { TRICKS } from "../data/fingertricks";
import { applyAlg, solvedState } from "../../shared/cube";
import { CubeIso } from "../components/cube-iso";
import { AlgText, Callout, PageHead } from "../components/ui";
import { tr } from "../lib/i18n";
import { href } from "../lib/router";

const S = solvedState();
const moves = (): { m: string; text: string }[] => [
  { m: "R", text: tr("Quay mặt phải theo chiều kim đồng hồ khi nhìn thẳng vào mặt đó.", "Turn the right face clockwise as you look straight at that face.") },
  { m: "U", text: tr("Quay mặt trên theo chiều kim đồng hồ.", "Turn the top face clockwise.") },
  { m: "F", text: tr("Quay mặt trước theo chiều kim đồng hồ.", "Turn the front face clockwise.") },
  { m: "L", text: tr("Quay mặt trái theo chiều kim đồng hồ (nhìn từ bên trái).", "Turn the left face clockwise (seen from the left).") },
  { m: "M", text: tr("Quay lát giữa (giữa mặt trái và mặt phải) cùng chiều với L.", "Turn the middle slice (between the left and right faces) in the same direction as L.") },
  { m: "r", text: tr("Quay mặt phải cùng lát giữa, cùng chiều R. Bằng R rồi M'.", "Turn the right face together with the middle slice, in the direction of R. Equal to R then M'.") },
];

const terms = (): [string, string][] => [
  [tr("Khối 1×2×3 (block)", "1×2×3 block"), tr("Cụm năm mảnh cạnh–góc cùng tâm xếp thành một khối chữ nhật rộng 1, cao 2, dài 3. Roux dựng hai khối như vậy ở hai bên trái và phải.", "A group of five edge and corner pieces plus a centre, forming a box 1 wide, 2 high and 3 long. Roux builds two such blocks, one on the left and one on the right.")],
  [tr("FB (khối đầu, First Block)", "FB (first block)"), tr("Khối 1×2×3 bên trái: cạnh DL, FL, BL, hai góc DFL, DBL và tâm trái.", "The 1×2×3 block on the left: the edges DL, FL and BL, the two corners DFL and DBL, and the left centre.")],
  [tr("SB (khối thứ hai, Second Block)", "SB (second block)"), tr("Khối 1×2×3 bên phải, dựng sau khi khối trái đã xong mà không phá nó.", "The 1×2×3 block on the right, built after the left block is done, without breaking it.")],
  ["CMLL", tr("Đưa bốn góc tầng trên về đúng chỗ, đúng hướng, mặc kệ cạnh. 42 trường hợp (không tính đã giải).", "Put the four top-layer corners in the right place with the right orientation, ignoring the edges. 42 cases (not counting solved).")],
  ["2-look CMLL", tr("Giải bốn góc bằng hai lượt: xoay hướng rồi đổi chỗ, tổng cộng chín thuật toán.", "Solve the four corners in two looks: orient them, then permute them, nine algorithms in total.")],
  ["LSE", tr("Last Six Edges: giải sáu cạnh cuối và các tâm lát giữa chỉ bằng M và U.", "Last Six Edges: solve the last six edges and the middle-slice centres using only M and U.")],
  ["EO (4a)", tr("Edge Orientation: lật các cạnh để cả sáu cạnh đều đúng hướng.", "Edge Orientation: flip the edges so that all six edges are oriented correctly.")],
  ["UL/UR (4b)", tr("Đưa hai cạnh có màu trái và phải về đúng vị trí UL và UR.", "Bring the two edges with the left and right colours to the UL and UR positions.")],
  ["4c (L4E)", tr("Xếp nốt bốn cạnh còn lại (UF, UB, DF, DB) bằng M và U2.", "Finish the last four edges (UF, UB, DF, DB) with M and U2.")],
  ["EOLR", tr("Gộp bước EO và UL/UR thành một thuật toán.", "Merge the EO and UL/UR steps into one algorithm.")],
  ["L6E", tr("Giải cả sáu cạnh cuối trong một mạch.", "Solve all six last edges in one go.")],
  ["AUF", tr("Adjust U Face: nước U xoay tầng trên để căn chỉnh trước hoặc sau một thuật toán.", "Adjust U Face: a U move that turns the top layer to line it up before or after an algorithm.")],
  [tr("Cạnh xấu (bad edge)", "Bad edge"), tr("Cạnh có sticker màu mặt trên/dưới nằm ở mặt bên thay vì mặt trên/dưới (khi tâm thẳng hàng).", "An edge whose top/bottom-colour sticker sits on a side face instead of the top/bottom face (when the centres are aligned).")],
  [tr("Đèn pha (headlights)", "Headlights"), tr("Hai sticker cạnh nhau, cùng màu, trên cùng một mặt bên của tầng trên.", "Two neighbouring stickers of the same colour on the same side face of the top layer.")],
  [tr("Lát giữa (M slice)", "Middle slice (M slice)"), tr("Hàng giữa giữa mặt trái và mặt phải, gồm bốn tâm lát giữa và bốn cạnh UF, UB, DF, DB.", "The middle layer between the left and right faces, holding four middle-slice centres and the four edges UF, UB, DF, DB.")],
  [tr("Nhìn trước (lookahead)", "Lookahead"), tr("Kỹ năng nhận ra bước kế tiếp trong khi tay còn đang làm bước hiện tại, để không bị khựng.", "The skill of spotting the next step while your hands are still doing the current one, so you do not pause.")],
  ["TPS", tr("Turns Per Second: số nước mỗi giây.", "Turns Per Second: the number of moves per second.")],
];

export function GlossaryPage() {
  return (
    <>
      <PageHead
        title={tr("Ký hiệu và thuật ngữ", "Notation and glossary")}
        crumbs={<a href={href("/")}>{tr("Trang chủ", "Home")}</a>}
        lead={tr("Cách đọc thuật toán, và các từ bạn sẽ gặp khi học Roux.", "How to read algorithms, and the words you will meet while learning Roux.")}
      />
      <h2>{tr("Cách đọc ký hiệu", "How to read the notation")}</h2>
      <ul>
        <li>
          {tr(
            <>
              Chữ cái chỉ <strong>mặt</strong> hoặc <strong>lát</strong>: R (phải), L (trái), U (trên), D (dưới), F (trước), B (sau), M (lát giữa).
            </>,
            <>
              A letter names a <strong>face</strong> or a <strong>slice</strong>: R (right), L (left), U (up), D (down), F (front), B (back), M (middle slice).
            </>,
          )}
        </li>
        <li>
          {tr(
            <>
              Một nước <strong>không có dấu</strong> là quay 90° theo chiều kim đồng hồ khi nhìn thẳng vào mặt đó. Thêm <code>'</code> (phẩy) là quay ngược lại. Thêm <code>2</code>{" "}
              là quay 180°.
            </>,
            <>
              A move <strong>with no mark</strong> is a 90° clockwise turn as you look straight at that face. Adding <code>'</code> (a prime) turns it the other way. Adding <code>2</code>{" "}
              turns it 180°.
            </>,
          )}
        </li>
        <li>
          {tr(
            <>
              Chữ thường như <code>r</code> nghĩa là quay hai lớp cùng lúc: mặt đó và lát giữa kề nó.
            </>,
            <>
              A lowercase letter such as <code>r</code> means turning two layers at once: that face and the middle slice next to it.
            </>,
          )}
        </li>
        <li>
          {tr(
            <>
              Phần có <strong>gạch chấm</strong> trong thuật toán trên trang này là nước U căn chỉnh (AUF).
            </>,
            <>
              The part with a <strong>dotted underline</strong> in the algorithms on this site is the aligning U move (AUF).
            </>,
          )}
        </li>
      </ul>
      <Callout kind="tip" title={tr("Mẹo nhớ chiều quay của M", "Tip for remembering the direction of M")}>
        <p style={{ margin: 0 }}>
          {tr(
            <>
              M quay cùng chiều với <strong>L</strong>, tức là ngược chiều với R. Khi bạn làm R rồi M' thì được r, vì cả mặt phải và lát giữa cùng quay theo chiều R.
            </>,
            <>
              M turns in the same direction as <strong>L</strong>, which is the opposite direction to R. When you do R then M' you get r, because the right face and the middle slice both turn in the direction of R.
            </>,
          )}
        </p>
      </Callout>
      <div className="grid cols-3" style={{ marginTop: 14 }}>
        {moves().map(({ m, text }) => (
          <div className="card" key={m} style={{ textAlign: "center" }}>
            <CubeIso state={applyAlg(S, m)} width={150} title={tr(`Khối sau nước ${m} từ trạng thái đã giải`, `The cube after the move ${m} from the solved state`)} />
            <div style={{ margin: "4px 0" }}>
              <AlgText alg={m} />
            </div>
            <p className="small" style={{ margin: 0 }}>
              {text}
            </p>
          </div>
        ))}
      </div>
      <p className="small muted">{tr("Mỗi hình là khối đã giải sau khi làm đúng một nước, nhìn từ góc trên–trước–phải.", "Each picture is the solved cube after exactly one move, seen from the top–front–right corner.")}</p>

      <h2 id="luot-tay">{tr("Lướt tay: mỗi nước làm bằng ngón nào", "Finger tricks: which finger does each move")}</h2>
      <p>
        {tr(
          "Cầm cube bằng hai tay, ngón cái ở mặt trước, các ngón còn lại ở mặt sau. Thay vì xoay cả bàn tay, bạn gẩy hoặc đẩy một lớp bằng một ngón. Bảng dưới nói ngón nào làm nước nào.",
          "Hold the cube in both hands, thumbs on the front and the other fingers on the back. Instead of turning the whole hand, you flick or push one layer with one finger. The table says which finger does which move.",
        )}
      </p>
      <div className="table-scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th>{tr("Nước", "Move")}</th>
              <th>{tr("Làm thế nào", "How")}</th>
              <th>{tr("Nguồn", "Source")}</th>
            </tr>
          </thead>
          <tbody>
            {TRICKS.map((t) => (
              <tr key={t.moves.join()}>
                <td>
                  <AlgText alg={t.moves.join(" ")} />
                </td>
                <td>{t.how()}</td>
                <td className="small">
                  {t.sources.length ? (
                    t.sources.map((src, i) => (
                      <span key={src.url}>
                        {i ? ", " : ""}
                        <a href={src.url} target="_blank" rel="noreferrer">
                          {src.name}
                        </a>
                      </span>
                    ))
                  ) : (
                    <span className="muted">{tr("Thói quen người chơi, chưa có tài liệu viết", "Player habit, no written guide")}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout kind="info" title={tr("R2 và R2' khác gì nhau?", "What is the difference between R2 and R2'?")}>
        <p style={{ margin: 0 }}>
          {tr(
            "Trên cube thì không khác gì: nửa vòng theo chiều nào cũng ra cùng một kết quả. Dấu ' chỉ dặn tay quay theo chiều R' (kéo về). Chọn chiều đúng giúp cổ tay đi qua đi lại thay vì vặn mãi một chiều rồi phải buông ra cầm lại. Ví dụ công thức Pi R U2' R2' U' R2 U' R2' U2' R đổi chiều R2 mỗi lần, nên tay phải cầm nguyên từ đầu đến cuối (cách lướt tay “Air Jeff”, theo Shotaro Makisumi). Khi công thức chỉ ghi R2, chiều nào cũng được: chọn chiều nào để tay khỏi phải cầm lại.",
            "On the cube, nothing: half a turn either way gives the same result. The ' only tells the hand to turn it the R' way (pulling back). The right direction lets the wrist swing back and forth instead of twisting further one way until it has to let go and regrip. For example the Pi algorithm R U2' R2' U' R2 U' R2' U2' R changes the direction of R2 each time, so the right hand keeps its grip from start to end (the “Air Jeff” finger trick, by Shotaro Makisumi). When an algorithm just says R2, either way is fine: pick the one that saves you a regrip.",
          )}
        </p>
      </Callout>
      <Callout kind="warn" title={tr("M và r chưa có hướng dẫn viết", "M and r have no written guide")}>
        <p style={{ margin: 0 }}>
          {tr(
            "Các trang hướng dẫn lướt tay đã tra (Ruwix, ZeroPlay) chỉ viết về R, U, D, L, F, B. Cách làm M, M2 và r ở trên là cách người chơi Roux hay bàn trên diễn đàn, chưa có tài liệu viết thống nhất. Hãy thử vài cách và giữ cách bạn thấy êm tay.",
            "The finger-trick guides checked (Ruwix, ZeroPlay) only cover R, U, D, L, F and B. The ways to do M, M2 and r above are what Roux players often discuss on forums; there is no agreed written guide. Try a few ways and keep the one that feels smooth.",
          )}
        </p>
      </Callout>

      <h2>{tr("Thuật ngữ", "Glossary")}</h2>
      <div className="table-scroll">
        <table className="tbl">
          <tbody>
            {terms().map(([t, d]) => (
              <tr key={t}>
                <th style={{ width: "30%" }}>{t}</th>
                <td>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
