import { RAW_CMLL } from "../src/data/cmll-raw";
import { applyAlg, invertAlg, solvedState, stickerIndex } from "../shared/cube";
import { signatureKey, uCornerSignature } from "../shared/roux";

// states solved by U^i A U^j for every Ruwix case algorithm
const seen = new Set<string>();
const ruwix = RAW_CMLL.filter((r) => r.source === "ruwix");
for (const r of ruwix)
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const full = `${"U ".repeat(i)}${r.alg}${" U".repeat(j)}`;
      seen.add(signatureKey(uCornerSignature(applyAlg(solvedState(), invertAlg(full)))));
    }
for (let k = 0; k < 4; k++) seen.add(signatureKey(uCornerSignature(applyAlg(solvedState(), "U ".repeat(k)))));
console.log("distinct corner states covered:", seen.size, "(all possible = 24 permutations x 27 orientations = 648)");

// every state must have a 3-twist sum = 0; count by orientation shape (how many yellow stickers are on U)
const cornerU = ["UFR", "UFL", "UBL", "UBR"];
void cornerU; void stickerIndex;
