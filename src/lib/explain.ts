import { applyMove, isPieceSolved, pieceStickers, type Move, type State } from "../../shared/cube";
import { tr } from "./i18n";
import { LEFT_BLOCK, RIGHT_BLOCK, U_CORNERS } from "../../shared/roux";

export interface Token {
  text: string;
  move: Move;
  auf: boolean;
}

export interface Chunk {
  from: number; // index of first token
  to: number; // index after last token
  title: string;
  what: string;
  why?: string;
}

interface Known {
  moves: string;
  title: string;
  what: string;
  why?: string;
}

/** Text fields are getters so they follow the language at the time they are read. */
const KNOWN: Known[] = [
  {
    moves: "R U R' U R U2 R'",
    get title() {
      return tr("Đây chính là Sune", "This is Sune");
    },
    get what() {
      return tr(
        "Bảy nước xoay hướng ba góc cùng một lúc; góc thứ tư đứng yên về hướng.",
        "Seven moves twist three corners at once; the fourth corner keeps its orientation.",
      );
    },
    get why() {
      return tr(
        "Sune là 'viên gạch' xoay hướng quen thuộc nhất; nhiều alg CMLL được ghép từ Sune cộng thêm một bước hoán đổi.",
        "Sune is the most familiar building block for twisting corners; many CMLL algs are Sune plus one swap step.",
      );
    },
  },
  {
    moves: "R U2 R' U' R U' R'",
    get title() {
      return tr("Đây chính là Antisune", "This is Antisune");
    },
    get what() {
      return tr(
        "Bảy nước xoay hướng ba góc theo chiều ngược với Sune.",
        "Seven moves twist three corners in the opposite direction to Sune.",
      );
    },
    get why() {
      return tr(
        "Antisune là nghịch đảo của Sune (làm ngược lại từng nước), nên nó trả về điều Sune đã làm.",
        "Antisune is the inverse of Sune (each move undone in reverse), so it undoes what Sune does.",
      );
    },
  },
  {
    moves: "F R U R' U' F'",
    get title() {
      return "F (R U R' U') F'";
    },
    get what() {
      return tr(
        "Mặt trước F đưa các mảnh ra khỏi vùng làm việc, bộ R U R' U' xoay hướng, rồi F' trả lại mặt trước.",
        "The front face F moves pieces out of the work area, the R U R' U' set twists the corners, then F' puts the front face back.",
      );
    },
    get why() {
      return tr(
        "Bọc bộ bốn nước giữa F và F' giúp đổi hướng các góc phía trước mà khối trái vẫn trở về nguyên vẹn khi kết thúc.",
        "Wrapping the four-move set between F and F' changes the orientation of the front corners, and the left block is whole again at the end.",
      );
    },
  },
  {
    moves: "R U R' U'",
    get title() {
      return tr("Bộ bốn nước R U R' U'", "The four-move set R U R' U'");
    },
    get what() {
      return tr(
        "R kéo một cột ra, U xoay tầng trên, R' trả cột về, U' xoay lại. Bộ này chỉ động vào khối phải và tầng trên.",
        "R pulls a column out, U turns the top layer, R' puts the column back, U' turns back. This set only touches the right block and the top layer.",
      );
    },
    get why() {
      return tr(
        "Lặp đủ 6 lần thì khối trở về nguyên trạng, nên lặp 1, 2, 3 lần cho các hoán vị khác nhau và an toàn với khối trái.",
        "Repeated 6 times, the cube returns to its start, so repeating it 1, 2 or 3 times gives different swaps and is safe for the left block.",
      );
    },
  },
  {
    moves: "R' F R F'",
    get title() {
      return tr("Bộ bốn nước R' F R F'", "The four-move set R' F R F'");
    },
    get what() {
      return tr(
        "Dùng mặt trước F thay cho tầng trên để xoay hướng các góc phía trước.",
        "Uses the front face F instead of the top layer to twist the front corners.",
      );
    },
  },
  {
    moves: "F R' F' R",
    get title() {
      return tr("Bộ bốn nước F R' F' R", "The four-move set F R' F' R");
    },
    get what() {
      return tr(
        "Dạng đối xứng của R' F R F': dùng mặt trước để xoay hướng các góc.",
        "The mirror form of R' F R F': uses the front face to twist the corners.",
      );
    },
  },
  {
    moves: "R U2 R'",
    get title() {
      return "R U2 R'";
    },
    get what() {
      return tr(
        "Mở cột phải, xoay đôi tầng trên để đổi chỗ hai góc đối diện, rồi đóng cột phải.",
        "Open the right column, turn the top layer twice to swap two opposite corners, then close the right column.",
      );
    },
  },
  {
    moves: "R U R'",
    get title() {
      return "R U R'";
    },
    get what() {
      return tr(
        "Mở cột phải, xoay tầng trên một nấc, đóng cột phải: đưa một góc ra khỏi chỗ cũ.",
        "Open the right column, turn the top layer once, close the right column: this moves one corner out of its old place.",
      );
    },
  },
  {
    moves: "R U' R'",
    get title() {
      return "R U' R'";
    },
    get what() {
      return tr(
        "Mở cột phải, xoay tầng trên ngược chiều, đóng cột phải.",
        "Open the right column, turn the top layer the other way, close the right column.",
      );
    },
  },
  {
    moves: "L' U' L",
    get title() {
      return "L' U' L";
    },
    get what() {
      return tr(
        "Làm việc giống R U R' nhưng ở phía trái (khối trái tạm thời được mở).",
        "Does the same job as R U R' but on the left side (the left block is opened for a moment).",
      );
    },
  },
  {
    moves: "L' U L",
    get title() {
      return "L' U L";
    },
    get what() {
      return tr(
        "Mở cột trái, xoay tầng trên, đóng cột trái.",
        "Open the left column, turn the top layer, close the left column.",
      );
    },
  },
  {
    moves: "r U' r'",
    get title() {
      return "r U' r'";
    },
    get what() {
      return tr(
        "Dùng nước r (R cộng M) để mở cột phải cùng lát giữa, xoay tầng trên rồi đóng lại.",
        "Uses the move r (R plus M) to open the right column together with the middle slice, turns the top layer, then closes again.",
      );
    },
  },
  {
    moves: "r' U r",
    get title() {
      return "r' U r";
    },
    get what() {
      return tr("Dạng đảo của r U' r'.", "The reverse form of r U' r'.");
    },
  },
];

const KNOWN_BY_LEN = [...KNOWN].sort((a, b) => b.moves.split(" ").length - a.moves.split(" ").length);

/** Name of the part of the cube a move turns, in the current language. */
function layerName(move: string): string | undefined {
  switch (move) {
    case "R": return tr("cột phải", "right column");
    case "r": return tr("cột phải cùng lát giữa", "right column with the middle slice");
    case "L": return tr("cột trái", "left column");
    case "l": return tr("cột trái cùng lát giữa", "left column with the middle slice");
    case "U": return tr("tầng trên", "top layer");
    case "u": return tr("tầng trên cùng lát giữa", "top layer with the middle slice");
    case "D": return tr("tầng dưới", "bottom layer");
    case "d": return tr("tầng dưới cùng lát giữa", "bottom layer with the middle slice");
    case "F": return tr("mặt trước", "front face");
    case "f": return tr("mặt trước cùng lát giữa", "front face with the middle slice");
    case "B": return tr("mặt sau", "back face");
    case "b": return tr("mặt sau cùng lát giữa", "back face with the middle slice");
    case "M": return tr("lát giữa", "middle slice");
    case "E": return tr("lát ngang giữa", "horizontal middle slice");
    case "S": return tr("lát đứng giữa", "standing middle slice");
    default: return undefined;
  }
}

/**
 * Describe a run of moves from what really happens to the cube (computed, not guessed):
 * which parts turn, whether a block is opened or closed, and how the corner counts change.
 */
function describeRun(run: Token[], before: State, after: State): { what: string; why: string } {
  const layers = [...new Set(run.map((t) => layerName(t.move.name)).filter((x): x is string => Boolean(x)))];
  const a = factsOf(before);
  const b = factsOf(after);
  const effects: string[] = [];
  const blockNotes: string[] = [];
  if (a.leftBlock && !b.leftBlock) blockNotes.push(tr("mở khối trái", "open the left block"));
  if (!a.leftBlock && b.leftBlock) blockNotes.push(tr("đóng lại khối trái", "close the left block again"));
  if (a.rightBlock && !b.rightBlock) blockNotes.push(tr("mở khối phải", "open the right block"));
  if (!a.rightBlock && b.rightBlock) blockNotes.push(tr("đóng lại khối phải", "close the right block again"));
  effects.push(...blockNotes);
  if (a.orientedCorners !== b.orientedCorners) effects.push(
      tr(
        `số góc có màu trên mặt trên đổi từ ${a.orientedCorners} thành ${b.orientedCorners}`,
        `the number of corners with the top colour on the top face changes from ${a.orientedCorners} to ${b.orientedCorners}`,
      ),
    );
  if (a.solvedCorners !== b.solvedCorners) effects.push(
      tr(
        `số góc đúng cả chỗ lẫn hướng đổi từ ${a.solvedCorners} thành ${b.solvedCorners}`,
        `the number of corners right in both place and orientation changes from ${a.solvedCorners} to ${b.solvedCorners}`,
      ),
    );
  const what = tr(
    `Xoay ${layers.length ? layers.join(", ") : "cả khối"}${effects.length ? `; kết quả: ${effects.join("; ")}` : "; chưa đổi số góc đúng hướng hay đúng chỗ ở bước này"}.`,
    `Turn the ${layers.length ? layers.join(", ") : "whole cube"}${effects.length ? `; result: ${effects.join("; ")}` : "; this step does not yet change how many corners are oriented or in place"}.`,
  );

  let why: string;
  if (a.leftBlock && a.rightBlock && (!b.leftBlock || !b.rightBlock)) {
    why = tr(
      "Muốn đổi chỗ hoặc đổi hướng góc thì phải đụng vào chỗ của chúng, nên khối được mở tạm. Các nước sau sẽ đóng lại, vì khi kết thúc cả hai khối phải nguyên vẹn để LSE làm việc.",
      "To move or twist corners you have to disturb their place, so a block is opened for a moment. Later moves close it again, because both blocks must be whole at the end for LSE to work.",
    );
  } else if ((!a.leftBlock || !a.rightBlock) && b.leftBlock && b.rightBlock) {
    why = tr(
      "Đóng lại khối đã mở tạm, để hai khối nguyên vẹn khi alg kết thúc và bước LSE sau đó không bị ảnh hưởng.",
      "Closes the block that was opened for a moment, so both blocks are whole when the alg ends and the LSE step after it is not affected.",
    );
  } else if (b.orientedCorners > a.orientedCorners) {
    why = tr(
      "Đoạn này đưa thêm góc có màu trên lên mặt trên: đây là việc cần làm trước để chỉ còn phải đổi chỗ các góc.",
      "This part brings more corners with the top colour up to the top face: this has to be done first so that only the corner swaps are left.",
    );
  } else if (b.orientedCorners < a.orientedCorners) {
    why = tr(
      "Đoạn này tạm làm lệch hướng một góc để các nước sau xoay được góc khác; kết quả cuối của cả thuật toán mới là điều cần.",
      "This part twists one corner out of orientation for a moment so later moves can twist another corner; only the final result of the whole algorithm matters.",
    );
  } else if (b.solvedCorners > a.solvedCorners) {
    why = tr(
      "Đoạn này đưa thêm một góc về đúng chỗ.",
      "This part puts one more corner in its right place.",
    );
  } else if (!a.leftBlock || !a.rightBlock) {
    why = tr(
      "Hai khối đang mở tạm; đoạn này di chuyển các mảnh bên trong vùng đang mở, rồi các nước sau trả khối về.",
      "The blocks are open for a moment; this part moves pieces inside the open area, then later moves put the blocks back.",
    );
  } else {
    why = tr(
      "Đoạn này chỉ sắp xếp lại vị trí các mảnh ở tầng trên và lát giữa; số góc đúng chưa đổi, nhưng nó chuẩn bị chỗ cho các nước sau.",
      "This part only rearranges pieces in the top layer and the middle slice; the number of correct corners does not change yet, but it prepares room for the later moves.",
    );
  }
  return { what, why };
}

export function explainChunks(tokens: Token[], states?: State[]): Chunk[] {
  const chunks: Chunk[] = [];
  let i = 0;
  while (i < tokens.length) {
    if (tokens[i].auf) {
      chunks.push({
        from: i,
        to: i + 1,
        title: tr("Xoay tầng trên để căn chỉnh", "Turn the top layer to line up"),
        what: tr(
          "Nước U này không thuộc thuật toán chính: nó chỉ xoay tầng trên cho đúng hướng nhìn mà alg cần (còn gọi là AUF).",
          "This U move is not part of the main algorithm: it only turns the top layer to the view the alg needs (also called AUF).",
        ),
        why: tokens.slice(i + 1).some((t) => !t.auf)
          ? tr(
              "Thuật toán chỉ đúng với một hướng nhìn cố định của tầng trên. Xoay trước để đưa case về đúng hướng đó.",
              "The algorithm only works for one fixed view of the top layer. Turn first to bring the case to that view.",
            )
          : tr(
              "Sau thuật toán các góc đã đúng vị trí so với nhau, chỉ cần xoay tầng trên cho khớp với các tâm.",
              "After the algorithm the corners are right relative to each other; just turn the top layer to match the centres.",
            ),
      });
      i++;
      continue;
    }
    let matched: Known | undefined;
    for (const k of KNOWN_BY_LEN) {
      const n = k.moves.split(" ").length;
      if (i + n > tokens.length) continue;
      const slice = tokens.slice(i, i + n);
      if (slice.some((t) => t.auf)) continue;
      if (slice.map((t) => t.text).join(" ") === k.moves) {
        matched = k;
        break;
      }
    }
    if (matched) {
      const n = matched.moves.split(" ").length;
      const why = matched.why ?? (states ? describeRun(tokens.slice(i, i + n), states[i], states[i + n]).why : undefined);
      chunks.push({ from: i, to: i + n, title: matched.title, what: matched.what, why });
      i += n;
      continue;
    }
    // unknown run: take moves until a known chunk starts (at most 4)
    let j = i + 1;
    while (j < tokens.length && j - i < 4 && !tokens[j].auf) {
      const startsKnown = KNOWN_BY_LEN.some((k) => {
        const n = k.moves.split(" ").length;
        return j + n <= tokens.length && tokens.slice(j, j + n).map((t) => t.text).join(" ") === k.moves;
      });
      if (startsKnown) break;
      j++;
    }
    const text = tokens.slice(i, j).map((t) => t.text).join(" ");
    const d = states ? describeRun(tokens.slice(i, j), states[i], states[j]) : undefined;
    chunks.push({
      from: i,
      to: j,
      title: text,
      what:
        d?.what ??
        tr(
          "Nhóm nước chuyển tiếp: nhìn hình bên cạnh để thấy các góc đã dịch chuyển ra sao so với bước trước.",
          "A group of transition moves: look at the picture beside it to see how the corners moved compared with the previous step.",
        ),
      why: d?.why,
    });
    i = j;
  }
  return chunks;
}

export interface Facts {
  leftBlock: boolean;
  rightBlock: boolean;
  orientedCorners: number;
  solvedCorners: number;
  cornersSolvedAfterTurn: boolean;
}

export function factsOf(state: State): Facts {
  const orientedCorners = U_CORNERS.filter((c) => state[pieceStickers(c)[0]] === 0).length;
  const solvedCorners = U_CORNERS.filter((c) => isPieceSolved(state, c)).length;
  let cur = state;
  let aligned = false;
  for (let k = 0; k < 4 && !aligned; k++) {
    aligned = U_CORNERS.every((c) => isPieceSolved(cur, c));
    cur = applyMove(cur, { name: "U", cw: 1 });
  }
  return {
    leftBlock: LEFT_BLOCK.every((p) => isPieceSolved(state, p)),
    rightBlock: RIGHT_BLOCK.every((p) => isPieceSolved(state, p)),
    orientedCorners,
    solvedCorners,
    cornersSolvedAfterTurn: aligned,
  };
}

export function factsSentence(f: Facts): string[] {
  const out: string[] = [];
  const open = [!f.leftBlock && tr("khối trái", "the left block"), !f.rightBlock && tr("khối phải", "the right block")].filter(Boolean).join(tr(" và ", " and "));
  out.push(
    f.leftBlock && f.rightBlock
      ? tr("Hai khối đang nguyên vẹn.", "Both blocks are whole.")
      : tr(
          `Đang tạm mở: ${open} (sẽ được trả lại trước khi alg kết thúc).`,
          `Open for a moment: ${open} (they will be put back before the alg ends).`,
        ),
  );
  out.push(tr(`Góc có vàng trên mặt trên: ${f.orientedCorners}/4.`, `Corners with yellow on the top face: ${f.orientedCorners}/4.`));
  out.push(
    f.cornersSolvedAfterTurn
      ? tr("Cả bốn góc đã đúng chỗ (có thể cần xoay U cho khớp).", "All four corners are in place (you may need a U turn to line them up).")
      : tr(`Góc đã đúng cả chỗ lẫn hướng: ${f.solvedCorners}/4.`, `Corners right in both place and orientation: ${f.solvedCorners}/4.`),
  );
  return out;
}
