/**
 * EXAMPLE 5 (MEDIUM LOOP) — "Run until the goal is actually true."
 *
 * Goal: make all tests in `inventory-sync` pass and lint clean.
 * Demonstrates the /goal primitive:
 *   - a MAKER agent fixes one failing test per iteration
 *   - a SEPARATE VERIFIER (not the maker) decides "done" — maker/checker split
 *   - a CONTINUATION hook (Ralph-loop) re-injects the goal into a FRESH context each
 *     iteration, reading state from disk — so the loop survives context limits
 *
 * Run:  npm run ex05
 */

import { CostLedger, header } from "../lib/cost.js";

// The mock inventory-sync test suite. Each test flips to passing once the maker "fixes" it.
interface TestState {
  name: string;
  passing: boolean;
}

const INITIAL_TESTS: TestState[] = [
  { name: "reserves stock on order", passing: false },
  { name: "releases stock on cancel", passing: false },
  { name: "reconciles drift nightly", passing: false },
];

let lintClean = false;

/** The GOAL condition — verifiable, written by the human. */
function goalMet(tests: TestState[]): boolean {
  return tests.every((t) => t.passing) && lintClean;
}

/** The VERIFIER (separate model): re-runs checks and reports. Local tests => cheap. */
function verifier(tests: TestState[]): { done: boolean; report: string } {
  const failing = tests.filter((t) => !t.passing).map((t) => t.name);
  const done = goalMet(tests);
  const report = done
    ? "VERIFIER: all inventory-sync tests GREEN + lint clean. Goal satisfied."
    : `VERIFIER: not done. Failing: [${failing.join(", ")}]${lintClean ? "" : " + lint dirty"}`;
  return { done, report };
}

/** The MAKER: fixes exactly one failing thing per fresh-context iteration. */
function maker(tests: TestState[]): string {
  const nextFail = tests.find((t) => !t.passing);
  if (nextFail) {
    nextFail.passing = true;
    return `MAKER: fixed "${nextFail.name}".`;
  }
  if (!lintClean) {
    lintClean = true;
    return "MAKER: fixed remaining lint issues.";
  }
  return "MAKER: nothing left to do.";
}

function main(): void {
  header("EXAMPLE 5 — RUN UNTIL GOAL (/goal: maker + separate verifier + continuation)");
  console.log('\n  GOAL: "all tests in inventory-sync pass AND lint is clean"');

  const tests = INITIAL_TESTS.map((t) => ({ ...t }));
  const ledger = new CostLedger();
  const MAX_ITERS = 8;
  let iter = 0;

  while (iter < MAX_ITERS) {
    iter++;
    console.log(`\n  --- iteration ${iter} (FRESH context; reads state from disk) ---`);

    // CONTINUATION hook cost: re-injecting the goal + current state into a clean window.
    const stateInject = 800; // goal + progress notes read from the state file each time
    // Maker does the work (Sonnet).
    ledger.record({ label: `iter ${iter} maker`, model: "sonnet", inputTokens: stateInject + 1500, outputTokens: 400 });
    console.log("  " + maker(tests));

    // Verifier decides done (Haiku, separate) — local test run is free of model tokens.
    ledger.record({ label: `iter ${iter} verifier`, model: "haiku", inputTokens: 600, outputTokens: 120 });
    const { done, report } = verifier(tests);
    console.log("  " + report);

    if (done) {
      console.log(`\n  /goal stop condition TRUE at iteration ${iter}. Loop exits.`);
      break;
    }
  }

  ledger.print("Example 5 — run until goal");

  header("TAKEAWAY");
  console.log(`
  Cost scales with iterations-to-convergence. The verifier is cheap (local tests +
  a small model); the maker carries the cost. A trustworthy stop condition therefore
  saves MONEY, not just correctness — fewer wasted iterations.

  WHY A LOOP, NOT JUST A HARNESS? Example 2 also iterated, but YOU started and watched
  it. Here the loop owns the "am I done?" decision autonomously via a SEPARATE verifier,
  and each iteration runs in a FRESH context (continuation/Ralph pattern) so it survives
  context limits. That autonomy over the stopping decision is the loop's contribution.
`);
}

main();
