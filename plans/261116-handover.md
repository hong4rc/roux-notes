# Bàn giao: site Roux (Roux Notes), 16/11/2026

Dành cho session mới. Đọc hết file này trước khi sửa gì.

## 1. Dự án và cách chạy

- Thư mục: `/Users/anhhong/project/ai/rubik`. Vite + React + TypeScript, chạy bằng bun.
- Tiếng Việt là mặc định; tiếng Anh qua `tr(vi, en)` (xem `src/lib/i18n.ts`). Không gọi `tr` ở cấp module; phải gọi lúc render.
- Máy chủ dev đang chạy ở `localhost:5273` (vite, pid 23294; tiến trình cha `bun run dev`, pid 23292). Khi xong việc, dừng hai pid này. Không mở thêm bản thứ hai.
- Repo chưa commit gì. Không commit nếu chưa có lệnh.
- Kiểm tra trước khi báo xong:
  - `bunx tsc --noEmit`
  - `bun run scripts/verify-all.ts` (phải in "all checks passed")
  - `bun run build`
  - `bun run scripts/check-i18n.ts` (phải in "no Vietnamese left in English mode")
- Scratchpad (có thể bị xóa): `/private/tmp/claude-501/-Users-anhhong-project-ai-arcade/b8fb391a-ff31-4a84-a849-ebb0909843c0/scratchpad`. Có sẵn script chụp màn hình bằng playwright (`shot-*.ts`), script thử scramble (`wca.ts`, `pic.ts`, `shape.ts`), script tìm thuật toán L (`l-search.ts`), và bản thử bộ giải khối đầu (`solve-proto.ts`). Chạy bằng `bun run <file>`.
- Chụp trình duyệt: dùng `chromium_headless_shell` có sẵn trong `~/Library/Caches/ms-playwright/`, qua `playwright-core` ở `node_modules`.

## 2. Đã làm xong (có kiểm chứng)

**Trang EO (`#/lse`)**
- Hình nhìn từ dưới dùng `view="below"` (`CubeIso`), camera nghiêng chứ không lật khối. Chú thích hai ngôn ngữ đã đổi theo.
- Đã bỏ thẻ "Đã đúng / không cần làm gì" khỏi lưới 12 dạng EO; thay bằng một dòng ghi chú.

**Giao diện chung**
- Đã bỏ nút ❓ "Đóng hết/Mở hết". Các ô "Vì sao?" mặc định mở, bấm để đóng từng ô.
- Chế độ tối: công tắc trượt ở thanh trên (`.theme-switch` trong `layout.tsx`), không còn icon kèm chữ.
- Thêm trang `#/practice` ("Luyện tập") vào menu.

**EOLR và L6E (`#/lse`, mục "Nâng cao")**
- Công cụ EOLR: chọn cạnh xấu và vị trí cạnh trái/phải, ra thuật toán ngắn nhất. 960 trường hợp, mỗi cái đã chạy lại kiểm tra.
- L6E: có ví dụ thật (ba bước 19 nước, tối ưu 8 nước). Có bộ giải nhập sáu cạnh; đã kiểm tra 300 trạng thái ngẫu nhiên đều ra lời giải đúng. Chỉ dùng được khi tâm thẳng hàng và bốn góc tầng trên đã khớp.
- Thêm `lookupState` vào `shared/lse-space.ts`.

**Trang Luyện tập (`#/practice`)**
- Chế độ "Cả lời giải" dùng `wcaScramble()` (`src/lib/scramble.ts`), gọi `randomScrambleForEvent("333")` của thư viện `cubing` (đã thêm vào `package.json`). Đã kiểm tra trong trình duyệt: 5 scramble liên tiếp, 19–21 nước, không lỗi trang. Lưu ý: chạy bằng bun thì lỗi worker, nên `verify-all` không kiểm tra được phần này.
- Có khung "Luật sinh scramble" (4 ý) và chú thích màu dưới hình: "Nhìn từ trước: mặt <F> bên trái, mặt <R> bên phải, mặt <U> ở trên", lấy tên màu theo scheme đang chọn.
- Các chế độ từng bước (khối thứ hai, CMLL, LSE) dùng bộ sinh riêng trong `scramble.ts`.

**Nút "↻ Đổi scramble"**
- `caseScramble(alg)`: chuỗi M/U ngẫu nhiên giữ nguyên khối và tâm (cạnh bị xáo thật), rồi nghịch đảo thuật toán của case, rồi một lượt U tùy chọn ở cuối. Đã kiểm tra 126 mẫu: khối và tâm đúng; xoay U rồi làm thuật toán thì bốn góc đúng; hình khớp case sau một lượt U.
- Đặt ở: trang chi tiết mỗi case CMLL (`CaseScramble` trong `cmll.tsx`), thẻ xoay hướng 2-look (`OrientCard`, hình cố định, chỉ đổi scramble), thẻ đổi chỗ góc (`PermuteCard`, hình theo scramble), UL/UR và EOLR (đổi vị trí, hình theo lựa chọn).
- Lưới 4c không có nút đổi, vì lưới liệt kê đủ 12 trường hợp.
- Đã kiểm tra: hình thẻ T (Chameleon) giữ nguyên DOM sau khi đổi. Chưa chụp được trang chi tiết CMLL và UL/UR khi bấm (lần chụp bị sai đường dẫn case).

**Thuật toán nhóm L (Bowtie) 2-look**
- Công thức hiện có: `F R' F' R U R U' R'` (8 nước).
- Tìm bằng máy (chỉ dùng R, U, F, độ sâu 7): có `R' F R U F U' F'` (7 nước), giữ khối và tâm, xoay được sau AUF. **Chưa đưa vào site**; chưa quyết có thay không.
- Tìm thêm với RULFB và RUFM bị dừng vì quá lâu, chưa có kết quả.

## 3. Chưa làm

- **Thủ thuật lướt tay (finger tricks):** trang chưa có. Nguồn đã đọc: Ruwix (`ruwix.com/the-rubiks-cube/fingertricks/`) có cách cầm R, U, D, L; không có F, M, M2, r. Các diễn đàn Speedsolving không thống nhất về M. Khi viết, chỉ ghi phần có nguồn, và ghi rõ phần còn lại là thói quen người chơi.
- **Rà soát UX trên điện thoại (390px):** không có lỗi tràn ngang và không có lỗi trang trên mọi route ở 390, 1000, 1440px. Nhưng còn các ô nhỏ hơn 30px:
  - Ô radio chọn thuật toán 2-look: 18px (`cmll/2-look`).
  - Ô đánh dấu "đã thuộc" có nhãn cao 26px (`cmll/all`, `cmll/s-columns`).
  - Nhãn "xấu" trong LSE cao 24px và checkbox 13px.
  - Radio chọn thuật toán ở `cmll/s-columns`: 13px.
  Chưa sửa.
- **Trang "Giải scramble này":** yêu cầu lớn, chưa viết code. Xem mục 5.

## 4. Vấn đề đã biết

- Tiêu đề `plans/261116-roux-site-notes.md` vẫn ghi "Roux Việt" (lệnh sed trên macOS lỗi). Tên thương hiệu hiện là "Roux Notes".
- Con số "khoảng 4.7 nước" ở `src/pages/learn.tsx` lấy từ báo cáo nghiên cứu, chưa tự kiểm chứng.
- Chưa xử lý tâm M lệch sau khối thứ hai. Bộ giải và scramble giả định tâm đã thẳng hàng.
- Chưa thử trên điện thoại thật.
- Thư viện `cubing` chạy trong trình duyệt, không chạy được bằng bun. Nếu kiểm tra tự động cần nó, phải dùng node hoặc playwright.

## 5. Yêu cầu đang chờ: trang "Giải scramble này"

Người học dán scramble (hoặc bấm từ `#/practice`). Trang tính lời giải Roux bằng máy, rồi hiển thị theo bước:

1. **Khối đầu (FB)**: tìm chuỗi ngắn nhất đưa `LEFT_BLOCK` về đúng.
2. **Khối thứ hai (SB)**: tìm chuỗi chỉ dùng R, r, U, M; khối phải đúng, tâm thẳng hàng, khối trái giữ nguyên.
3. **CMLL**: nhận dạng case qua `lookupBySignature(signatureKey(uCornerSignature(s)))`. Cho chọn cơ bản (2-look, `planTwoLook`) hoặc nâng cao (một thuật toán, `c.algs[0]` kèm `pre`/`post`). Hiển thị tên case, hình, và link `#/cmll/<id>` hoặc `#/cmll/2-look`.
4. **LSE**: cho chọn cơ bản (EO → UL/UR → 4c, đi theo `distToGoal` từng bước như `scripts/build-lse.ts`) hoặc nâng cao (L6E tối ưu). Link `#/lse`.
5. **Tóm tắt**: mỗi bước làm gì, công thức nào, bao nhiêu nước; đếm cả nước U căn chỉnh (AUF) để con số khớp chuỗi thật.

Kết quả thử nghiệm khối đầu: BFS 18 nước, độ sâu 7, theo dõi 5 mảnh khối trái, **không tìm được** trong 6 giây (326 735 trạng thái đã thăm). Khối đầu của scramble mẫu cần sâu hơn 7 nước. Hướng tiếp theo: IDA* có heuristic, hoặc tìm hai chiều, hoặc giới hạn tập nước theo Roux.

Scramble mẫu: `U2 B R2 D L' U2 B' D L2 F D2 L2 F' R2 B2 U2 F2 U2 R2 U2 R'`

Kiểm tra cần có:
- Với trạng thái ngẫu nhiên, áp chuỗi lời giải (cơ bản và nâng cao) phải về trạng thái đã giải. Thêm vào `verify-all.ts`.
- Sau FB: khối trái đúng. Sau SB: hai khối và tâm đúng. Sau CMLL: bốn góc đúng sau AUF. Sau LSE: đã giải.
- Chụp trình duyệt với scramble mẫu; không có lỗi trang.

Không làm: đổi bố cục các trang hiện có ngoài việc thêm link; thêm phụ thuộc mới nếu không cần.

## 6. Câu hỏi cần người dùng trả lời

1. Thuật toán L (Bowtie) 7 nước `R' F R U F U' F'` có thay công thức 8 nước hiện tại không?
2. Look 2 nên mặc định dùng công thức ngắn nhất, hay công thức thông dụng?
3. Khối đầu hoặc khối thứ hai vượt giới hạn tìm kiếm thì hiển thị gì? Đề xuất: báo "chưa tìm được trong giới hạn", cho bấm để tăng độ sâu.
4. Lời giải khối đầu/khối thứ hai do máy tìm có thể không giống cách người chơi làm. Giữ cách máy tìm, hay chỉ hiển thị công thức có trong trang học?
5. Thủ thuật lướt tay: viết phạm vi nào (R, U, D, L có nguồn; còn lại ghi là thói quen)?
6. Rà soát UX điện thoại: có sửa các ô nhỏ ở mục 3 không?

## 7. Cập nhật tối 16/11/2026 (session sau)

Đã làm (chưa commit):
- **Trang `#/solve` ("Giải scramble")**: bộ giải khối đầu/khối hai mới ở `shared/block-solver.ts` (IDA* với bảng khoảng cách của từng nhóm mảnh), ghép bốn bước ở `src/lib/solve.ts` (`solveRouxSteps` trả từng bước; `solveRoux` trả cả lời giải). Khối đầu dùng R U F L D B M r; khối hai dùng R r M U và kết thúc với tâm thẳng hàng. Scramble mẫu: khối đầu 7 nước (`D r' B2 L D2 R B'`), tổng 55 nước (cơ bản) / 36 (nâng cao). Trang hiện từng bước ngay khi tính xong; địa chỉ giữ `s`, `cmll`, `lse`.
- Mỗi phần có: mục tiêu, vì sao, nước xoay trước/sau (AUF) tách riêng, hình trước/sau, link tới đúng thẻ (`#/cmll/2-look?at=orient-t`, `?at=perm-diagonal`, `#/lse?at=ulur`…). Bộ xem từng nước `src/components/move-player.tsx` có câu mô tả nước (đã kiểm hướng với bộ mô phỏng) và gợi ý lướt tay.
- `CubeIso` có thêm `labels` (chữ U/F/R trên tâm) và `turn` (góc camera; 45 = như cũ, trang giải dùng 28 để mặt F ra trước).
- `?at=<id>` chạy ở mọi trang (app.tsx). Mục lục LSE là component `src/components/toc.tsx`: cột trái dính khi cuộn (>1000px), thanh mỏng dưới thanh trên (≤1000px), tô mục đang đọc.
- LSE: phần giải thích EO viết lại cho dễ hiểu (lá bài ngửa/dựng, 4 hình ví dụ, ghi chú các cạnh ngoài LSE). EO có 22 công thức đã công bố (Rouxvolution, CubeTools), gắn vào 12 dạng lúc dựng dữ liệu (`scripts/build-lse.ts`, trường `known` trong `lse-data.json`), kèm công thức máy tìm và dòng "lướt tay" (đếm nước, không đo thời gian).
- 2-look nhóm L: hai lựa chọn (8 nước phổ biến, 7 nước máy tìm), lưu ở `store.orient.L`, trang giải dùng theo lựa chọn.
- Lướt tay: bảng ở `#/glossary?at=luot-tay`, dữ liệu `src/data/fingertricks.ts`. R U D L F B có nguồn (Ruwix, ZeroPlay); M, M2, r ghi rõ là thói quen người chơi.
- Kiểm tra: `verify-all` thêm 244 lần giải (61 scramble × 4 tổ hợp) và kiểm hai công thức L; `check-i18n` thêm trang giải. Không sửa ô nhỏ trên điện thoại (người dùng không chọn).

Chưa làm / chưa chắc:
- Lần giải đầu dựng bảng khoảng 1–2 giây trên luồng chính (trang vẫn hiện dần từng bước).
- Speedsolving trả 403 nên phần M/M2/r chỉ dựa trên đoạn trích tìm kiếm.
- Máy chủ dev 5273 vẫn chạy (người dùng đang xem).

### 7b. Hoạt ảnh xoay, mạng LAN, công thức cộng đồng (16/11, tối)
- Hai trình xem từng nước (AlgStepper, MovePlayer) xoay lớp thật trong khoảng 0,32 giây (`src/components/use-turn-anim.ts`, `anim` trong `cube-iso.tsx`). Kiểm tra trong verify-all: 24 nước, ô màu quay xong nằm đúng chỗ.
- Máy chủ dev nghe trong mạng LAN (`host: true` trong `vite.config.ts`).
- CMLL: `src/data/cmll-community.json` có 124 công thức của SpeedCubeDB (số phiếu, link, ký hiệu ngón tay của John Mark khi khớp đúng từng nước). Mỗi case xếp theo phiếu, bằng phiếu thì ít nước ngoài R/U/r/M đứng trước; công thức đầu là mặc định. Hình case lấy từ công thức mặc định.
- 2-look: Pi và H có hai cách như L, mặc định là cách chỉ R/U (SpeedCubeDB OLL 22 và 21). Lựa chọn lưu ở `orient.{L,Pi,H}`.
- Dữ liệu tra cứu gốc (trang tải về, bảng cộng đồng) chỉ nằm ở thư mục tạm của phiên, không lưu trong repo.

## 7c. LSE: learning by idea, practice drill, M finger tricks (2026-11-17)

- `/lse` has a new section `#hoc-y-tuong`: how many sequences to remember (EO 2, UL/UR 2 plus U turns, 4c 6), three idea cards (EO arrow, UL/UR "drop both, then M2 up", 4c "find the edge that is right"), the M-slice U-perm as an optional shortcut, and a practice drill with scrambles (tabs EO / UL/UR / 4c, hint, idea-based answer in the stepper).
- `shared/lse-drill.ts`: `solveByIdea` searches only the taught pieces (fewest pieces, then moves). UL/UR is solved in two halves (both edges down with the top centre down, then M2) so answers follow the recipe. `verify-all` checks: every case solved, maxima EO 3 / UL/UR 4 / 4c 2, case counts 11,160 / 348 / 11, and what each sequence is said to do.
- `AlgStepper` takes an optional `steps` split (used by the drill instead of the automatic chunks).
- `fingertricks.ts`: M, M', M2 now separate with directions, sourced to Cubelelo; `tricksOfAlg` + `MoveTricks` show "how to turn each move" under every EO algorithm.

## 7d. LSE easy-hand way (2026-11-17)

- Setting `lseHand` ("easy" default, "std") in `src/lib/store.ts`; the drill has a "Kiểu tay" switch.
- `DRILL_PIECES` is now per hand. Easy: EO `M' U M'` + `M2`, UL/UR `M2` + `M' U2 M'`, 4c two cycles + `M2` + two swaps (no M in EO or UL/UR; a 4c cycle with M' only costs 8 flicks, so one M stays). Maxima measured: EO 4, UL/UR 4, 4c 2.
- Table "Cần nhớ bao nhiêu?" compares easy and standard; a callout explains why M can be avoided; "Luyện tay" lists `HAND_DRILLS` (each returns to solved after its repeat count, checked in verify-all).
