// Raw algorithm lists copied from two independent public sources. They are NOT trusted:
// scripts/verify-cmll.ts simulates every line and merges equivalent cases.
// Format: group | case name | algorithm (leading pre-alignment U turns are stripped on import).

export const RUWIX = `
O|Adjacent Swap|R U R' F' R U R' U' R' F R2 U' R'
O|Diagonal Swap|F R U' R' U' R U R' F' R U R' U' R' F R F'
H|Columns|R U2 R' U' R U R' U' R U' R'
H|Rows|F R U R' U' R U R' U' R U R' U' F'
H|Column|U R U2' R2' F R F' U2 R' F R F'
H|Row|U2 r U' r2' D' r U' r' D r2 U r'
Pi|Right Bar|F R U R' U' R U R' U' F'
Pi|Back Slash|U F R' F' R U2 R U' R' U R U2' R'
Pi|X Checkerboard|U' R' F R U F U' R U R' U' F'
Pi|Forward Slash|R U2 R' U' R U R' U2' R' F R F'
Pi|Columns|U' r U' r2' D' r U r' D r2 U r'
Pi|Left Bar|U' R' U' R' F R F' R U' R' U2 R
U|Forward Slash|U2 R2 D R' U2 R D' R' U2 R'
U|Back Slash|R2' D' R U2 R' D R U2 R
U|Front Row|R2' F U' F U F2 R2 U' R' F R
U|Rows|U' F R2 D R' U R D' R2' U' F'
U|X Checkerboard|U2 r U' r' U r' D' r U' r' D r
U|Back Row|U' F R U R' U' F'
T|Left Bar|U' R U R' U' R' F R F'
T|Right Bar|U L' U' L U L F' L' F
T|Rows|F R' F R2 U' R' U' R U R' F2
T|Front Row|r' U r U2' R2' F R F' R
T|Back Row|r' D' r U r' D r U' r U r'
T|Columns|r2' D' r U r' D r2 U' r' U' r
S|Left Bar|U R U R' U R U2 R'
S|X Checkerboard|U L' U2 L U2' L F' L' F
S|Forward Slash|U F R' F' R U2 R U2' R'
S|Columns|U R U R' U' R' F R F' R U R' U R U2' R'
S|Right Bar|R U R' U R' F R F' R U2' R'
S|Back Slash|U R U' L' U R' U' L
As|Right Bar|U R' U' R U' R' U2' R
As|Columns|U' R2 D R' U R D' R' U R' U' R U' R'
As|Back Slash|U' F' L F L' U2' L' U2 L
As|X Checkerboard|U' R U2' R' U2 R' F R F'
As|Forward Slash|U' L' U R U' L U R'
As|Left Bar|R' U' R U' R' U R' F R F' U R
L|Mirror|U2 F R U' R' U' R U R' F'
L|Inverse|U2 F R' F' R U R U' R'
L|Pure|R U2 R' U' R U R' U' R U R' U' R U' R'
L|Front Commutator|U2 R U2 R D R' U2 R D' R2'
L|Diagonal|R' U' R U R' F' R U R' U' R' F R2
L|Back Commutator|U R' U2 R' D' R U2 R' D R2
`;

export const SCHEOPNER = `
O|Adjacent Swap|R U R' F' R U R' U' R' F R2 U' R'
O|Diagonal Swap|F R U' R' U' R U R' F' R U R' U' R' F R F'
H|Columns|R U2 R' U' R U R' U' R U' R'
H|Single Column|U F R U' R' U R U2 R' U' R U R' U' F'
H|Single Row|r U' r2 D' r U' r' D r2 U r'
H|Rows|F R U R' U' R U R' U' R U R' U' F'
Pi|Back Row|U F R U R' U' R U R' U' F'
Pi|Rows|r U' r2 D' r U r' D r2 U r'
Pi|Up Slash|U2 F R' F' R U2 R U' R' U R U2 R'
Pi|X Checkerboard|R' F R U F U' R U R' U' F'
Pi|Down Slash|U R U2 R' U' R U R' U2 R' F R F'
Pi|Front Row|R' U' R' F R F' R U' R' U2 R
L|Adj Row|U2 R U2 R' U' R U R' U' R U R' U' R U' R'
L|Opp Row|F R U' R' U' R U R' F'
L|Opp Slash|U' R' U2 R' D' R U2 R' D R2
L|Adj Slash|R U2 R D R' U2 R D' R2
L|Opp Column|F R' F' R U R U' R'
L|Adj Column|R U2 R2 F R F' R U2 R'
U|Columns|R2 F U' F U F2 R2 U' R' F R
U|Front Row|U2 r U' r' U r' D' r U' r' D r
U|Right Column|R2 D' R U2 R' D R U2 R
U|Back Row|U' F R2 D R' U R D' R2 U' F'
U|Left Column|U2 R2 D R' U2 R D' R' U2 R'
U|Rows|U' F R U R' U' F'
T|Back Row|F R' F R2 U' R' U' R U R' F2
T|Rows|r' D' r U r' D r U' r U r'
T|Up Slash|U' R U R' U' R' F R F'
T|X Checkerboard|r' U r U2 R2 F R F' R
T|Down Slash|U L' U' L U L F' L' F
T|Front Row|U2 r2 D' r U r' D r2 U' r' U' r
S|Left Column|R U R' U R U2 R'
S|Down Slash|R U R' U' R' F R F' R U R' U R U2 R'
S|X Checkerboard|R U' L' U R' U' L
S|Up Slash|L' U2 L U2 L F' L' F
S|Columns|F R' F' R U2 R U2 R'
S|Right Column|U2 R U R' U R' F R F' R U2 R'
As|Right Column|U2 R' U' R U' R' U2 R
As|Up Slash|R2 D R' U R D' R' U R' U' R U' R'
As|Columns|F' L F L' U2 L' U2 L
As|Down Slash|R U2 R' U2 R' F R F'
As|X Checkerboard|L' U R U' L U R'
As|Left Column|U R' U' R U' R' U R' F R F' U R
`;

export interface RawCmll {
  source: "ruwix" | "scheopner";
  group: string;
  name: string;
  alg: string;
}

const isU = (t: string) => /^U(2|')?$/.test(t);

// "R2'" and "U2'" are written 2-prime on some pages: the same move as "R2"/"U2".
export function normalizeAlg(raw: string): string {
  const toks = raw
    .replace(/[()]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace("2'", "2"));
  while (toks.length && isU(toks[0])) toks.shift();
  while (toks.length && isU(toks[toks.length - 1])) toks.pop();
  return toks.join(" ");
}

function parse(source: RawCmll["source"], text: string): RawCmll[] {
  return text
    .trim()
    .split("\n")
    .map((line) => {
      const [group, name, alg] = line.split("|");
      return { source, group, name, alg: normalizeAlg(alg) };
    });
}

export const RAW_CMLL: RawCmll[] = [...parse("ruwix", RUWIX), ...parse("scheopner", SCHEOPNER)];
