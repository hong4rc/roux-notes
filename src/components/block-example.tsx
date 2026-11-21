// The worked example and the self-check of the two block lessons. Every scramble and move below was found and verified
// with the real engine (scripts/gen-block-examples.ts, scripts/test-block-examples.ts).
import { useMemo } from "react";
import { applyAlg, isPieceSolved, parseAlg, pieceStickers, solvedState, type State } from "../../shared/cube";
import { FIRST_BLOCK_EXAMPLE, SECOND_BLOCK_EXAMPLE } from "../data/block-examples";
import { FIRST_BLOCK_PLAN, SECOND_BLOCK_PLAN } from "../../shared/block-stages";
import { tr } from "../lib/i18n";
import { AlgStepper } from "./alg-stepper";
import { CubeIso } from "./cube-iso";
import { ALL_CENTRES, FB_PIECES, SB_PIECES } from "./pieces-iso";
import { CopyButton, Fig } from "./ui";

type Kind = "first" | "second";

const CONFIG = {
  first: {
    plan: FIRST_BLOCK_PLAN,
    example: FIRST_BLOCK_EXAMPLE,
    shown: [...FB_PIECES, ...ALL_CENTRES],
    yaw: 1,
  },
  second: {
    plan: SECOND_BLOCK_PLAN,
    example: SECOND_BLOCK_EXAMPLE,
    shown: [...FB_PIECES, ...SB_PIECES, ...ALL_CENTRES],
    yaw: 0,
  },
} as const;

const jobTitle = (kind: Kind, i: number) =>
  kind === "first"
    ? [tr("Việc 1: cạnh dưới–trái (DL)", "Job 1: the down–left edge (DL)"), tr("Việc 2: cặp trước–trái (FL + DFL)", "Job 2: the front–left pair (FL + DFL)"), tr("Việc 3: cặp sau–trái (BL + DBL)", "Job 3: the back–left pair (BL + DBL)")][i]
    : [tr("Việc 1: cạnh dưới–phải (DR)", "Job 1: the down–right edge (DR)"), tr("Việc 2: cặp sau–phải (BR + DBR)", "Job 2: the back–right pair (BR + DBR)"), tr("Việc 3: cặp trước–phải (FR + DFR)", "Job 3: the front–right pair (FR + DFR)")][i];

const jobDone = (kind: Kind, i: number) =>
  kind === "first"
    ? [tr("Cạnh DL đã nằm đúng chỗ.", "The DL edge is in place."), tr("Cặp FL + DFL đã vào, DL vẫn ở nguyên chỗ.", "The FL + DFL pair is in and DL is still in place."), tr("Khối đầu xong: ba cạnh, hai góc và tâm trái.", "First block done: three edges, two corners and the left centre.")][i]
    : [tr("Cạnh DR đã nằm đúng chỗ.", "The DR edge is in place."), tr("Cặp BR + DBR đã vào, DR vẫn ở nguyên chỗ.", "The BR + DBR pair is in and DR is still in place."), tr("Hai khối xong, và các tâm giữa đã thẳng hàng.", "Both blocks done, and the middle centres are lined up.")][i];

/** the cube with only `pieces` in colour */
function Pic({ state, pieces, yaw = 0, view, width = 130, title }: { state: State; pieces: readonly string[]; yaw?: number; view?: "above" | "below"; width?: number; title: string }) {
  const shown = useMemo(() => new Set(pieces.flatMap((p) => pieceStickers(p))), [pieces]);
  return <CubeIso state={state} yaw={yaw} view={view} width={width} ghost={(i) => !shown.has(i)} variant={`${pieces.join()}${view ?? ""}`} title={title} />;
}

function useExample(kind: Kind) {
  const { plan, example, shown, yaw } = CONFIG[kind];
  return useMemo(() => {
    const start = applyAlg(solvedState(), example.scramble);
    const states = [start];
    for (const j of example.jobs) states.push(applyAlg(states[states.length - 1], j));
    // the pieces each job must finish (plus the centres, which stay home)
    const targets = plan.jobs.map((j) => [...j.pieces, ...ALL_CENTRES, kind === "first" ? "L" : "R"]);
    return { start, states, targets, shown, yaw, example };
  }, [kind, plan, example, shown, yaw]);
}

export function BlockExample({ kind }: { kind: Kind }) {
  const { start, states, targets, shown, yaw, example } = useExample(kind);
  const alg = example.jobs.join(" ");
  const steps = example.jobs.map((j, i) => ({
    moves: parseAlg(j).length,
    title: jobTitle(kind, i),
    what: `${tr(`${parseAlg(j).length} nước`, `${parseAlg(j).length} moves`)}. ${jobDone(kind, i)}`,
  }));
  const total = parseAlg(alg).length;
  return (
    <>
      <p>
        {kind === "first"
          ? tr(
              "Đây là một lần dựng khối đầu có thật. Cube được xáo bằng scramble dưới đây, rồi máy tìm cách ngắn nhất cho từng việc nhỏ trong số ba việc ở trên.",
              "This is a real build of the first block. The cube is mixed with the scramble below, then the computer finds the shortest way for each of the three small jobs above.",
            )
          : tr(
              "Đây là một lần dựng khối thứ hai có thật. Khối đầu đã xong, phần còn lại bị xáo chỉ bằng R, r, U, M; máy tìm cách ngắn nhất cho từng việc nhỏ trong số ba việc ở trên.",
              "This is a real build of the second block. The first block is done and the rest is mixed with R, r, U and M only; the computer finds the shortest way for each of the three small jobs above.",
            )}
      </p>
      <div className="alg-row" style={{ alignItems: "center" }}>
        <span className="muted small">{kind === "first" ? tr("Scramble (làm trên cube đã giải):", "Scramble (done on a solved cube):") : tr("Scramble (cube đã có khối đầu):", "Scramble (the cube already has the first block):")}</span>
        <span className="alg" translate="no">
          {example.scramble}
        </span>
        <CopyButton text={example.scramble} />
      </div>
      <div className="callout tip">
        <div className="ttl">{tr("Bạn không cần làm giống máy", "You do not need to copy the computer")}</div>
        <p style={{ margin: 0 }}>
          {tr(
            `Máy thử mọi cách và chọn đường ngắn nhất (${total} nước cho cả khối). Người thật nhìn rồi nghĩ nên thường dùng nhiều nước hơn, và như vậy là bình thường. Mục tiêu duy nhất là khối xong, không phải giống từng nước của máy.`,
            `The computer tries every way and picks the shortest (${total} moves for the whole block). A person has to look and think and usually takes more moves, which is normal. The only goal is a finished block, not matching the computer move for move.`,
          )}
        </p>
      </div>
      <AlgStepper
        start={start}
        alg={alg}
        keep={[...shown]}
        yaw={yaw}
        steps={steps}
        startText={tr("Cube sau scramble, chưa làm việc nào", "The cube after the scramble, no job done yet")}
        doneText={kind === "first" ? tr("Khối đầu xong", "First block done") : tr("Hai khối xong", "Both blocks done")}
        factsFor={(s) => {
          const done = CONFIG[kind].plan.jobs.filter((j) => j.pieces.every((p) => isPieceSolved(s, p))).length;
          return [tr(`Đã xong ${done}/3 việc nhỏ (tính theo mảnh đang nằm đúng chỗ).`, `${done} of 3 small jobs done (counting pieces already in place).`)];
        }}
      />
      <h3>{tr("Trước và sau từng việc", "Before and after each job")}</h3>
      <p className="small muted">
        {tr("Chỉ những mảnh của việc đó được tô màu; mảnh khác tô xám. So hai hình để thấy mỗi việc đổi được gì.", "Only the pieces of that job are coloured; the others are grey. Compare the two pictures to see what each job changes.")}
      </p>
      <ol className="part-list">
        {example.jobs.map((j, i) => (
          <li key={i}>
            <div>
              <b>{jobTitle(kind, i)}</b> <span className="muted small">· <span translate="no">{j}</span></span>
            </div>
            <div className="part-pics">
              <Fig caption={tr("Trước", "Before")}>
                <Pic state={states[i]} pieces={targets[i]} yaw={yaw} title={tr(`Trước việc ${i + 1}`, `Before job ${i + 1}`)} />
              </Fig>
              <span aria-hidden="true">→</span>
              <Fig caption={tr("Sau", "After")}>
                <Pic state={states[i + 1]} pieces={targets[i]} yaw={yaw} title={tr(`Sau việc ${i + 1}`, `After job ${i + 1}`)} />
              </Fig>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

/** the finished block seen from three sides, so a learner can compare it with their own cube */
export function BlockCheckPics({ kind }: { kind: Kind }) {
  const { states, shown, yaw } = useExample(kind);
  const done = states[states.length - 1];
  const sideYaw = kind === "first" ? yaw : 3;
  return (
    <div className="figs">
      {kind === "first" ? (
        <>
          <Fig caption={tr("Từ bên trái-trước: hai hàng ba ô cùng màu (mặt trái) và nửa trái của mặt trước", "From the left-front: two rows of three squares in one colour (the left face) and the left half of the front")}>
            <Pic state={done} pieces={shown} yaw={1} width={170} title={tr("Khối đầu xong, nhìn từ trái-trước", "First block done, seen from the left-front")} />
          </Fig>
          <Fig caption={tr("Từ bên trái-sau: mặt trái và nửa trái của mặt sau", "From the left-back: the left face and the left half of the back")}>
            <Pic state={done} pieces={shown} yaw={2} width={170} title={tr("Khối đầu xong, nhìn từ trái-sau", "First block done, seen from the left-back")} />
          </Fig>
          <Fig caption={tr("Từ dưới lên: nửa trái của mặt dưới", "From underneath: the left half of the bottom")}>
            <Pic state={done} pieces={shown} yaw={1} view="below" width={170} title={tr("Khối đầu xong, nhìn từ dưới", "First block done, seen from below")} />
          </Fig>
        </>
      ) : (
        <>
          <Fig caption={tr("Từ trước-phải: hai hàng ba ô cùng màu ở mặt phải", "From the front-right: two rows of three squares in one colour on the right face")}>
            <Pic state={done} pieces={shown} yaw={0} width={170} title={tr("Hai khối xong, nhìn từ trước-phải", "Both blocks done, seen from the front-right")} />
          </Fig>
          <Fig caption={tr("Từ sau-phải: mặt phải và nửa phải của mặt sau", "From the back-right: the right face and the right half of the back")}>
            <Pic state={done} pieces={shown} yaw={sideYaw} width={170} title={tr("Hai khối xong, nhìn từ sau-phải", "Both blocks done, seen from the back-right")} />
          </Fig>
          <Fig caption={tr("Từ dưới lên: hai nửa của mặt dưới cùng màu", "From underneath: both halves of the bottom in one colour")}>
            <Pic state={done} pieces={shown} yaw={0} view="below" width={170} title={tr("Hai khối xong, nhìn từ dưới", "Both blocks done, seen from below")} />
          </Fig>
        </>
      )}
    </div>
  );
}

