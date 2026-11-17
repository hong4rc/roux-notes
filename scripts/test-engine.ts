import { solvedState, applyAlg, stateKey, pieceStickers, faceOfId, parseAlg, invertAlg } from "../shared/cube";
const eq = (a: Uint8Array, b: Uint8Array) => stateKey(a) === stateKey(b);
const S = solvedState();
const assert = (c: boolean, m: string) => { if (!c) { console.error("FAIL", m); process.exitCode = 1; } else console.log("ok  ", m); };
assert(eq(applyAlg(S, "R U R' U' R U R' U' R U R' U' R U R' U' R U R' U' R U R' U'"), S), "sexy^6 = id");
assert(eq(applyAlg(S, "R R'"), S) && eq(applyAlg(S, "r r'"), S) && eq(applyAlg(S, "M M'"), S), "inverse");
assert(eq(applyAlg(S, "R2"), applyAlg(S, "R R")) && eq(applyAlg(S, "R'"), applyAlg(S, "R R R")), "R2/R'");
// R moves F's right column up to U: sticker U of UFR gets color F
const ufrU = pieceStickers("UFR")[0];
assert(faceOfId(applyAlg(S, "R")[ufrU]) === "F", "R is clockwise (F -> U)");
const ufU = pieceStickers("UF")[0];
assert(faceOfId(applyAlg(S, "U")[pieceStickers("UF")[1]]) === "R", "U is clockwise (R -> F)");
assert(eq(applyAlg(S, "r"), applyAlg(S, "R M'")), "r = R M'");
assert(eq(applyAlg(S, "x"), applyAlg(S, "R M' L'")), "x = R M' L'");
assert(eq(applyAlg(applyAlg(S, "F R U R' U' F'"), invertAlg("F R U R' U' F'")), S), "invertAlg");
// T-perm swaps UL<->UR edges & UFR<->UBR corners, rest solved
const T = applyAlg(S, "R U R' U' R' F R2 U' R' U' R U R' F'");
assert(!eq(T, S), "T-perm changes state");
assert(eq(applyAlg(T, "R U R' U' R' F R2 U' R' U' R U R' F'"), S), "T-perm is an involution");
console.log(parseAlg("r U' (R2) M'").length);
