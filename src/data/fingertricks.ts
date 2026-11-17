// How each move is usually turned with the fingers, with the written guide each one comes from. Only r has no written source
// (it is player habit), and the page says so wherever it is shown.
import { tr } from "../lib/i18n";

export const RUWIX = { name: "Ruwix", url: "https://ruwix.com/the-rubiks-cube/fingertricks/" };
export const MAKISUMI = { name: "Shotaro Makisumi", url: "https://defhacks.github.io/cubefreak-mirror/speed/cfop/oll.html" };
export const ZEROPLAY = { name: "ZeroPlay", url: "https://zeroplay.io/docs/rubik/tutorials/finger-tricks" };
export const CUBELELO = { name: "Cubelelo", url: "https://www.cubelelo.com/blogs/cubing/finger-tricks-for-faster-solves-pro-techniques-to-learn" };

export interface Trick {
  moves: string[];
  how: () => string;
  /** written sources; empty when it is only player habit */
  sources: { name: string; url: string }[];
}

export const TRICKS: Trick[] = [
  {
    moves: ["R2'"],
    how: () => tr("Cổ tay phải quay ngược nửa vòng (chiều R'). Cùng kết quả với R2, chỉ khác chiều tay.", "The right wrist turns back half a turn (the R' way). Same result as R2, only the hand goes the other way."),
    sources: [MAKISUMI],
  },
  {
    moves: ["U2'"],
    how: () => tr("Ngón trỏ trái gẩy hai lần liền (hai lần U').", "The left index finger flicks twice in a row (U' twice)."),
    sources: [MAKISUMI],
  },
  { moves: ["R", "R2"], how: () => tr("Xoay cổ tay phải.", "Turn the right wrist."), sources: [RUWIX] },
  {
    moves: ["R'"],
    how: () => tr("Cổ tay phải xoay ngược lại; hoặc ngón áp út phải kéo mặt phải xuống.", "Turn the right wrist back; or pull the right face down with the right ring finger."),
    sources: [RUWIX, ZEROPLAY],
  },
  { moves: ["U"], how: () => tr("Ngón trỏ phải gẩy mặt trên sang trái.", "The right index finger flicks the top face to the left."), sources: [RUWIX, ZEROPLAY] },
  { moves: ["U'"], how: () => tr("Ngón trỏ trái gẩy mặt trên sang phải.", "The left index finger flicks the top face to the right."), sources: [RUWIX, ZEROPLAY] },
  { moves: ["U2"], how: () => tr("Gẩy hai lần liền, thường bằng ngón trỏ phải.", "Two flicks in a row, often with the right index finger."), sources: [RUWIX, ZEROPLAY] },
  { moves: ["D"], how: () => tr("Ngón áp út phải kéo mặt dưới về phía bạn.", "The right ring finger pulls the bottom face towards you."), sources: [ZEROPLAY, RUWIX] },
  { moves: ["D'"], how: () => tr("Ngón áp út trái kéo mặt dưới về phía bạn.", "The left ring finger pulls the bottom face towards you."), sources: [ZEROPLAY] },
  { moves: ["L", "L'", "L2"], how: () => tr("Như R nhưng bằng tay trái (xoay cổ tay trái).", "Like R, but with the left hand (turn the left wrist)."), sources: [RUWIX] },
  { moves: ["F"], how: () => tr("Ngón trỏ phải đẩy mặt trước xuống và sang phải.", "The right index finger pushes the front face down and to the right."), sources: [ZEROPLAY] },
  { moves: ["F'"], how: () => tr("Ngón cái phải đẩy mặt trước lên.", "The right thumb pushes the front face up."), sources: [ZEROPLAY] },
  {
    moves: ["B", "B'", "B2"],
    how: () => tr("Không có cách gẩy riêng: nhiều người xoay cả khối cho mặt sau lên trên rồi làm như U.", "No special flick: many people turn the whole cube so the back is on top, then do it like U."),
    sources: [RUWIX],
  },
  {
    moves: ["M"],
    how: () =>
      tr(
        "Lát giữa quay cùng chiều L: mặt trước đi xuống, mặt sau đi lên. Một ngón áp út (tay trái hay tay phải đều được) đẩy mặt sau của lát giữa lên.",
        "The middle slice turns the same way as L: the front goes down, the back comes up. A ring finger (left or right hand) pushes the back of the middle slice up.",
      ),
    sources: [CUBELELO],
  },
  {
    moves: ["M'"],
    how: () =>
      tr(
        "Ngược với M: mặt trước đi lên, mặt sau đi xuống. Một ngón áp út đặt ở mặt sau của lát giữa, gẩy nó xuống.",
        "The opposite of M: the front comes up, the back goes down. A ring finger on the back of the middle slice flicks it down.",
      ),
    sources: [CUBELELO],
  },
  {
    moves: ["M2"],
    how: () =>
      tr(
        "Gẩy hai lần liền: ngón áp út rồi ngón giữa của cùng một tay. Quay chiều nào cũng ra cùng kết quả.",
        "Two flicks in a row: the ring finger, then the middle finger of the same hand. Either direction gives the same result.",
      ),
    sources: [CUBELELO],
  },
  {
    moves: ["r", "r'", "r2"],
    how: () => tr("Xoay cổ tay phải như R, nhưng ôm cả lát giữa.", "Turn the right wrist like R, but take the middle slice along."),
    sources: [],
  },
];

// an X2' with no trick of its own falls back to X2: the cube ends the same
export const trickOf = (move: string): Trick | undefined => TRICKS.find((t) => t.moves.includes(move)) ?? TRICKS.find((t) => t.moves.includes(move.replace("2'", "2")));

/** each kind of move in an algorithm once, in the order it first appears, with how to turn it */
export function tricksOfAlg(alg: string): { move: string; trick: Trick | undefined }[] {
  const seen = new Set<string>();
  return alg
    .split(" ")
    .filter((m) => m && !seen.has(m) && seen.add(m))
    .map((move) => ({ move, trick: trickOf(move) }));
}

/**
 * A short, countable description of how an algorithm sits in the hands: how many slice moves and double turns, and how often the
 * hand on the top face has to change. It is counting, not timing, and the page labels it that way.
 */
export function handNote(alg: string): string {
  const toks = alg.split(" ").filter(Boolean);
  const m = toks.filter((t) => t[0] === "M");
  const m2 = toks.filter((t) => t === "M2").length;
  const u2 = toks.filter((t) => t === "U2").length;
  const uLeft = toks.filter((t) => t === "U'").length;
  const uRight = toks.filter((t) => t === "U").length;
  const parts = [
    tr(`${toks.length} nước`, `${toks.length} moves`),
    tr(`${m.length} nước M`, `${m.length} M moves`) + (m2 ? tr(` (${m2} lần M2)`, ` (${m2} of them M2)`) : ""),
    uRight ? tr(`${uRight} lần U (trỏ phải)`, `${uRight}× U (right index)`) : "",
    uLeft ? tr(`${uLeft} lần U' (trỏ trái)`, `${uLeft}× U' (left index)`) : "",
    u2 ? tr(`${u2} lần U2`, `${u2}× U2`) : "",
  ].filter(Boolean);
  return parts.join(" · ");
}

// ---------------------------------------------------------------------------------------------
// John Mark's finger code (the DeeDubb notation, see DEEDUBB) turned into plain words.
// Upper case = right hand, lower case = left hand; T thumb, I index, M middle, R ring, P pinkie, W wrist.
// On U the number is the corner the finger starts on, counted clockwise from the back left (1 UBL, 2 UBR, 3 UFR, 4 UFL);
// no written source gives the numbering of the other faces, so for them only the hand and finger are said.
// {..} is a grip: {TU} = right thumb on the top face (fingers below), {tF,TF} = both thumbs on the front (the usual grip).

export const DEEDUBB = [
  { name: "Ruwix", url: "https://ruwix.com/the-rubiks-cube/notation/advanced/" },
  { name: "Speedsolving wiki", url: "https://www.speedsolving.com/wiki/index.php/Finger_tricks" },
];

const FINGER: Record<string, () => string> = {
  T: () => tr("ngón cái", "thumb"),
  I: () => tr("ngón trỏ", "index finger"),
  M: () => tr("ngón giữa", "middle finger"),
  R: () => tr("ngón áp út", "ring finger"),
  P: () => tr("ngón út", "little finger"),
  W: () => tr("cổ tay", "wrist"),
};
const FACE_WORD: Record<string, () => string> = {
  U: () => tr("mặt trên", "the top face"),
  D: () => tr("mặt dưới", "the bottom face"),
  F: () => tr("mặt trước", "the front face"),
  B: () => tr("mặt sau", "the back face"),
  R: () => tr("mặt phải", "the right face"),
  L: () => tr("mặt trái", "the left face"),
};
const U_CORNER: Record<number, () => string> = {
  1: () => tr("góc sau bên trái", "the back left corner"),
  2: () => tr("góc sau bên phải", "the back right corner"),
  3: () => tr("góc trước bên phải", "the front right corner"),
  4: () => tr("góc trước bên trái", "the front left corner"),
};
// where a U-layer corner goes on U (clockwise seen from above: 1 → 2 → 3 → 4 → 1) and on U'
const U_WAY: Record<"cw" | "ccw", Record<number, () => string>> = {
  cw: { 1: () => tr("sang phải", "to the right"), 2: () => tr("về phía bạn", "towards you"), 3: () => tr("sang trái", "to the left"), 4: () => tr("ra xa bạn", "away from you") },
  ccw: { 1: () => tr("về phía bạn", "towards you"), 2: () => tr("sang trái", "to the left"), 3: () => tr("ra xa bạn", "away from you"), 4: () => tr("sang phải", "to the right") },
};

/** "I2" → "ngón trỏ phải", with the U corner when there is one */
function fingerOf(code: string): { who: string; at?: number } {
  const m = /^([TIMRPWtimrpw])([1-4])?$/.exec(code);
  if (!m) throw new Error(`unknown finger code ${code}`);
  const right = m[1] === m[1].toUpperCase();
  const who = `${FINGER[m[1].toUpperCase()]()} ${right ? tr("phải", "(right hand)") : tr("trái", "(left hand)")}`;
  return { who, at: m[2] ? Number(m[2]) : undefined };
}

export interface FingerStep {
  /** the move or grip as written, e.g. "U(I2)" */
  code: string;
  words: string;
}

type LineItem = { kind: "grip"; code: string; words: string } | { kind: "move"; code: string; move: string; words: string | null };

function readLine(notation: string): LineItem[] {
  const out: LineItem[] = [];
  for (const tok of notation.replace(/[’‘]/g, "'").split(/\s+/).filter(Boolean)) {
    const grip = /^\{([^}]*)\}$/.exec(tok);
    if (grip) {
      const parts = grip[1].split(",").map((p) => p.trim());
      const words = parts.map((p) => {
        const g = /^([tT])([UDFBRL])$/.exec(p);
        if (!g) throw new Error(`unknown grip ${p}`);
        return `${tr("ngón cái", "thumb")} ${g[1] === "T" ? tr("phải", "(right hand)") : tr("trái", "(left hand)")} ${tr("đặt ở", "on")} ${FACE_WORD[g[2]]()}`;
      });
      out.push({ kind: "grip", code: tok, words: `${tr("Cầm lại", "Regrip")}: ${words.join(", ")}.` });
      continue;
    }
    const mv = /^([RLUDFBMrludfbSExyz])(2'|2|')?(?:\(([^)]*)\))?$/.exec(tok);
    if (!mv) throw new Error(`cannot read ${tok}`);
    const move = mv[1] + (mv[2] ?? "");
    if (!mv[3]) {
      out.push({ kind: "move", code: tok, move, words: null });
      continue;
    }
    const fingers = mv[3].split(",").map((c) => fingerOf(c.trim()));
    const half = (mv[2] ?? "").startsWith("2");
    const who = fingers.map((f) => f.who).join(tr(" rồi ", ", then "));
    let words: string;
    if (mv[1] === "U" && fingers[0].at) {
      const from = U_CORNER[fingers[0].at]();
      words = half
        ? tr(`${who}, gẩy hai lần liền, bắt đầu từ ${from}.`, `${who}, two flicks in a row, starting from ${from}.`)
        : `${who}, ${tr("đặt ở", "placed on")} ${from}, ${tr("gẩy", "flicks it")} ${U_WAY[mv[2] === "'" ? "ccw" : "cw"][fingers[0].at]()}.`;
    } else {
      const face =
        mv[1] === "r" ? tr("hai lớp bên phải", "the two right layers") : mv[1] === "M" ? tr("lát giữa", "the middle slice") : (FACE_WORD[mv[1].toUpperCase()]?.() ?? mv[1]);
      words = half ? tr(`${who} xoay ${face} hai lần.`, `${who} turns ${face} twice.`) : tr(`${who} xoay ${face}.`, `${who} turns ${face}.`);
    }
    out.push({ kind: "move", code: tok, move, words: words.charAt(0).toUpperCase() + words.slice(1) });
  }
  return out;
}

/** John Mark's line, one entry per move that names a finger or per grip; moves without a code are left out */
export function fingerWords(notation: string): FingerStep[] {
  return readLine(notation).flatMap((it) => (it.kind === "grip" ? [{ code: it.code, words: it.words }] : it.words ? [{ code: it.code, words: `${it.move}: ${it.words}` }] : []));
}

/** the same line, one entry per move (null when the move names no finger); a grip is told together with the move after it */
export function fingerByMove(notation: string): (string | null)[] {
  const out: (string | null)[] = [];
  let grip = "";
  for (const it of readLine(notation)) {
    if (it.kind === "grip") {
      grip += `${it.words} `;
      continue;
    }
    out.push(grip || it.words ? `${grip}${it.words ?? ""}`.trim() : null);
    grip = "";
  }
  return out;
}

/** the moves of a finger line with the codes taken out, to compare with the algorithm it belongs to */
export const fingerMoves = (notation: string) =>
  notation
    .replace(/[’‘]/g, "'")
    .split(/\s+/)
    .filter((t) => t && !t.startsWith("{"))
    .map((t) => t.replace(/\(.*\)$/, "").replace("2'", "2"))
    .join(" ");
