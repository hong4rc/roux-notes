import { tr } from "../lib/i18n";
import { getOrientPick, getPermPick } from "../lib/store";
import type { GroupId } from "./cmll";

export interface OrientOption {
  alg: string;
  title: string;
  pros: string[];
  cons: string[];
  source?: { name: string; url: string };
  /** a written finger guide: one entry per move (null: nothing said about it) */
  fingers?: { by: string; steps: (string | null)[]; source: { name: string; url: string }; note?: string };
}

export interface OrientAlg {
  group: GroupId;
  name: string;
  /** the algorithm in use: the learner's pick when the group offers options */
  alg: string;
  note: string;
  options?: OrientOption[];
}

// L (Bowtie): the common algorithm and a shorter one found by a computer search (R, U, F only). Both are checked in
// scripts/verify-all.ts. What is said about the hands is the site's reading of the grips described by ZeroPlay and Ruwix, not a timing.
const bowtieOptions = (): OrientOption[] => [
  {
    alg: "F R' F' R U R U' R'",
    title: tr("Phổ biến trong tài liệu", "The common one in guides"),
    pros: [
      tr("Có trong bảng 2-look CMLL của Rouxvolution.", "Listed in Rouxvolution's 2-look CMLL table."),
      tr("Hai nửa dễ nhớ: F R' F' R rồi U R U' R'.", "Two halves that are easy to remember: F R' F' R, then U R U' R'."),
      tr("Nửa sau chỉ có R và U, tay phải làm liền mạch.", "The second half is only R and U, one smooth run for the right hand."),
    ],
    cons: [tr("8 nước.", "8 moves.")],
  },
  {
    alg: "R' F R U F U' F'",
    title: tr("Ngắn hơn một nước (máy tìm)", "One move shorter (found by computer)"),
    pros: [tr("7 nước.", "7 moves."), tr("Chỉ dùng R, U, F.", "Uses only R, U and F.")],
    cons: [
      tr("Không thấy trong nguồn nào đã tra (Rouxvolution, Ruwix, Scheopner): do máy tìm.", "Not found in any source checked (Rouxvolution, Ruwix, Scheopner): found by computer."),
      tr(
        "Đoạn F U F' ở cuối: ngón trỏ phải vừa đẩy F xong lại phải gẩy U, rồi ngón cái đẩy F'. Dễ phải đổi cách cầm (nhận xét của trang, chưa đo thời gian).",
        "The F U F' at the end: the right index finger pushes F, then has to flick U, then the thumb pushes F'. You may need to regrip (the site's reading, not timed).",
      ),
    ],
  },
];

// Pi and H: the R/U-only algorithms most voted on SpeedCubeDB (OLL 21 and 22; they keep both Roux blocks, checked in
// scripts/verify-all.ts), and the F (R U R' U') F' family the site used before.
const SCDB_OLL = (n: number) => `https://speedcubedb.com/a/3x3/OLL/OLL_${n}`;
const piOptions = (): OrientOption[] => [
  {
    // written with the direction of each half turn, because the finger trick depends on it (the cube ends the same either way)
    alg: "R U2' R2' U' R2 U' R2' U2' R",
    title: tr("Được bình chọn nhiều nhất", "The most voted"),
    pros: [
      tr("Chỉ dùng R và U: không có F.", "Only R and U: no F."),
      tr(
        "Có cách lướt tay riêng tên “Air Jeff”: tay phải ôm lớp R suốt từ đầu đến cuối, ngón trỏ trái lo mọi nước U.",
        "It has its own finger trick, the “Air Jeff”: the right hand holds the R layer from start to end, the left index finger does every U.",
      ),
      tr(
        "Bí quyết là đổi chiều R2 mỗi lần (R2', rồi R2, rồi R2'): cổ tay chỉ đi qua đi lại giữa hai chỗ, không phải buông ra cầm lại.",
        "The key is to change the direction of R2 each time (R2', then R2, then R2'): the wrist only swings back and forth between two places and never has to let go.",
      ),
      tr("101 phiếu trên SpeedCubeDB (OLL 22), nhiều nhất cho case này.", "101 votes on SpeedCubeDB (OLL 22), the most for this case."),
    ],
    cons: [tr("Cần quen xoay cổ tay nửa vòng theo cả hai chiều.", "You need to get used to half-turns of the wrist both ways.")],
    source: { name: "SpeedCubeDB", url: SCDB_OLL(22) },
    fingers: {
      by: tr("Air Jeff, theo Shotaro Makisumi", "Air Jeff, by Shotaro Makisumi"),
      source: { name: "Shotaro Makisumi (cubefreak)", url: "https://defhacks.github.io/cubefreak-mirror/speed/cfop/oll.html" },
      note: tr(
        "Nguồn tả rõ bốn nước đầu (R, U2' bằng ngón trỏ trái, R2', U' bằng ngón trỏ trái) rồi ghi “v.v.”; các nước sau trang viết theo cùng nhịp đó.",
        "The source spells out the first four moves (R, U2' with the left index, R2', U' with the left index) and then says “etc.”; the site writes the rest in the same rhythm.",
      ),
      steps: [
        tr(
          "Tay phải ôm lớp R bằng cả năm ngón (bốn ngón ở trên, ngón cái ở dưới) và giữ nguyên cách cầm này đến hết. Cổ tay phải xoay R.",
          "The right hand holds the R layer with all five fingers (four on top, the thumb below) and keeps this grip to the end. The right wrist turns R.",
        ),
        tr("Ngón trỏ trái gẩy hai lần liền (hai lần U').", "The left index finger flicks twice in a row (U' twice)."),
        tr("Cổ tay phải quay ngược nửa vòng, theo chiều R'.", "The right wrist turns back half a turn, the R' way."),
        tr("Ngón trỏ trái gẩy một lần.", "The left index finger flicks once."),
        tr("Cổ tay phải quay nửa vòng theo chiều R: đổi chiều so với lần trước.", "The right wrist turns half a turn the R way: the other direction from last time."),
        tr("Ngón trỏ trái gẩy một lần.", "The left index finger flicks once."),
        tr("Cổ tay phải quay ngược nửa vòng, theo chiều R': lại đổi chiều.", "The right wrist turns back half a turn, the R' way: the direction changes again."),
        tr("Ngón trỏ trái gẩy hai lần liền.", "The left index finger flicks twice in a row."),
        tr("Cổ tay phải xoay R, về đúng chỗ lúc bắt đầu.", "The right wrist turns R, back to where it started."),
      ],
    },
  },
  {
    alg: "F R U R' U' R U R' U' F'",
    title: tr("Lặp giữa F và F'", "Repeat between F and F'"),
    pros: [tr("Dễ nhớ: (R U R' U') hai lần giữa F và F'.", "Easy to remember: (R U R' U') twice between F and F'.")],
    cons: [tr("10 nước, có F ở đầu và F' ở cuối.", "10 moves, with F at the start and F' at the end.")],
  },
];
const hOptions = (): OrientOption[] => [
  {
    alg: "R U R' U R U' R' U R U2 R'",
    title: tr("Được bình chọn nhiều nhất", "The most voted"),
    pros: [
      tr("Chỉ dùng R và U: không có F, không phải đổi tay cầm.", "Only R and U: no F, no regrip."),
      tr("83 phiếu trên SpeedCubeDB (OLL 21), nhiều nhất cho case này.", "83 votes on SpeedCubeDB (OLL 21), the most for this case."),
      tr("11 nước, chỉ một nước xoay đôi.", "11 moves, only one double turn."),
    ],
    cons: [tr("Ba đoạn gần giống nhau, dễ nhầm U với U' ở giữa.", "Three almost equal parts: easy to mix up U and U' in the middle.")],
    source: { name: "SpeedCubeDB", url: SCDB_OLL(21) },
  },
  {
    alg: "F R U R' U' R U R' U' R U R' U' F'",
    title: tr("Lặp giữa F và F'", "Repeat between F and F'"),
    pros: [tr("Dễ nhớ: (R U R' U') ba lần giữa F và F'.", "Easy to remember: (R U R' U') three times between F and F'.")],
    cons: [tr("14 nước, có F ở đầu và F' ở cuối.", "14 moves, with F at the start and F' at the end.")],
  },
];

// Look 1: turn every U corner so its top colour faces up (edges are ignored).
export const ORIENT_ALGS: OrientAlg[] = [
  {
    group: "S",
    name: "Sune",
    alg: "R U R' U R U2 R'",
    get note() {
      return tr("Quen thuộc từ CFOP; chỉ dùng R và U.", "Familiar from CFOP; uses only R and U.");
    },
  },
  {
    group: "As",
    name: "Antisune",
    alg: "R U2 R' U' R U' R'",
    get note() {
      return tr("Ngược lại của Sune.", "The reverse of Sune.");
    },
  },
  {
    group: "U",
    name: "U (Headlights)",
    alg: "F R U R' U' F'",
    get note() {
      return tr("Ngắn nhất trong bảng; dùng F nên nhớ trả lại khối đầu.", "The shortest in the table; it uses F, so remember to put the first block back.");
    },
  },
  {
    group: "T",
    name: "T (Chameleon)",
    alg: "R U R' U' R' F R F'",
    get note() {
      return tr("Cặp R U R' U' rồi R' F R F'.", "The pair R U R' U' and then R' F R F'.");
    },
  },
  {
    group: "L",
    name: "L (Bowtie)",
    get options() {
      return bowtieOptions();
    },
    get alg() {
      const o = bowtieOptions();
      return o[Math.min(getOrientPick("L"), o.length - 1)].alg;
    },
    get note() {
      return tr("Hai nửa: F R' F' R rồi U R U' R'. Có thêm một cách 7 nước bên dưới.", "Two halves: F R' F' R, then U R U' R'. A 7-move way is below.");
    },
  },
  {
    group: "Pi",
    name: "Pi",
    get options() {
      return piOptions();
    },
    get alg() {
      const o = piOptions();
      return o[Math.min(getOrientPick("Pi"), o.length - 1)].alg;
    },
    get note() {
      return tr("Mặc định là cách chỉ dùng R và U. Cách lặp (R U R' U') giữa F và F' vẫn có bên dưới.", "The default uses only R and U. The (R U R' U') between F and F' way is still below.");
    },
  },
  {
    group: "H",
    name: "H",
    get options() {
      return hOptions();
    },
    get alg() {
      const o = hOptions();
      return o[Math.min(getOrientPick("H"), o.length - 1)].alg;
    },
    get note() {
      return tr("Mặc định là cách chỉ dùng R và U. Cách lặp (R U R' U') giữa F và F' vẫn có bên dưới.", "The default uses only R and U. The (R U R' U') between F and F' way is still below.");
    },
  },
];

export interface PermuteOption {
  alg: string;
  /** short name of this way of doing it */
  title: string;
  pros: string[];
  cons: string[];
}

export interface PermuteAlg {
  id: "adjacent" | "diagonal";
  name: string;
  /** the algorithm the learner picked (the planner and the viewer use this one) */
  alg: string;
  options: PermuteOption[];
  note: string;
}

// Every option below was found or checked by simulation: it keeps both blocks and all centres, and it fixes
// the corner permutation of the case it belongs to (see scripts/verify-all.ts). The "pros" and "cons" talk
// about what can be counted (length, double turns, which faces turn); how it feels in the hands is for the
// learner to try.
const adjacentOptions = (): PermuteOption[] => [
  {
    alg: "R U R' F' R U R' U' R' F R2 U' R'",
    title: tr("Phổ biến trong tài liệu", "The common one in guides"),
    pros: [
      tr("Có trong cả hai nguồn (Ruwix và Scheopner).", "Listed by both sources (Ruwix and Scheopner)."),
      tr("Chỉ dùng R, U, F, nên có thể làm hoàn toàn bằng tay phải.", "Uses only R, U and F, so it can be done with the right hand alone."),
      tr("Chỉ một nước xoay đôi.", "Only one double turn."),
    ],
    cons: [tr("Dài nhất trong các cách: 13 nước.", "The longest of the options: 13 moves.")],
  },
  {
    alg: "R2 F2 R' U' R F2 R' U R'",
    title: tr("Ngắn nhất", "The shortest"),
    pros: [
      tr("Chỉ 9 nước, ngắn hơn 4 nước so với cách phổ biến.", "Only 9 moves, 4 fewer than the common one."),
      tr("Chỉ dùng R, U, F.", "Uses only R, U and F."),
    ],
    cons: [
      tr("Ba nước xoay đôi (R2, F2, F2): hợp hay không tùy cách bạn cầm cube.", "Three double turns (R2, F2, F2): whether they suit you depends on how you grip the cube."),
      tr("Không có đoạn lặp để dễ nhớ.", "No repeated part to help you remember it."),
    ],
  },
  {
    alg: "R L U2 R' U' R U2 L' U R'",
    title: tr("Chia việc cho hai tay", "Shares the work between both hands"),
    pros: [
      tr("10 nước.", "10 moves."),
      tr("L làm bằng tay trái, R làm bằng tay phải.", "L is turned by the left hand and R by the right."),
    ],
    cons: [
      tr("L chạm vào khối trái (được trả lại ở cuối): xoay sai chiều là hỏng khối.", "L touches the left block (it comes back at the end): a turn in the wrong direction breaks the block."),
      tr("Cần bấm R và L liền nhau.", "R and L come right after each other."),
    ],
  },
  {
    alg: "R U2 R' U' R U2 L' U R' U' L",
    title: tr("Gần như chỉ R và U", "Almost only R and U"),
    pros: [
      tr("11 nước; phần lớn là R và U.", "11 moves; mostly R and U."),
      tr("Hai nước L chỉ ở gần cuối, dễ nhận ra.", "The two L moves come near the end, easy to spot."),
    ],
    cons: [tr("L chạm vào khối trái (được trả lại ở cuối).", "L touches the left block (it comes back at the end).")],
  },
];

const diagonalOptions = (): PermuteOption[] => [
  {
    alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    title: tr("Phổ biến trong tài liệu", "The common one in guides"),
    pros: [
      tr("Có trong cả hai nguồn (Ruwix và Scheopner).", "Listed by both sources (Ruwix and Scheopner)."),
      tr("Chỉ dùng R, U, F; không có nước xoay đôi.", "Uses only R, U and F; no double turns."),
    ],
    cons: [tr("Dài nhất: 17 nước, gồm hai nửa phải nhớ.", "The longest: 17 moves, made of two halves you must remember.")],
  },
  {
    alg: "R2 U2 F2 U' R2 U2 F2 U R2 U2 F2",
    title: tr("Ngắn và có nhịp lặp", "Short and rhythmic"),
    pros: [
      tr("11 nước, ngắn hơn 6 nước so với cách phổ biến.", "11 moves, 6 fewer than the common one."),
      tr("Lặp mẫu R2 U2 F2 ba lần (xen U' và U), dễ nhớ.", "The pattern R2 U2 F2 repeats three times (with U' and U between), easy to remember."),
    ],
    cons: [tr("Tám trên mười một nước là xoay đôi: tốc độ tùy cách bấm của bạn.", "Eight of the eleven moves are double turns: the speed depends on how you turn them.")],
  },
  {
    alg: "R2 U' R F' R' U R2 F' U' F U F",
    title: tr("Ít xoay đôi", "Few double turns"),
    pros: [
      tr("12 nước, chỉ hai nước xoay đôi.", "12 moves with only two double turns."),
      tr("Chỉ dùng R, U, F.", "Uses only R, U and F."),
    ],
    cons: [tr("Không có đoạn lặp, khó nhớ hơn cách có nhịp.", "No repeated part, harder to remember than the rhythmic one.")],
  },
];

/** double turns (R2, U2', F2 ...) in an algorithm */
export const doubleTurns = (alg: string) => alg.split(" ").filter((t) => t.includes("2")).length;
const onlyRUF = (alg: string) => alg.split(" ").filter(Boolean).every((t) => "RUF".includes(t[0]));

/**
 * The default way for step 2: among the options that use only R, U and F, the one with the fewest double turns (ties: the first listed).
 * The options are listed with this one first, so a learner who never chose gets it (scripts/verify-cmll.ts checks that).
 */
export function defaultPermuteIndex(options: PermuteOption[]): number {
  let best = -1;
  options.forEach((o, i) => {
    if (!onlyRUF(o.alg)) return;
    if (best < 0 || doubleTurns(o.alg) < doubleTurns(options[best].alg)) best = i;
  });
  return Math.max(best, 0);
}

export const PERMUTE_ALGS: PermuteAlg[] = [
  {
    id: "adjacent",
    get name() {
      return tr("Đổi hai góc kề nhau", "Swap two adjacent corners");
    },
    get options() {
      return adjacentOptions();
    },
    get alg() {
      const o = this.options;
      return o[Math.min(getPermPick("adjacent"), o.length - 1)].alg;
    },
    get note() {
      return tr("Nhận ra: có đúng một cặp đèn pha (hai sticker cạnh nhau cùng màu).", "How to spot it: there is exactly one pair of headlights (two stickers side by side of the same colour).");
    },
  },
  {
    id: "diagonal",
    get name() {
      return tr("Đổi hai góc chéo nhau", "Swap two diagonal corners");
    },
    get options() {
      return diagonalOptions();
    },
    get alg() {
      const o = this.options;
      return o[Math.min(getPermPick("diagonal"), o.length - 1)].alg;
    },
    get note() {
      return tr("Nhận ra: không có đèn pha ở mặt nào.", "How to spot it: there are no headlights on any face.");
    },
  },
];

/**
 * Which corners the algorithms of step 2 exchange, in the view of the picture (front face at the bottom).
 * scripts/verify-all.ts checks these against the simulation.
 */
export const SWAP_PAIRS: Record<PermuteAlg["id"], { pair: [string, string]; headlightFace?: "L" }> = {
  adjacent: { pair: ["UFR", "UBR"], headlightFace: "L" },
  diagonal: { pair: ["UFR", "UBL"] },
};
