import { CostLedger } from "../cost";
import type { RunResult } from "./types";

interface TestState {
  name: string;
  passing: boolean;
}

export function runEx05(): RunResult {
  const logs: string[] = [];
  const ledger = new CostLedger();

  const tests: TestState[] = [
    { name: "reserves stock on order", passing: false },
    { name: "releases stock on cancel", passing: false },
    { name: "reconciles drift nightly", passing: false },
  ];
  let lintClean = false;

  const goalMet = () => tests.every((t) => t.passing) && lintClean;

  logs.push('GOAL: "all tests in inventory-sync pass AND lint is clean"');

  for (let iter = 1; iter <= 8; iter++) {
    logs.push("");
    logs.push(`--- iteration ${iter} (FRESH context; reads state from disk) ---`);

    // maker fixes one thing
    ledger.record({ label: `iter ${iter} maker`, model: "sonnet", inputTokens: 800 + 1500, outputTokens: 400 });
    const nextFail = tests.find((t) => !t.passing);
    if (nextFail) {
      nextFail.passing = true;
      logs.push(`  MAKER: fixed "${nextFail.name}".`);
    } else if (!lintClean) {
      lintClean = true;
      logs.push("  MAKER: fixed remaining lint issues.");
    }

    // separate verifier decides done
    ledger.record({ label: `iter ${iter} verifier`, model: "haiku", inputTokens: 600, outputTokens: 120 });
    if (goalMet()) {
      logs.push("  VERIFIER: all tests GREEN + lint clean. Goal satisfied.");
      logs.push("");
      logs.push(`/goal stop condition TRUE at iteration ${iter}. Loop exits.`);
      break;
    }
    const failing = tests.filter((t) => !t.passing).map((t) => t.name);
    logs.push(`  VERIFIER: not done. Failing: [${failing.join(", ")}]${lintClean ? "" : " + lint dirty"}`);
  }

  return {
    logs,
    ledger,
    takeaway:
      "Cost scales with iterations-to-convergence. Verifier is cheap; maker carries the cost, so a trustworthy stop condition saves money. WHY A LOOP, NOT JUST A HARNESS? The loop owns the 'am I done?' decision autonomously via a SEPARATE verifier, and each iteration runs in a FRESH context (continuation/Ralph pattern) so it survives context limits.",
  };
}
