// Colour-free recognition of a CMLL case. Everything is stated against the cube's own centres and against
// "the top colour" (the colour of the top centre), so it holds for any colour scheme and any shade.
import { faceOfId, pieceStickers, type Face, type State } from "../../shared/cube";
import { U_CORNER_SLOTS, orientationOf, sameColorFaces, type CmllCase, type CornerSlot } from "../data/cmll";
import { tr } from "./i18n";

export const slotName = (s: CornerSlot): string =>
  ({
    UFR: tr("trước-phải", "front-right"),
    UFL: tr("trước-trái", "front-left"),
    UBL: tr("sau-trái", "back-left"),
    UBR: tr("sau-phải", "back-right"),
  })[s];

export const faceName = (f: Face): string =>
  ({
    F: tr("trước", "front"),
    B: tr("sau", "back"),
    L: tr("trái", "left"),
    R: tr("phải", "right"),
    U: tr("trên", "top"),
    D: tr("dưới", "bottom"),
  })[f];

const sideFacesOf = (slot: CornerSlot): [Face, Face] => slot.slice(1).split("") as [Face, Face];

export interface CornerFact {
  slot: CornerSlot;
  /** the top colour is on the top face of this corner */
  upright: boolean;
  /** when it is not: the side face this corner's top-colour sticker looks at */
  twistFace?: Face;
  /** the two centres its side colours match */
  matchesCentres: [Face, Face];
  /** the slot that corner belongs to, read from those two centres */
  home: CornerSlot;
  inPlace: boolean;
}

/** One entry per top-layer corner, in the order front-right, front-left, back-left, back-right. */
export function cornerFacts(state: State): CornerFact[] {
  const ori = orientationOf(state);
  return U_CORNER_SLOTS.map((slot, k) => {
    const idx = pieceStickers(slot);
    const sides = idx.map((i) => state[i]).filter((c) => c !== 0).map((c) => faceOfId(c));
    const matches = new Set(sides);
    const home = U_CORNER_SLOTS.find((h) => sideFacesOf(h).every((f) => matches.has(f)));
    if (!home || sides.length !== 2) throw new Error(`recognize: cannot place the corner at ${slot}`);
    const upright = ori[k] === 0;
    return {
      slot,
      upright,
      twistFace: upright ? undefined : (slot.split("") as Face[])[ori[k]],
      matchesCentres: sides as [Face, Face],
      home,
      inPlace: home === slot,
    };
  });
}

/** the U turn that puts the most corners in place, and what is still wrong after it */
export interface Placement {
  /** "" when no turn is needed */
  auf: "" | "U" | "U2" | "U'";
  /** how many steps clockwise (seen from above) that turn is: 0 to 3 */
  offset: number;
  inPlace: number;
  /** the two corners that still have to swap (named by where they stand after the turn), when two are wrong */
  swap?: { a: CornerSlot; b: CornerSlot; kind: "adjacent" | "diagonal" };
  /** the same two corners named by where they stand in the picture, before that turn */
  swapNow?: { a: CornerSlot; b: CornerSlot; kind: "adjacent" | "diagonal" };
}

const AUF = ["", "U", "U2", "U'"] as const;
/** the kind of swap a case needs, which is the same however the top layer is turned */
export type SwapKind = "none" | "adjacent" | "diagonal";

export function placementOf(state: State): Placement {
  const facts = cornerFacts(state);
  const homes = facts.map((f) => U_CORNER_SLOTS.indexOf(f.home));
  // a U turn moves the corner at index i to index i + 1 (front-right, front-left, back-left, back-right)
  const score = (k: number) => facts.filter((_, i) => (i + k) % 4 === homes[i]).length;
  let k = 0;
  for (const t of [1, 2, 3]) if (score(t) > score(k)) k = t;
  const wrong = facts.map((_, i) => i).filter((i) => (i + k) % 4 !== homes[i]);
  const placement: Placement = { auf: AUF[k], offset: k, inPlace: score(k) };
  if (wrong.length === 2) {
    const kind = (wrong[0] - wrong[1] + 4) % 4 === 2 ? "diagonal" : "adjacent";
    const [a, b] = wrong.map((i) => (i + k) % 4);
    placement.swap = { a: U_CORNER_SLOTS[a], b: U_CORNER_SLOTS[b], kind };
    placement.swapNow = { a: U_CORNER_SLOTS[wrong[0]], b: U_CORNER_SLOTS[wrong[1]], kind };
  }
  return placement;
}

export const swapKindOf = (p: Placement): SwapKind => (p.inPlace === 4 ? "none" : (p.swap?.kind ?? "none"));

const kindWord = (kind: "adjacent" | "diagonal") =>
  kind === "adjacent" ? tr("kề nhau", "next to each other") : tr("chéo nhau", "diagonal to each other");

/** how far the whole top layer looks turned from the arrangement the picture is read against */
const offsetWords = (p: Placement): string =>
  p.offset === 1
    ? tr("một nấc theo chiều kim đồng hồ", "one step clockwise")
    : p.offset === 2
      ? tr("hai nấc", "two steps")
      : tr("một nấc ngược chiều kim đồng hồ", "one step counter-clockwise");

/**
 * The one-sentence result of "look only, do not turn": which corners would have to swap, or that all four are already in
 * order. It reads the picture as if the whole top layer were turned to the best place in your head; the cube stays put.
 */
export function placementSentence(p: Placement): string {
  const shift = p.offset
    ? tr(
        ` (khi hình dung cả tầng trên quay ${offsetWords(p)}, tức ${p.auf})`,
        ` (when you picture the whole top layer turned ${offsetWords(p)}, that is ${p.auf})`,
      )
    : "";
  if (p.inPlace === 4)
    return tr(
      `Cả bốn góc đã đúng chỗ so với nhau${shift}: không có góc nào cần đổi chỗ, chúng chỉ cần xoay hướng.`,
      `All four corners are already in the right order${shift}: none has to swap, they only need turning.`,
    );
  if (p.swapNow)
    return tr(
      `Hai góc ${kindWord(p.swapNow.kind)} cần đổi chỗ cho nhau, ở góc ${slotName(p.swapNow.a)} và góc ${slotName(p.swapNow.b)} trong hình; hai góc còn lại đã đúng chỗ${shift}.`,
      `Two corners ${kindWord(p.swapNow.kind)} have to swap with each other, the ${slotName(p.swapNow.a)} and ${slotName(p.swapNow.b)} corners in the picture; the other two are already in place${shift}.`,
    );
  return tr(`${p.inPlace} góc đúng chỗ.`, `${p.inPlace} corners in place.`);
}

export interface Recognition {
  /** corners that already have the top colour on top */
  uprightCount: number;
  /** only the corners that do not have the top colour on top, as they look in the picture */
  orientation: { slot: CornerSlot; text: string }[];
  /** true when all four corners have the top colour on top */
  allUpright: boolean;
  /** for each corner in the picture, the place it belongs to */
  placement: { slot: CornerSlot; text: string; inPlace: boolean }[];
  inPlaceCount: number;
  placementSummary: Placement;
  /** same-colour pairs of side stickers: headlights, and bars of the top colour */
  pairs: string[];
}

export function recognitionOf(state: State): Recognition {
  const facts = cornerFacts(state);
  const same = sameColorFaces(state);
  const pairs: string[] = [];
  const lights = same.filter((x) => x.color !== 0);
  const bars = same.filter((x) => x.color === 0);
  if (lights.length)
    pairs.push(
      tr(
        `Đèn pha (hai sticker cùng màu đứng cạnh nhau trên một mặt bên, không phải màu mặt trên): ở mặt ${lights.map((x) => x.label).join(" và ")}.`,
        `Headlights (two stickers of one colour side by side on a side face, not the top colour): on the ${lights.map((x) => x.label).join(" and ")} face.`,
      ),
    );
  if (bars.length)
    pairs.push(
      tr(
        `Thanh (hai sticker đều mang màu mặt trên, đứng cạnh nhau trên một mặt bên): ở mặt ${bars.map((x) => x.label).join(" và ")}.`,
        `Bar (two stickers that both show the top colour, side by side on a side face): on the ${bars.map((x) => x.label).join(" and ")} face.`,
      ),
    );
  if (!pairs.length) pairs.push(tr("Không có đèn pha và không có thanh: không mặt bên nào có hai sticker cùng màu đứng cạnh nhau.", "No headlights and no bar: no side face has two stickers of one colour side by side."));
  const slotPhrase = (f: CornerFact) =>
    f.inPlace
      ? tr(
          `hai màu bên hông khớp tâm ${faceName(f.matchesCentres[0])} và tâm ${faceName(f.matchesCentres[1])}, nên đang đúng chỗ`,
          `its two side colours match the ${faceName(f.matchesCentres[0])} and ${faceName(f.matchesCentres[1])} centres, so it stands in its own place`,
        )
      : tr(
          `hai màu bên hông khớp tâm ${faceName(f.matchesCentres[0])} và tâm ${faceName(f.matchesCentres[1])}, nên thuộc chỗ ${slotName(f.home)}`,
          `its two side colours match the ${faceName(f.matchesCentres[0])} and ${faceName(f.matchesCentres[1])} centres, so it belongs at ${slotName(f.home)}`,
        );
  return {
    uprightCount: facts.filter((f) => f.upright).length,
    allUpright: facts.every((f) => f.upright),
    orientation: facts
      .filter((f) => !f.upright)
      .map((f) => ({
        slot: f.slot,
        text: tr(`màu mặt trên quay sang mặt ${faceName(f.twistFace!)}`, `the top colour turns to the ${faceName(f.twistFace!)} face`),
      })),
    placement: facts.map((f) => ({ slot: f.slot, inPlace: f.inPlace, text: slotPhrase(f) })),
    inPlaceCount: facts.filter((f) => f.inPlace).length,
    placementSummary: placementOf(state),
    pairs,
  };
}

/** short plain words for the swap a case needs, e.g. "hai góc kề nhau đổi chỗ" */
export const swapKindWords = (kind: SwapKind): string =>
  kind === "none"
    ? tr("bốn góc đã đúng chỗ (chỉ cần xoay hướng)", "all four corners in place (they only need turning)")
    : kind === "adjacent"
      ? tr("hai góc kề nhau đổi chỗ", "two neighbouring corners swap")
      : tr("hai góc chéo nhau đổi chỗ", "two diagonal corners swap");

/** one short plain phrase for how the corners of a case sit, e.g. "hai góc kề nhau đổi chỗ: trước-trái và sau-trái" (slots as in the picture) */
export function placementPhrase(state: State): string {
  const p = placementOf(state);
  if (p.inPlace === 4) return swapKindWords("none");
  if (p.swapNow) return `${swapKindWords(p.swapNow.kind)}: ${slotName(p.swapNow.a)} ${tr("và", "and")} ${slotName(p.swapNow.b)}`;
  return tr(`${p.inPlace} góc đúng chỗ`, `${p.inPlace} corners in place`);
}

/**
 * A plain caption that tells apart every one of the 24 ways to arrange the four corners, read straight off the picture
 * with no turn imagined. Used under the tiles of the finder, where the side colours are not relied on.
 */
export function arrangementCaption(state: State): string {
  const facts = cornerFacts(state);
  const homes = facts.map((f) => U_CORNER_SLOTS.indexOf(f.home));
  const name = (i: number) => slotName(U_CORNER_SLOTS[i]);
  const fixed = homes.map((_, i) => i).filter((i) => homes[i] === i);
  // cycles of the map "corner standing at i belongs at homes[i]"
  const seen = new Set<number>();
  const cycles: number[][] = [];
  for (let i = 0; i < 4; i++) {
    if (seen.has(i) || homes[i] === i) continue;
    const cyc = [i];
    seen.add(i);
    for (let j = homes[i]; j !== i; j = homes[j]) {
      cyc.push(j);
      seen.add(j);
    }
    cycles.push(cyc);
  }
  if (!cycles.length) return tr("Cả bốn góc đúng chỗ.", "All four corners are in place.");
  const d = (homes[0] - 0 + 4) % 4;
  if (homes.every((h, i) => h === (i + d) % 4))
    return tr(
      `Bốn góc đúng thứ tự, chỉ cả tầng trên lệch chỗ: cần quay ${d === 2 ? "hai nấc (U2)" : d === 1 ? "một nấc theo chiều kim đồng hồ (U)" : "một nấc ngược chiều kim đồng hồ (U')"} để vào đúng.`,
      `The four corners are in the right order; only the whole top layer is out of place: turn it ${d === 2 ? "two steps (U2)" : d === 1 ? "one step clockwise (U)" : "one step counter-clockwise (U')"} to put it right.`,
    );
  const head = fixed.length
    ? tr(
        `${fixed.length === 1 ? "Một" : "Hai"} góc đúng chỗ (${fixed.map(name).join(", ")}). `,
        `${fixed.length === 1 ? "One corner is" : "Two corners are"} in place (${fixed.map(name).join(", ")}). `,
      )
    : tr("Không góc nào đúng chỗ. ", "No corner is in place. ");
  const parts = cycles.map((cyc) => {
    if (cyc.length === 2) {
      const [a, b] = cyc;
      const kind = (a - b + 4) % 4 === 2 ? "diagonal" : "adjacent";
      return tr(
        `Hai góc ${kindWord(kind)} đổi chỗ cho nhau: ${name(a)} và ${name(b)}.`,
        `Two corners ${kindWord(kind)} swap: ${name(a)} and ${name(b)}.`,
      );
    }
    const n = cyc.length;
    const vi = cyc.map((x, i) => `góc ${name(x)} thuộc chỗ ${name(cyc[(i + 1) % n])}`).join(", ");
    const en = cyc.map((x, i) => `the ${name(x)} corner belongs at ${name(cyc[(i + 1) % n])}`).join(", ");
    return n === 3 ? tr(`Ba góc đi vòng cho nhau: ${vi}.`, `Three corners go round: ${en}.`) : tr(`Bốn góc đi vòng cho nhau: ${vi}.`, `Four corners go round: ${en}.`);
  });
  return head + parts.join(" ");
}

/**
 * The name shown for a case. The Ruwix names are labels only; in group H the singular and the plural differ by one letter
 * (Columns: all four corners in place; Column: two corners swap), so the displayed name says which one it is.
 */
export function caseLabel(c: CmllCase): string {
  if (c.group !== "H") return c.sourceName;
  const p = placementOf(c.state);
  const kind = p.inPlace === 4 ? tr("đúng chỗ", "in place") : p.swap?.kind === "adjacent" ? tr("đổi hai góc kề", "adjacent swap") : tr("đổi hai góc chéo", "diagonal swap");
  return `${c.sourceName} (${kind})`;
}
