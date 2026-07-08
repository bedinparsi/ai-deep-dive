/**
 * EXAMPLE 1 (SIMPLE) — "The agent keeps forgetting our money conventions."
 *
 * Demonstrates the two cheapest harness components:
 *   (a) a memory file (CLAUDE.md) injected every turn
 *   (e) a lint hook that enforces conventions, success-silent / failure-verbose
 *
 * Run:  npm run ex01   (from the examples/ folder)
 *
 * We run the SAME mock model twice:
 *   Run A — NO harness: no CLAUDE.md, no hook. The model ships a float-money bug.
 *   Run B — WITH harness: CLAUDE.md in context + hook gates completion. The bug is caught
 *           and fixed before "done".
 * The contrast is the entire lesson.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CostLedger, header } from "../lib/cost.js";
import { estimateTokens } from "../lib/mockLlm.js";
import { checkConventions, formatFeedback } from "./check.js";

const here = dirname(fileURLToPath(import.meta.url));

// The task we give the agent.
const TASK = "Apply a 15% discount to the cart subtotal and log the result.";

// What the model writes WITHOUT knowing the conventions (the natural, wrong output).
const BAD_CODE = `export function applyDiscount(subtotal) {
  const discounted = subtotal * 0.85;   // float dollars — WRONG in this codebase
  console.log("discounted:", discounted); // console.log — WRONG in this codebase
  return discounted;
}`;

// What the model writes once the conventions are in context / after hook feedback.
const GOOD_CODE = `import { logger } from "./logger";
export function applyDiscount(subtotalCents: number): number {
  const discountedCents = Math.round((subtotalCents * 85) / 100); // integer cents
  logger.info("discounted", { discountedCents });
  return discountedCents;
}`;

function runWithoutHarness(): void {
  header("RUN A — NO HARNESS (bare model, chat-box style)");
  const ledger = new CostLedger();

  // Just the task, no CLAUDE.md injected.
  const inputTokens = estimateTokens(TASK);
  const outputTokens = estimateTokens(BAD_CODE);
  ledger.record({ label: "single turn", model: "sonnet", inputTokens, outputTokens });

  console.log("\n  Task:", TASK);
  console.log("\n  Model output (accepted, no checks):\n");
  console.log(BAD_CODE.split("\n").map((l) => "    " + l).join("\n"));

  const violations = checkConventions(BAD_CODE);
  console.log(`\n  Reality check (if a human reviews later): ${violations.length} bug(s):`);
  for (const v of violations) console.log(`    - [${v.rule}] ${v.detail}`);
  console.log("\n  => Ships a 1-cent rounding bug + broken log aggregation. Caught in");
  console.log("     review 30 min later, or in prod 3 weeks later.");
  ledger.print("Run A (no harness)");
}

function runWithHarness(): void {
  header("RUN B — WITH HARNESS (CLAUDE.md injected + lint hook gating completion)");
  const ledger = new CostLedger();

  // (a) The memory file is injected into context every turn.
  const claudeMd = readFileSync(join(here, "CLAUDE.md"), "utf8");
  const claudeMdTokens = estimateTokens(claudeMd);
  console.log(`\n  CLAUDE.md injected: ${claudeMdTokens} tokens (${claudeMd.split("\n").length} lines)`);
  console.log("  Task:", TASK);

  // Turn 1: with conventions in context, the model may still slip. We simulate a slip to
  // show the hook doing its job (this is the realistic, honest case).
  let code = BAD_CODE;
  let turn = 0;
  const MAX_TURNS = 3;

  while (turn < MAX_TURNS) {
    turn++;
    const inputTokens = claudeMdTokens + estimateTokens(TASK) + (turn > 1 ? 100 : 0);
    const outputTokens = estimateTokens(code);
    ledger.record({ label: `turn ${turn} (generate)`, model: "sonnet", inputTokens, outputTokens });

    // (e) The hook runs after the edit. Success silent, failure verbose.
    const violations = checkConventions(code);
    if (violations.length === 0) {
      console.log(`\n  Turn ${turn}: hook PASSED (silent). Agent may finish.`);
      break;
    }
    console.log(`\n  Turn ${turn}: ${formatFeedback(violations)}`);
    console.log("  -> feedback re-injected; agent revises.");
    code = GOOD_CODE; // agent fixes it using the hint + CLAUDE.md
  }

  console.log("\n  Final, accepted output:\n");
  console.log(code.split("\n").map((l) => "    " + l).join("\n"));
  console.log("\n  => Correct integer-cents math + logger. Zero bugs shipped.");
  ledger.print("Run B (with harness)");
}

function main(): void {
  runWithoutHarness();
  runWithHarness();

  header("TAKEAWAY");
  console.log(`
  Same model, same task. The harness added ~250 tokens/turn of CLAUDE.md and a
  zero-token local hook. That tiny, cheap scaffolding is the difference between
  shipping a money bug and shipping a correct change.

  WHY HARNESS, NOT A LOOP? This is a single-run reliability problem — no schedule,
  no autonomous iteration. The two cheapest harness levers (a memory file + a hook)
  fully solve it. A loop would be over-engineering here. (See Part 2 for when a
  loop IS the right call.)
`);
}

main();
