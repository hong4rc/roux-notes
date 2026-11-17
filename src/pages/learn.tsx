import { useMemo } from "react";
import { PiecesIso, ALL_CENTRES, CMLL_PIECES, FB_PIECES, LSE_PIECES, SB_PIECES } from "../components/pieces-iso";
import { AlgText, Callout, Fig, PageHead, Why } from "../components/ui";
import { CMLL_CASES, inverseCase, mirrorCase } from "../data/cmll";
import lse from "../data/lse-data.json";
import { tr } from "../lib/i18n";
import { href } from "../lib/router";

const steps = () => [
  { to: "/glossary", n: "0", basic: true, title: tr("Ký hiệu", "Notation"), text: tr("Đọc được R U R' và cách gọi từng lát, từng mặt.", "Read R U R' and learn the name of every slice and face.") },
  { to: "/learn/first-block", n: "1", basic: true, title: tr("Khối đầu (FB)", "First block (FB)"), text: tr("Dựng khối 1×2×3 bên trái bằng trực giác, không cần thuật toán.", "Build the 1×2×3 block on the left by intuition, with no algorithms.") },
  { to: "/learn/second-block", n: "2", basic: true, title: tr("Khối thứ hai (SB)", "Second block (SB)"), text: tr("Dựng khối bên phải chỉ bằng R, r, U, M để giữ khối trái.", "Build the right block using only R, r, U and M, so the left block stays intact.") },
  { to: "/cmll/2-look", n: "3", basic: true, title: "CMLL 2-look", text: tr("Giải bốn góc bằng chín thuật toán, hai lượt.", "Solve the four corners with nine algorithms in two looks.") },
  { to: "/lse", n: "4", basic: true, title: "LSE", text: tr("EO, UL/UR rồi 4c: sáu cạnh cuối chỉ bằng M và U.", "EO, UL/UR, then 4c: the last six edges using only M and U.") },
  { to: "/cmll/all", n: "5", basic: false, title: tr("Đủ 42 case CMLL", "All 42 CMLL cases"), text: tr("Một thuật toán cho mỗi case, bớt gần một nửa số nước.", "One algorithm per case, saving almost half of the moves.") },
  { to: "/learn/advanced", n: "6", basic: false, title: tr("Tối ưu", "Optimization"), text: tr("Nhìn trước, EOLR, luyện tập và các lỗi hay gặp.", "Lookahead, EOLR, practice and common mistakes.") },
];

export function LearnHub() {
  const STEPS = steps();
  return (
    <>
      <PageHead
        title={tr("Học Roux từng bước", "Learn Roux step by step")}
        crumbs={<a href={href("/")}>{tr("Trang chủ", "Home")}</a>}
        lead={tr("Lộ trình từ khối đầu tiên đến giải tối ưu. Mỗi bước đều có hình, lý do vì sao làm như vậy, và những lỗi thường gặp.", "A path from the first block to an optimized solve. Every step has pictures, the reason why you do it, and the common mistakes.")}
      />
      <div className="stage-row">
        <a className="card stage" href={href("/learn/first-block")}>
          <PiecesIso pieces={[...FB_PIECES, ...ALL_CENTRES]} yaw={1} width={150} title={tr("Khối đầu", "First block")} />
          <h3>{tr("1. Khối đầu", "1. First block")}</h3>
          <p>{tr("Bên trái, 1×2×3", "On the left, 1×2×3")}</p>
        </a>
        <a className="card stage" href={href("/learn/second-block")}>
          <PiecesIso pieces={[...FB_PIECES, ...SB_PIECES, ...ALL_CENTRES]} yaw={0} width={150} title={tr("Hai khối", "Two blocks")} />
          <h3>{tr("2. Khối thứ hai", "2. Second block")}</h3>
          <p>{tr("Bên phải, 1×2×3", "On the right, 1×2×3")}</p>
        </a>
        <a className="card stage" href={href("/cmll/2-look")}>
          <PiecesIso pieces={[...FB_PIECES, ...SB_PIECES, ...CMLL_PIECES, ...ALL_CENTRES]} width={150} title={tr("Hai khối và bốn góc", "Two blocks and four corners")} />
          <h3>3. CMLL</h3>
          <p>{tr("Bốn góc tầng trên", "The four top-layer corners")}</p>
        </a>
        <a className="card stage" href={href("/lse")}>
          <PiecesIso pieces={[...FB_PIECES, ...SB_PIECES, ...CMLL_PIECES, ...LSE_PIECES, ...ALL_CENTRES]} width={150} title={tr("Đã giải", "Solved")} />
          <h3>4. LSE</h3>
          <p>{tr("Sáu cạnh cuối", "The last six edges")}</p>
        </a>
      </div>
      <ol className="step-list">
        {STEPS.map((s) => (
          <li key={s.to}>
            <h3>
              <a href={href(s.to)}>{s.title}</a> <span className={`tag ${s.basic ? "ok" : "warn"}`}>{s.basic ? tr("Cơ bản", "Basic") : tr("Nâng cao", "Advanced")}</span>
            </h3>
            <p style={{ margin: 0 }}>{s.text}</p>
          </li>
        ))}
      </ol>
      <p>
        <a href={href("/practice")}>{tr("Luyện tập scramble cho từng bước →", "Practice scrambles for each step →")}</a>
        {" · "}
        <a href={href("/solve")}>{tr("Giải một scramble bất kỳ →", "Solve any scramble →")}</a>
      </p>
    </>
  );
}

// ------------------------------------------------------------------ first block

export function FirstBlock() {
  return (
    <>
      <PageHead
        title={tr("Bước 1: Khối đầu (FB)", "Step 1: First block (FB)")}
        crumbs={
          <>
            <a href={href("/learn")}>{tr("Học từng bước", "Learn step by step")}</a> › {tr("Khối đầu", "First block")}
          </>
        }
        lead={tr("Dựng khối 1×2×3 ở bên trái: ba cạnh, hai góc và tâm trái. Đây là bước tự do nhất của Roux: bạn được dùng mọi mặt, và không có thuật toán nào để học thuộc.", "Build the 1×2×3 block on the left: three edges, two corners and the left centre. This is the freest step of Roux: you may use every face, and there is no algorithm to memorize.")}
      />
      <div className="figs">
        <Fig caption={tr("Mục tiêu: năm mảnh cạnh–góc và tâm bên trái (các mảnh khác tô xám)", "Goal: the five edge and corner pieces and the left centre (the other pieces are greyed out)")}>
          <PiecesIso pieces={FB_PIECES} yaw={1} width={200} title={tr("Khối đầu đã xong", "First block done")} />
        </Fig>
        <div style={{ maxWidth: 380 }}>
          <p style={{ marginTop: 0 }}>
            {tr(
              <>
                <strong>Gồm:</strong> cạnh <code>DL</code> (dưới–trái), <code>FL</code> (trước–trái), <code>BL</code> (sau–trái), góc <code>DFL</code>, <code>DBL</code> và tâm trái.
              </>,
              <>
                <strong>It contains:</strong> the edges <code>DL</code> (down–left), <code>FL</code> (front–left) and <code>BL</code> (back–left), the corners <code>DFL</code> and <code>DBL</code>, and the left centre.
              </>,
            )}
          </p>
          <p>
            {tr(
              "Nhìn từ bên trái bạn thấy hai hàng ba ô cùng một màu. Hai màu còn lại của các mảnh phải khớp với tâm kề bên (tâm trước, tâm sau, tâm dưới).",
              "Seen from the left, you see two rows of three squares in one colour. The other two colours of the pieces must match the neighbouring centres (the front, back and down centres).",
            )}
          </p>
        </div>
      </div>

      <Why title={tr("Vì sao bắt đầu bằng một khối 1×2×3, không phải “chữ thập” như CFOP?", "Why start with a 1×2×3 block and not a “cross” like CFOP?")}>
        <p>
          {tr(
            <>
              Khối 1×2×3 gồm <strong>năm mảnh cạnh–góc cùng tâm</strong>, một phần lớn của khối, nên bạn tiến xa hơn nhiều so với một chữ thập (bốn cạnh).
              Quan trọng hơn: sau khối đầu, bạn vẫn còn nguyên các mặt phải, trên và lát giữa để làm tiếp mà không phải xoay cả khối. Theo Scheopner, khối đầu tối ưu (không quan tâm màu,
              đếm nước STM) trung bình khoảng 4,74 nước; nếu chỉ trung hòa màu kiểu x2y thì khoảng 5,19 nước.
            </>,
            <>
              The 1×2×3 block holds <strong>five edge and corner pieces plus a centre</strong>, a large part of the cube, so you get much further than with a cross (four edges).
              More important: after the first block, the right face, the top and the middle slice are still untouched, so you can carry on without rotating the whole cube. According to Scheopner, an optimal first block
              (colour-neutral, counted in slice-turn metric) takes about 4.74 moves on average; with x2y colour neutrality only, it is about 5.19.
            </>,
          )}
        </p>
      </Why>

      <h2>{tr("Cách dựng: ba việc nhỏ", "How to build it: three small jobs")}</h2>
      <ol className="step-list">
        <li>
          <h3>{tr("Đặt cạnh DL cạnh tâm trái và tâm dưới", "Place the DL edge next to the left and down centres")}</h3>
          <div className="figs" style={{ justifyContent: "flex-start" }}>
            <PiecesIso pieces={["DL", "L", "D"]} yaw={1} width={150} title={tr("Cạnh DL đã vào chỗ", "DL edge in place")} />
          </div>
          <p>
            {tr(
              <>
                Tìm cạnh có hai màu là <strong>màu tâm trái</strong> và <strong>màu tâm dưới</strong> rồi đưa nó vào vị trí dưới–trái, đúng hướng. Bạn không cần nhiều nước: một đến ba nước là đủ.
              </>,
              <>
                Find the edge whose two colours are the <strong>left centre colour</strong> and the <strong>down centre colour</strong>, then bring it to the down–left position with the right orientation. You do not need many moves: one to three are enough.
              </>,
            )}
          </p>
          <Why title={tr("Vì sao làm cạnh DL trước?", "Why do the DL edge first?")}>
            <p>
              {tr(
                "Cạnh DL là “xương sống” của khối: các cặp còn lại bám vào nó. Nó cũng là mảnh duy nhất mà tâm trái và tâm dưới quyết định hoàn toàn, nên đặt xong là bạn đã chốt hướng của khối. Nếu để sau, các nước đưa cặp vào dễ làm DL tuột ra.",
                "The DL edge is the “backbone” of the block: the other pairs attach to it. It is also the only piece fully decided by the left and down centres, so once it is placed you have fixed the orientation of the block. If you leave it for later, the moves that insert pairs easily knock DL out.",
              )}
            </p>
          </Why>
        </li>
        <li>
          <h3>{tr("Ghép và đưa cặp thứ nhất (FL + DFL) vào", "Join and insert the first pair (FL + DFL)")}</h3>
          <div className="figs" style={{ justifyContent: "flex-start" }}>
            <PiecesIso pieces={["DL", "FL", "DFL", "L", "D", "F"]} yaw={1} width={150} title={tr("Cặp đầu đã vào chỗ", "First pair in place")} />
          </div>
          <p>
            {tr(
              <>
                Tìm cạnh trước–trái và góc dưới–trước–trái. Đưa hai mảnh đó <strong>lại gần nhau thành một cặp</strong> ở tầng trên, rồi đưa cả cặp xuống đúng chỗ bằng một thao tác duy nhất.
              </>,
              <>
                Find the front–left edge and the down–front–left corner. Bring the two pieces <strong>together into a pair</strong> in the top layer, then put the whole pair into place with a single action.
              </>,
            )}
          </p>
          <Why title={tr("Vì sao ghép thành cặp trước khi chèn?", "Why join the pair before inserting?")}>
            <p>
              {tr(
                "Hai mảnh nằm riêng thì mỗi mảnh cần vài nước. Khi đã ghép thành cặp (màu sát màu), một lần chèn đưa cả hai vào, thường tiết kiệm ít nhất vài nước. Đây là cùng ý với F2L trong CFOP, nhưng ở Roux bạn làm đúng hai cặp rồi dừng.",
                "Two separate pieces each need a few moves. Once they are joined into a pair (colour touching colour), one insertion puts both in, which usually saves at least a few moves. This is the same idea as F2L in CFOP, but in Roux you do exactly two pairs and stop.",
              )}
            </p>
          </Why>
        </li>
        <li>
          <h3>{tr("Ghép và đưa cặp thứ hai (BL + DBL) vào, không phá cặp thứ nhất", "Join and insert the second pair (BL + DBL) without breaking the first")}</h3>
          <div className="figs" style={{ justifyContent: "flex-start" }}>
            <PiecesIso pieces={FB_PIECES} yaw={1} width={150} title={tr("Khối đầu xong", "First block done")} />
          </div>
          <p>
            {tr(
              <>
                Làm giống bước 2 cho cạnh sau–trái và góc dưới–sau–trái. Hãy ưu tiên các nước chỉ chạm lớp trên (U) và lớp trái (L) theo kiểu <em>mở cặp ra, làm việc, đóng lại</em>.
              </>,
              <>
                Do the same as in step 2 for the back–left edge and the down–back–left corner. Prefer moves that only touch the top layer (U) and the left layer (L), in the style <em>open the pair, do the work, close it again</em>.
              </>,
            )}
          </p>
          <Why title={tr("Vì sao chọn nước ít phá cặp cũ?", "Why choose moves that rarely break the old pair?")}>
            <p>
              {tr(
                "Mọi nước chạm vào lớp trái đều có thể làm tuột cặp đã xong. Nước U không chạm vào khối nên an toàn. Khi cần dùng L hay F, luôn có một nước ngược lại phía sau để trả khối về (giống cách một thuật toán CMLL “mở” rồi “đóng” khối). Giữ kỷ luật này giúp bạn không phải sửa lại.",
                "Every move that touches the left layer can knock out a pair you already finished. A U move does not touch the block, so it is safe. When you need L or F, there is always an opposite move later to put the block back (like a CMLL algorithm that “opens” and then “closes” the block). Keeping this discipline saves you from fixing things afterwards.",
              )}
            </p>
          </Why>
        </li>
      </ol>

      <h2>{tr("Kiểm tra trước khi sang bước sau", "Check before moving on")}</h2>
      <ul>
        <li>{tr("Nhìn từ bên trái: hai hàng ba ô cùng màu với tâm trái.", "Seen from the left: two rows of three squares in the colour of the left centre.")}</li>
        <li>{tr("Nhìn mặt trước, mặt sau và mặt dưới: nửa trái của các mặt đó khớp màu tâm.", "Look at the front, back and down faces: the left half of each face matches its centre colour.")}</li>
        <li>{tr("Các mảnh còn lại không quan trọng: vị trí và hướng của chúng sẽ được xử lý sau.", "The other pieces do not matter yet: their position and orientation are handled later.")}</li>
      </ul>

      <h2>{tr("Lỗi thường gặp", "Common mistakes")}</h2>
      <ul>
        <li>
          {tr(
            <>
              <strong>Dựng khối ở bên phải.</strong> Hãy cầm khối sao cho khối đầu ở bên trái. Nếu bạn thuận tay trái, có thể giải đối xứng (khối đầu bên phải) nhưng cần đảo trái–phải mọi thuật toán.
            </>,
            <>
              <strong>Building the block on the right.</strong> Hold the cube so the first block is on the left. If you are left-handed, you can solve the mirror way (first block on the right), but you must swap left and right in every algorithm.
            </>,
          )}
        </li>
        <li>
          {tr(
            <>
              <strong>Xoay cả khối giữa chừng.</strong> Roux không cần xoay cả khối; nếu bạn thấy mình phải xoay, hãy chọn cặp khác để làm trước.
            </>,
            <>
              <strong>Rotating the whole cube midway.</strong> Roux does not need cube rotations; if you find yourself rotating, pick a different pair to do first.
            </>,
          )}
        </li>
        <li>
          {tr(
            <>
              <strong>Không nhìn trước cặp thứ hai.</strong> Hãy tìm vị trí của cạnh BL và góc DBL ngay khi đang chèn cặp đầu.
            </>,
            <>
              <strong>Not looking ahead to the second pair.</strong> Find the BL edge and the DBL corner while you are still inserting the first pair.
            </>,
          )}
        </li>
      </ul>
      <Callout kind="tip" title={tr("Mẹo nâng cao: lập kế hoạch trong lúc kiểm tra", "Advanced tip: plan during inspection")}>
        <p style={{ margin: 0 }}>
          {tr(
            "Dùng thời gian xem xáo để tìm cạnh DL và hai cặp, và dự tính thứ tự. Người chơi giỏi gần như giải xong khối đầu “trong đầu” trước khi chạm vào khối.",
            "Use the inspection time to find the DL edge and the two pairs, and plan the order. Strong cubers almost solve the first block “in their head” before touching the cube.",
          )}
        </p>
      </Callout>
      <p>
        {tr("Xong khối đầu?", "First block done?")} <a href={href("/learn/second-block")}>{tr("Sang bước 2: khối thứ hai →", "On to step 2: the second block →")}</a>
      </p>
    </>
  );
}

// ------------------------------------------------------------------ second block

export function SecondBlock() {
  return (
    <>
      <PageHead
        title={tr("Bước 2: Khối thứ hai (SB)", "Step 2: Second block (SB)")}
        crumbs={
          <>
            <a href={href("/learn")}>{tr("Học từng bước", "Learn step by step")}</a> › {tr("Khối thứ hai", "Second block")}
          </>
        }
        lead={tr("Dựng khối 1×2×3 ở bên phải mà không phá khối trái. Chỉ dùng bốn kiểu nước: R, r, U và M.", "Build the 1×2×3 block on the right without breaking the left block. Use only four kinds of moves: R, r, U and M.")}
      />
      <div className="figs">
        <Fig caption={tr("Mục tiêu: hai khối ở hai bên", "Goal: one block on each side")}>
          <PiecesIso pieces={[...FB_PIECES, ...SB_PIECES, ...ALL_CENTRES]} width={200} title={tr("Hai khối đã xong", "Both blocks done")} />
        </Fig>
        <div style={{ maxWidth: 400 }}>
          <p style={{ marginTop: 0 }}>
            {tr(
              <>
                <strong>Gồm:</strong> cạnh <code>DR</code>, <code>FR</code>, <code>BR</code>, góc <code>DFR</code>, <code>DBR</code> và tâm phải.
              </>,
              <>
                <strong>It contains:</strong> the edges <code>DR</code>, <code>FR</code> and <code>BR</code>, the corners <code>DFR</code> and <code>DBR</code>, and the right centre.
              </>,
            )}
          </p>
          <p>
            {tr(
              "Sau bước này, chỉ còn lát giữa và tầng trên chưa xong: đó là CMLL và LSE.",
              "After this step, only the middle slice and the top layer are left: that is CMLL and LSE.",
            )}
          </p>
        </div>
      </div>

      <Why title={tr("Vì sao chỉ dùng R, r, U, M?", "Why only R, r, U and M?")}>
        <p>
          {tr(
            <>
              Khối trái chỉ gồm các mảnh nằm ở lớp trái, ở hai tầng thấp. Nước <code>R</code> chỉ quay lớp phải, nước <code>U</code> chỉ quay tầng trên, nước <code>M</code> chỉ quay lát giữa, và{" "}
              <code>r</code> (bằng R cộng M') quay lớp phải cùng lát giữa. Không nước nào trong bốn nước đó đụng tới lớp trái, nên <strong>dù bạn làm bao nhiêu nước kiểu này, khối trái vẫn nguyên</strong>.
              Đây cũng là lý do bước này không cần cẩn thận từng nước như khi dựng khối đầu.
            </>,
            <>
              The left block only holds pieces in the left layer, on the two lower layers. An <code>R</code> move turns only the right layer, a <code>U</code> move turns only the top layer, an <code>M</code> move turns only the middle slice, and{" "}
              <code>r</code> (R plus M') turns the right layer together with the middle slice. None of these four moves touches the left layer, so <strong>no matter how many moves of this kind you make, the left block stays intact</strong>.
              This is also why this step does not need the move-by-move care of building the first block.
            </>,
          )}
        </p>
      </Why>

      <h2>{tr("Cách dựng", "How to build it")}</h2>
      <ol className="step-list">
        <li>
          <h3>{tr("Đưa cạnh DR vào chỗ", "Put the DR edge in place")}</h3>
          <div className="figs" style={{ justifyContent: "flex-start" }}>
            <PiecesIso pieces={[...FB_PIECES, "DR", "R", "D", ...ALL_CENTRES]} width={150} title={tr("Cạnh DR đã vào chỗ", "DR edge in place")} />
          </div>
          <p>{tr("Tìm cạnh có màu tâm phải và tâm dưới, đưa về dưới–phải bằng R, r, U, M. Khi đưa vào chú ý hướng đúng.", "Find the edge with the right centre colour and the down centre colour, and bring it to the down–right position with R, r, U and M. Take care that it goes in with the correct orientation.")}</p>
          <Why title={tr("Vì sao làm DR trước?", "Why do DR first?")}>
            <p>{tr("DR là mảnh nền của khối phải, giống DL của khối trái: hai cặp góc–cạnh còn lại sẽ nối vào nó. Làm nó trước giúp bạn nhìn ra cặp còn lại cần đi đâu.", "DR is the base piece of the right block, like DL for the left block: the two remaining corner–edge pairs connect to it. Doing it first helps you see where the other pairs need to go.")}</p>
          </Why>
        </li>
        <li>
          <h3>{tr("Ghép và đưa cặp sau (BR + DBR)", "Join and insert the back pair (BR + DBR)")}</h3>
          <div className="figs" style={{ justifyContent: "flex-start" }}>
            <PiecesIso pieces={[...FB_PIECES, "DR", "BR", "DBR", "R", "D", "B", ...ALL_CENTRES]} width={150} title={tr("Cặp sau đã vào", "Back pair in place")} />
          </div>
          <p>{tr("Ghép cạnh sau–phải với góc dưới–sau–phải rồi chèn bằng R hoặc r; r thuận tiện khi cặp nằm gần lát giữa.", "Join the back–right edge with the down–back–right corner, then insert with R or r; r is handy when the pair is near the middle slice.")}</p>
          <Why title={tr("Vì sao cặp sau trước cặp trước?", "Why the back pair before the front pair?")}>
            <p>
              {tr(
                "Phần sau khối thường khó nhìn hơn. Cặp trước nằm ngay mặt bạn đang nhìn nên dễ chèn cuối cùng. Nhưng đây là thói quen, không phải luật: nếu cặp trước đã gần xong thì làm nó trước.",
                "The back of the cube is usually harder to see. The front pair is right on the face you are looking at, so it is easy to insert last. But this is a habit, not a rule: if the front pair is almost done, do it first.",
              )}
            </p>
          </Why>
        </li>
        <li>
          <h3>{tr("Ghép và đưa cặp trước (FR + DFR)", "Join and insert the front pair (FR + DFR)")}</h3>
          <div className="figs" style={{ justifyContent: "flex-start" }}>
            <PiecesIso pieces={[...FB_PIECES, ...SB_PIECES, ...ALL_CENTRES]} width={150} title={tr("Hai khối xong", "Both blocks done")} />
          </div>
          <p>{tr("Chèn cặp cuối. Sau đó nhìn bốn góc ở tầng trên để chuẩn bị cho CMLL.", "Insert the last pair. Then look at the four corners in the top layer to prepare for CMLL.")}</p>
        </li>
      </ol>

      <h2>{tr("Lỗi thường gặp", "Common mistakes")}</h2>
      <ul>
        <li>
          {tr(
            <>
              <strong>Dùng nhầm L, D, F hoặc B.</strong> Chỉ cần một nước như vậy là khối trái tuột; nếu bạn thực sự cần chúng, phải trả lại ngay sau đó.
            </>,
            <>
              <strong>Using L, D, F or B by mistake.</strong> A single such move is enough to break the left block; if you really need them, undo them right afterwards.
            </>,
          )}
        </li>
        <li>
          {tr(
            <>
              <strong>Quên tâm lát giữa đã lệch.</strong> Mỗi nước M hoặc r thay đổi vị trí tâm trên, trước, sau, dưới. Hãy nhớ đưa M về, không bỏ dở một nửa nước M.
            </>,
            <>
              <strong>Forgetting that the middle-slice centres are shifted.</strong> Every M or r move changes the position of the top, front, back and down centres. Remember to bring M back, and do not leave an M move half done.
            </>,
          )}
        </li>
        <li>
          {tr(
            <>
              <strong>Chạy một mạch không nhìn.</strong> Hãy tìm cặp tiếp theo trong lúc chèn cặp hiện tại.
            </>,
            <>
              <strong>Running through without looking.</strong> Find the next pair while you insert the current one.
            </>,
          )}
        </li>
      </ul>
      <Callout kind="tip" title={tr("Mẹo nâng cao: chuẩn bị cho CMLL", "Advanced tip: prepare for CMLL")}>
        <p style={{ margin: 0 }}>
          {tr(
            "Trong lúc chèn cặp cuối, nhìn sẵn bốn góc tầng trên: hướng và vị trí của chúng quyết định case CMLL. Người giỏi dùng lựa chọn cách chèn để vô tình xin được một case dễ.",
            "While inserting the last pair, already look at the four top-layer corners: their orientation and position decide the CMLL case. Strong cubers use their choice of how to insert to end up with an easy case.",
          )}
        </p>
      </Callout>
      <p>
        {tr("Hai khối đã xong?", "Both blocks done?")} <a href={href("/cmll/2-look")}>{tr("Sang bước 3: CMLL 2-look →", "On to step 3: CMLL 2-look →")}</a>
      </p>
    </>
  );
}

// ------------------------------------------------------------------ advanced

export function Advanced() {
  const pairs = useMemo(() => {
    const seen = new Set<string>();
    let groups = 0;
    for (const c of CMLL_CASES) {
      if (seen.has(c.id)) continue;
      groups++;
      const stack = [c];
      while (stack.length) {
        const cur = stack.pop()!;
        if (seen.has(cur.id)) continue;
        seen.add(cur.id);
        const m = mirrorCase(cur);
        const i = inverseCase(cur);
        if (m) stack.push(m);
        if (i) stack.push(i);
      }
    }
    return groups;
  }, []);
  return (
    <>
      <PageHead
        title={tr("Tối ưu và nâng cao", "Optimization and advanced")}
        crumbs={
          <>
            <a href={href("/learn")}>{tr("Học từng bước", "Learn step by step")}</a> › {tr("Nâng cao", "Advanced")}
          </>
        }
        lead={tr("Khi bốn bước đã quen tay, đây là những chỗ đáng đầu tư để nhanh hơn.", "Once the four steps feel natural, these are the places worth investing in to get faster.")}
      />
      <h2>{tr("1. Học CMLL thông minh hơn", "1. Learn CMLL more cleverly")}</h2>
      <p>
        {tr(
          <>
            42 case nghe nhiều, nhưng chúng không độc lập. Nếu tính các case đối xứng gương và nghịch đảo của nhau là một họ, thì 42 case rút lại còn <strong>{pairs} họ</strong> (do chương trình tính từ
            danh sách thuật toán). Học theo họ: học một thuật toán, rồi luyện thuật toán gương hoặc nghịch đảo bằng cách đảo trái–phải hoặc làm ngược.
          </>,
          <>
            42 cases sounds like a lot, but they are not independent. If you count cases that are mirrors or inverses of each other as one family, the 42 cases shrink to <strong>{pairs} families</strong> (computed
            by the program from the algorithm list). Learn by family: learn one algorithm, then practise the mirror or inverse algorithm by swapping left and right or by doing it backwards.
          </>,
        )}
      </p>
      <Why title={tr("Vì sao học theo họ lại nhanh?", "Why is learning by family faster?")}>
        <p>
          {tr(
            "Thuật toán gương có cùng nhịp tay nhưng đổi bên (R↔L, chiều quay đảo ngược). Thuật toán nghịch đảo chỉ là làm ngược lại từng nước. Cả hai gần như không phải nhớ thêm gì mới: chỉ cần nhận ra case.",
            "A mirror algorithm has the same finger rhythm but switches sides (R↔L, turn directions reversed). An inverse algorithm is just the moves undone one by one. Neither asks you to remember anything new: you only need to recognize the case.",
          )}
        </p>
      </Why>
      <ul>
        <li>
          {tr(
            <>
              Mở <a href={href("/cmll/all")}>thư viện</a>, đánh dấu “Đã thuộc” và mỗi trang case có hai thuật toán từ hai nguồn: hãy chọn cái thuận tay hơn.
            </>,
            <>
              Open the <a href={href("/cmll/all")}>library</a> and mark cases as “Learned”; each case page has two algorithms from two sources: pick the one that feels better in your hands.
            </>,
          )}
        </li>
        <li>{tr("Luyện nhận dạng không cần thuật toán: lật thẻ ảnh, gọi tên case trong ba giây.", "Practise recognition without algorithms: flip the picture cards and name the case within three seconds.")}</li>
      </ul>

      <h2>{tr("2. Nhìn trước để không khựng", "2. Look ahead so you do not pause")}</h2>
      <ul>
        <li>
          {tr(
            <>
              <strong>Từ SB sang CMLL:</strong> trong lúc chèn cặp cuối của khối thứ hai, hãy đoán case CMLL sắp tới.
            </>,
            <>
              <strong>From SB to CMLL:</strong> while inserting the last pair of the second block, guess the CMLL case that is coming.
            </>,
          )}
        </li>
        <li>
          {tr(
            <>
              <strong>Từ CMLL sang LSE:</strong> nhìn trạng thái sáu cạnh (đặc biệt cạnh DB bị che) ngay trong lúc làm thuật toán CMLL, và quyết định bạn cần EO nào.
            </>,
            <>
              <strong>From CMLL to LSE:</strong> look at the state of the six edges (especially the hidden DB edge) while you do the CMLL algorithm, and decide which EO you need.
            </>,
          )}
        </li>
        <li>
          {tr(
            <>
              <strong>Trong LSE:</strong> mỗi lần M làm lát giữa chuyển động nên các tâm đổi chỗ; hãy luyện đọc case “theo tâm” thay vì theo vị trí cố định.
            </>,
            <>
              <strong>In LSE:</strong> every M move turns the middle slice, so the centres change places; practise reading the case “by the centres” instead of by a fixed position.
            </>,
          )}
        </li>
      </ul>
      <Why title={tr("Vì sao nhìn trước quan trọng hơn tốc độ tay?", "Why is lookahead more important than finger speed?")}>
        <p>
          {tr(
            "Mỗi lần dừng lại để nhìn thường tốn nhiều thời gian hơn vài nước tay nhanh. Phần lớn người chơi giỏi nhanh hơn nhờ ít dừng, không phải nhờ quay tay nhanh hơn. Roux đòi hỏi nhìn trước nhiều hơn CFOP vì lời giải ít được chuẩn hóa.",
            "Each pause to look usually costs more time than a few fast moves save. Most strong cubers are faster because they pause less, not because they turn faster. Roux demands more lookahead than CFOP because the solution is less standardized.",
          )}
        </p>
      </Why>

      <h2>{tr("3. LSE: từ ba bước xuống hai bước", "3. LSE: from three steps down to two")}</h2>
      <p>
        {tr(
          <>
            Bước EO và UL/UR có thể gộp thành một thuật toán (cùng ý với EOLR). Với dữ liệu của trang này, trung bình LSE giảm từ <strong>{lse.stats.threeStepAvg}</strong> xuống{" "}
            <strong>{lse.stats.twoStepAvg}</strong> nước; giải tối ưu một mạch còn <strong>{lse.stats.optimalAvg}</strong>. Đổi lại phải nhận dạng phức tạp hơn và học thêm thuật toán.
          </>,
          <>
            The EO and UL/UR steps can be merged into one algorithm (the same idea as EOLR). With the data of this site, the LSE average drops from <strong>{lse.stats.threeStepAvg}</strong> to{" "}
            <strong>{lse.stats.twoStepAvg}</strong> moves; an optimal single-pass solve takes <strong>{lse.stats.optimalAvg}</strong>. In return, recognition is harder and you must learn more algorithms.
          </>,
        )}
      </p>
      <p>
        <a href={href("/lse")}>{tr("Mở trang LSE →", "Open the LSE page →")}</a>
      </p>

      <h2>{tr("4. Kế hoạch luyện", "4. Practice plan")}</h2>
      <ol>
        <li>
          {tr(
            <>
              Luyện <strong>riêng từng bước</strong>: 20 lần khối đầu liên tiếp, rồi 20 lần khối thứ hai từ khối đầu đã xong, rồi 20 lần LSE từ trạng thái sau CMLL.
            </>,
            <>
              Practise <strong>each step on its own</strong>: 20 first blocks in a row, then 20 second blocks starting from a finished first block, then 20 LSE solves from the state after CMLL.
            </>,
          )}
        </li>
        <li>{tr("Ghi lại bước nào chậm nhất (khối đầu, khối thứ hai, CMLL hay LSE) rồi luyện bước đó nhiều hơn.", "Note which step is slowest (first block, second block, CMLL or LSE) and practise that step more.")}</li>
        <li>{tr("Chỉ khi một bước đã ổn mới ghép các bước lại thành cả lượt giải.", "Only when a step is solid, put the steps together into a full solve.")}</li>
      </ol>
      <Callout kind="info" title={tr("Lưu ý", "Note")}>
        <p style={{ margin: 0 }}>
          {tr(
            "Kế hoạch trên là gợi ý chung, không phải số liệu chuẩn. Mỗi người có điểm yếu khác nhau; nên chọn nhịp luyện hợp với mình.",
            "The plan above is a general suggestion, not a standard figure. Everyone has different weak spots; choose a practice rhythm that suits you.",
          )}
        </p>
      </Callout>

      <h2>{tr("5. Thuật toán tham khảo nhanh", "5. Quick algorithm reference")}</h2>
      <div className="alg-row">
        <span className="small muted">Sune</span>
        <AlgText alg="R U R' U R U2 R'" />
      </div>
      <div className="alg-row">
        <span className="small muted">Antisune</span>
        <AlgText alg="R U2 R' U' R U' R'" />
      </div>
      <div className="alg-row">
        <span className="small muted">{tr("EO “mũi tên”", "“Arrow” EO")}</span>
        <AlgText alg="M U M'" />
      </div>
    </>
  );
}
