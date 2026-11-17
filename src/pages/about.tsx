import { ALL_CENTRES, CMLL_PIECES, FB_PIECES, LSE_PIECES, PiecesIso, SB_PIECES } from "../components/pieces-iso";
import { Callout, PageHead, Why } from "../components/ui";
import stats from "../data/cmll-stats.json";
import lse from "../data/lse-data.json";
import { tr } from "../lib/i18n";
import { href } from "../lib/router";

export function AboutPage() {
  return (
    <>
      <PageHead
        title={tr("Roux là gì?", "What is Roux?")}
        crumbs={<a href={href("/")}>{tr("Trang chủ", "Home")}</a>}
        lead={tr("Một phương pháp giải Rubik 3×3 dựng hai khối ở hai bên, rồi chỉ dùng lát giữa và tầng trên để giải phần còn lại.", "A method for solving the 3×3 Rubik’s Cube that builds two blocks on the sides, then uses only the middle slice and the top layer to solve the rest.")}
      />

      <h2>{tr("Bốn bước", "Four steps")}</h2>
      <div className="stage-row">
        <div className="card stage">
          <PiecesIso pieces={[...FB_PIECES, ...ALL_CENTRES]} yaw={1} width={150} title={tr("Khối đầu", "First block")} />
          <h3>{tr("1. Khối đầu", "1. First block")}</h3>
          <p>{tr("1×2×3 bên trái", "1×2×3 on the left")}</p>
        </div>
        <div className="card stage">
          <PiecesIso pieces={[...FB_PIECES, ...SB_PIECES, ...ALL_CENTRES]} width={150} title={tr("Khối thứ hai", "Second block")} />
          <h3>{tr("2. Khối thứ hai", "2. Second block")}</h3>
          <p>{tr("1×2×3 bên phải", "1×2×3 on the right")}</p>
        </div>
        <div className="card stage">
          <PiecesIso pieces={[...FB_PIECES, ...SB_PIECES, ...CMLL_PIECES, ...ALL_CENTRES]} width={150} title="CMLL" />
          <h3>3. CMLL</h3>
          <p>{tr("Bốn góc tầng trên", "The four top-layer corners")}</p>
        </div>
        <div className="card stage">
          <PiecesIso pieces={[...FB_PIECES, ...SB_PIECES, ...CMLL_PIECES, ...LSE_PIECES, ...ALL_CENTRES]} width={150} title="LSE" />
          <h3>4. LSE</h3>
          <p>{tr("Sáu cạnh, chỉ M và U", "Six edges, only M and U")}</p>
        </div>
      </div>
      <p>
        {tr(
          <>
            Hai bước đầu làm bằng <strong>trực giác</strong> (không có thuật toán để học thuộc), bước ba dùng thuật toán cho bốn góc, bước bốn dùng hai loại nước đơn giản M và U.
          </>,
          <>
            The first two steps are done by <strong>intuition</strong> (no algorithms to memorize), step three uses algorithms for the four corners, and step four uses just two simple kinds of moves, M and U.
          </>,
        )}
      </p>
      <Why title={tr("Vì sao thiết kế như vậy lại ít nước?", "Why does this design need fewer moves?")}>
        <p>
          {tr(
            <>
              Hai khối 1×2×3 gom gần một nửa khối vào chỉ hai bước và không cần xoay cả khối. Sau đó bạn chỉ dùng <code>M</code> và <code>U</code> cho bước cuối: hai nước này không chạm vào hai khối nên
              khối không bao giờ bị phá. Mỗi nước M cũng di chuyển nhiều mảnh cùng lúc, nên có thể làm được nhiều việc trong một nước.
            </>,
            <>
              The two 1×2×3 blocks gather almost half of the cube in just two steps, with no cube rotations. After that you use only <code>M</code> and <code>U</code> for the last step: these two moves do not touch the two blocks, so
              the blocks are never broken. Each M move also moves many pieces at once, so one move can do a lot of work.
            </>,
          )}
        </p>
        <p className="small muted" style={{ marginBottom: 0 }}>
          {tr(
            "Đây là lời giải thích của trang này (suy ra từ cấu trúc), không phải trích dẫn một nguồn.",
            "This is the explanation of this site (inferred from the structure), not a quotation from a source.",
          )}
        </p>
      </Why>

      <h2>{tr("Ai tạo ra Roux?", "Who created Roux?")}</h2>
      <ul>
        <li>
          {tr(
            <>
              <strong>Gilles Roux</strong>, người Pháp, sinh ngày 20/01/1971 (theo Wikipedia). Ông đưa ra phương pháp này vào <strong>tháng 8/2003</strong>: bài đăng đầu tiên được ghi nhận là “Another
              method”, ngày 12/08/2003 trên nhóm thảo luận Yahoo! “Speed Solving Rubik’s Cube” (theo cubinghistory.com).
            </>,
            <>
              <strong>Gilles Roux</strong>, a Frenchman, was born on 20 January 1971 (according to Wikipedia). He introduced this method in <strong>August 2003</strong>: the first recorded post is “Another
              method”, dated 12 August 2003, on the Yahoo! discussion group “Speed Solving Rubik’s Cube” (according to cubinghistory.com).
            </>,
          )}
        </li>
        <li>
          {tr(
            "Động lực: ông quay lại với Rubik năm 2001, khi đó dùng phương pháp Petrus kèm OCLL và PLL, và muốn có một phương pháp chủ yếu bằng trực giác mà có thể kết thúc chỉ bằng M và U.",
            "His motivation: he came back to the Rubik’s Cube in 2001, when he was using the Petrus method with OCLL and PLL, and wanted a method that is mostly intuitive and can finish with only M and U.",
          )}
        </li>
        <li>
          {tr(
            "Trang riêng của ông mô tả phương pháp với bốn bước: khối 1×2×3 ở một bên, khối thứ hai ở bên đối diện, bốn góc còn lại, rồi sáu cạnh và bốn tâm. Ông cũng giữ chức ủy viên của World Cube Association từ tháng 10/2004 đến 01/11/2008 (Wikipedia).",
            "His own site describes the method in four steps: a 1×2×3 block on one side, a second block on the opposite side, the remaining four corners, then the six edges and four centres. He was also a delegate of the World Cube Association from October 2004 to 1 November 2008 (Wikipedia).",
          )}
        </li>
        <li>
          {tr(
            "Tên gọi CMLL do ông đề xuất trên trang của mình năm 2005 (theo cubinghistory.com). Sau này cộng đồng (Michael Straughan, Thom Barlow, Iuri Grangeiro, Kian Mansour…) phát triển thêm nhiều biến thể LSE và nhận dạng như EOLR.",
            "The name CMLL was proposed by him on his own site in 2005 (according to cubinghistory.com). Later the community (Michael Straughan, Thom Barlow, Iuri Grangeiro, Kian Mansour…) developed many more LSE variants and recognition methods such as EOLR.",
          )}
        </li>
      </ul>

      <h2>{tr("So với CFOP", "Compared with CFOP")}</h2>
      <div className="table-scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th></th>
              <th>Roux</th>
              <th>CFOP</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{tr("Số nước trung bình (người giỏi)", "Average move count (strong cubers)")}</td>
              <td>{tr("khoảng 45–50", "about 45–50")}</td>
              <td>{tr("khoảng 55–60", "about 55–60")}</td>
            </tr>
            <tr>
              <td>{tr("Số thuật toán", "Number of algorithms")}</td>
              <td>{tr("CMLL 42 case (hoặc 9 nếu 2-look), LSE gần như trực giác", "CMLL 42 cases (or 9 with 2-look), LSE almost intuitive")}</td>
              <td>{tr("OLL 57 + PLL 21 = 78 (cộng F2L trực giác)", "OLL 57 + PLL 21 = 78 (plus intuitive F2L)")}</td>
            </tr>
            <tr>
              <td>{tr("Xoay cả khối", "Cube rotations")}</td>
              <td>{tr("Không cần", "Not needed")}</td>
              <td>{tr("Thường có", "Usually present")}</td>
            </tr>
            <tr>
              <td>{tr("Nước hay dùng", "Moves used most")}</td>
              <td>R, U, M, r</td>
              <td>R, U, F, L, D, B…</td>
            </tr>
            <tr>
              <td>{tr("Điểm khó nhất", "Hardest part")}</td>
              <td>{tr("Nhìn trước, tốc độ M, LSE", "Lookahead, M-move speed, LSE")}</td>
              <td>{tr("Nhớ nhiều thuật toán, chọn F2L", "Remembering many algorithms, choosing F2L")}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="small muted">
        {tr(
          "Số nước theo Wikipedia (bài “Speedcubing”, không nêu rõ cách đếm). Số thuật toán theo Scheopner và Ruwix. Hai cách đếm nước khác nhau (nước lát hay nước nửa vòng) cho số khác nhau khoảng 5–10%, nên đừng so trực tiếp một số Roux với một số CFOP lấy từ hai nguồn khác nhau.",
          "Move counts are from Wikipedia (the “Speedcubing” article, which does not say how the moves are counted). Algorithm counts are from Scheopner and Ruwix. Two ways of counting moves (slice turns or half-turn metric) give numbers about 5–10% apart, so do not directly compare a Roux number with a CFOP number taken from two different sources.",
        )}
      </p>
      <p>{tr("Trên trang này, mô phỏng cho các số riêng của từng bước:", "On this site, simulations give the figures for each step:")}</p>
      <ul>
        <li>
          {tr(
            <>
              CMLL đủ 42 case: trung bình <strong>{stats.fullAvg}</strong> nước; 2-look: <strong>{stats.twoLookAvg}</strong> nước.
            </>,
            <>
              Full CMLL with 42 cases: <strong>{stats.fullAvg}</strong> moves on average; 2-look: <strong>{stats.twoLookAvg}</strong> moves.
            </>,
          )}
        </li>
        <li>
          {tr(
            <>
              LSE: 3 bước <strong>{lse.stats.threeStepAvg}</strong> nước, gộp EO và UL/UR <strong>{lse.stats.twoStepAvg}</strong>, tối ưu một mạch <strong>{lse.stats.optimalAvg}</strong>.
            </>,
            <>
              LSE: three steps <strong>{lse.stats.threeStepAvg}</strong> moves, EO and UL/UR merged <strong>{lse.stats.twoStepAvg}</strong>, optimal single pass <strong>{lse.stats.optimalAvg}</strong>.
            </>,
          )}
        </li>
      </ul>

      <h2>{tr("Tốt hơn ở đâu, chưa tốt ở đâu", "Where it is better, where it is not")}</h2>
      <div className="grid cols-2">
        <div className="card" style={{ background: "var(--green-soft)" }}>
          <h3 style={{ marginTop: 0 }}>{tr("Điểm mạnh", "Strengths")}</h3>
          <ul>
            <li>{tr("Ít nước hơn và không phải xoay cả khối (Scheopner).", "Fewer moves and no cube rotations (Scheopner).")}</li>
            <li>{tr("Ít thuật toán phải nhớ; khối đầu và khối thứ hai làm bằng trực giác.", "Fewer algorithms to remember; the first and second blocks are done by intuition.")}</li>
            <li>{tr("Khối đầu linh hoạt: bạn tự chọn hướng dựng, không bị ép bởi “chữ thập” (Speedcubeshop).", "A flexible first block: you choose how to build it, and you are not forced into a “cross” (Speedcubeshop).")}</li>
            <li>{tr("Được xem là rất mạnh khi giải một tay (Ruwix).", "Considered very strong for one-handed solving (Ruwix).")}</li>
          </ul>
        </div>
        <div className="card" style={{ background: "var(--red-soft)" }}>
          <h3 style={{ marginTop: 0 }}>{tr("Điểm yếu", "Weaknesses")}</h3>
          <ul>
            <li>{tr("Nước M khó quay nhanh liên tục (Wikipedia).", "The M move is hard to turn quickly and continuously (Wikipedia).")}</li>
            <li>{tr("Cần nhìn trước nhiều hơn vì lời giải ít được chuẩn hóa; cạnh DB bị che trong LSE.", "It needs more lookahead because the solution is less standardized; the DB edge is hidden in LSE.")}</li>
            <li>{tr("Thường được cho là khó hơn với người mới (Speedcubeshop).", "Often said to be harder for beginners (Speedcubeshop).")}</li>
            <li>{tr("Dựng khối bằng trực giác đòi hỏi luyện nhiều để nhanh.", "Building blocks by intuition takes a lot of practice to become fast.")}</li>
          </ul>
        </div>
      </div>
      <Callout kind="info" title={tr("Roux hay CFOP nhanh hơn?", "Is Roux or CFOP faster?")}>
        <p style={{ margin: 0 }}>
          {tr(
            "Theo Cubeskills, hai phương pháp có tiềm năng tốc độ tương đương. Theo Wikipedia, mọi người giữ kỷ lục thế giới 3×3 trong mười năm qua dùng CFOP. Vì vậy hãy chọn phương pháp bạn thích học, không phải phương pháp “chắc chắn nhanh hơn”.",
            "According to Cubeskills, the two methods have similar speed potential. According to Wikipedia, everyone who has held the 3×3 world record in the past ten years used CFOP. So choose the method you enjoy learning, not the one that is “surely faster”.",
          )}
        </p>
      </Callout>

      <h2>{tr("Ai dùng Roux?", "Who uses Roux?")}</h2>
      <ul>
        <li>
          {tr(
            <>
              <strong>Kian Mansour</strong> (Canada): người dùng Roux nổi tiếng (Ruwix); theo Wikipedia từng phá kỷ lục thế giới trung bình giải một tay với 9,54 giây.
            </>,
            <>
              <strong>Kian Mansour</strong> (Canada): a well-known Roux user (Ruwix); according to Wikipedia he once broke the world record for the one-handed average with 9.54 seconds.
            </>,
          )}
        </li>
        <li>
          {tr(
            <>
              <strong>Sean Patrick Villanueva</strong> (Philippines): theo Wikipedia là người dùng Roux đầu tiên đạt trung bình năm lần dưới 6 giây trong thi đấu chính thức. Theo cơ sở dữ liệu WCA (xem ngày
              16/11/2026), đơn 3×3 tốt nhất 4,11 giây, trung bình 5,45 giây.
            </>,
            <>
              <strong>Sean Patrick Villanueva</strong> (Philippines): according to Wikipedia, the first Roux user to get an average of five under 6 seconds in an official competition. According to the WCA database (viewed on
              16 November 2026), his best 3×3 single is 4.11 seconds and his best average is 5.45 seconds.
            </>,
          )}
        </li>
        <li>
          {tr("Gilles Roux vẫn tự dùng phương pháp của mình.", "Gilles Roux still uses his own method himself.")}
        </li>
      </ul>
      <p className="small muted">
        {tr(
          "WCA không ghi phương pháp giải; việc ai dùng Roux dựa trên Wikipedia và Ruwix. Kỷ lục thay đổi liên tục, hãy kiểm lại trên trang WCA.",
          "The WCA does not record the solving method; who uses Roux is based on Wikipedia and Ruwix. Records change all the time, so check again on the WCA site.",
        )}
      </p>

      <h2>{tr("Hỏi nhanh", "Quick questions")}</h2>
      <h3>{tr("Roux có hợp với mình không?", "Is Roux right for me?")}</h3>
      <p>
        {tr(
          "Hợp nếu bạn thích tự tìm cách dựng khối bằng mắt hơn là học thuộc nhiều thuật toán, và chấp nhận luyện nhìn trước. Chưa hợp nếu bạn muốn chạy theo quy trình có sẵn đã được chuẩn hóa nhiều như CFOP.",
          "It fits if you prefer finding how to build the blocks by eye over memorizing many algorithms, and you accept practising lookahead. It does not fit yet if you want to follow a ready-made, highly standardized procedure like CFOP.",
        )}
      </p>
      <h3>{tr("Cần học bao nhiêu thuật toán để bắt đầu?", "How many algorithms do I need to start?")}</h3>
      <p>
        {tr(
          <>
            Chín thuật toán là đủ để giải xong CMLL (2-look). LSE hầu như không cần thuộc thuật toán dài: chỉ cần hiểu cách M và U làm việc, và có thể tra bảng của <a href={href("/lse")}>trang LSE</a>.
          </>,
          <>
            Nine algorithms are enough to finish CMLL (2-look). LSE hardly needs any long algorithm: you only need to understand how M and U work, and you can look things up in the table on the <a href={href("/lse")}>LSE page</a>.
          </>,
        )}
      </p>
      <h3>{tr("Muốn bắt đầu thì làm gì trước?", "What should I do first?")}</h3>
      <p>
        {tr(
          <>
            Đọc <a href={href("/glossary")}>ký hiệu</a>, rồi làm theo <a href={href("/learn")}>lộ trình từng bước</a>.
          </>,
          <>
            Read the <a href={href("/glossary")}>notation</a>, then follow the <a href={href("/learn")}>step-by-step path</a>.
          </>,
        )}
      </p>

      <h2>{tr("Nguồn tham khảo", "Sources")}</h2>
      <ul className="small">
        <li>{tr("cubinghistory.com/3x3/Methods/Roux (lịch sử, 2003–2016)", "cubinghistory.com/3x3/Methods/Roux (history, 2003–2016)")}</li>
        <li>{tr("grrroux.free.fr/method/Intro.html (trang của Gilles Roux)", "grrroux.free.fr/method/Intro.html (Gilles Roux’s own site)")}</li>
        <li>en.wikipedia.org/wiki/Gilles_Roux, en.wikipedia.org/wiki/Speedcubing, en.wikipedia.org/wiki/Sean_Patrick_Villanueva</li>
        <li>{tr("ruwix.com (Roux method, danh sách CMLL của Kian Mansour) và scheopner.com/cube (CMLL, LSE, số liệu)", "ruwix.com (Roux method, Kian Mansour’s CMLL list) and scheopner.com/cube (CMLL, LSE, statistics)")}</li>
        <li>{tr("cubeskills.com/blog/what-are-the-limits (so sánh tiềm năng tốc độ), speedcubeshop.com (tổng quan Roux)", "cubeskills.com/blog/what-are-the-limits (comparison of speed potential), speedcubeshop.com (overview of Roux)")}</li>
        <li>{tr("WCA, trang kết quả cá nhân (xem 16/11/2026)", "WCA, personal results pages (viewed 16 November 2026)")}</li>
      </ul>
    </>
  );
}
