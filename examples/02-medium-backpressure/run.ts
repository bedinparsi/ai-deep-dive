/**
 * EXAMPLE 2 (MEDIUM) — "The agent 'finishes' broken pricing code."
 *
 * Demonstrates BACK-PRESSURE: a Stop hook that runs a test subset and refuses to let the
 * agent finish while the promotion math is wrong. Success is silent; failure is verbose
 * and re-injected. The verifier is local => zero model tokens on the check itself.
 *
 * Run:  npm run ex02
 *
 * We contrast:
 *   Run A — NO back-pressure: agent self-evaluates, says "Done!", ships the bug.
 *   Run B — WITH the Stop hook: agent is forced to iterate until the tests pass.
 */

import { CostLedger, header } from "../lib/cost.js";
import { totalBuggy, totalCorrect, type Cart } from "./pricing.js";
import { runPromotionTests } from "./tests.js";
import { stopHook } from "./stopHook.js";

const TASK =
  'Add "buy 3+, 15% off" promotion to the pricing engine, stacking correctly with coupons.';

function runWithoutBackpressure(): void {
  header("RUN A — NO BACK-PRESSURE (agent grades its own work)");
  const ledger = new CostLedger();
  ledger.record({ label: "generate + self-review", model: "sonnet", inputTokens: 900, outputTokens: 350 });

  console.log("\n  Task:", TASK);
  console.log('\n  Agent: "Implemented the promotion and reviewed it. Looks correct. Done!"');

  // Reality: run the tests the agent never ran.
  const result = runPromotionTests(totalBuggy);
  console.log(`\n  Reality (tests the agent skipped): ${result.passed ? "GREEN" : "RED"}`);
  for (const f of result.failures) console.log("    " + f);
  console.log("\n  => A broken promo/coupon interaction ships. Customers who use a coupon");
  console.log("     silently lose their bulk discount. Found via support tickets later.");
  ledger.print("Run A (no back-pressure)");
}

function runWithBackpressure(): void {
  header("RUN B — WITH STOP HOOK (back-pressure gates completion)");
  const ledger = new CostLedger();

  // The agent's evolving implementation. It starts buggy, then fixes after hook feedback.
  const attempts: Array<(cart: Cart) => number> = [totalBuggy, totalBuggy, totalCorrect];
  let turn = 0;

  while (turn < attempts.length) {
    const impl = attempts[turn];
    turn++;

    // Generation cost for this attempt (input grows as failure feedback is re-injected).
    const inputTokens = 900 + (turn - 1) * 220;
    ledger.record({ label: `attempt ${turn} (generate)`, model: "sonnet", inputTokens, outputTokens: 300 });

    // The hook runs locally — no tokens.
    const outcome = stopHook(impl);
    if (outcome.allowFinish) {
      console.log(`\n  Attempt ${turn}: STOP HOOK PASSED (silent). Agent finishes.`);
      break;
    }
    console.log(`\n  Attempt ${turn}: ${outcome.feedback}`);
    console.log("  -> non-zero signal; agent keeps working.");
  }

  const finalResult = runPromotionTests(totalCorrect);
  console.log(`\n  Final tests: ${finalResult.passed ? "GREEN ✔" : "RED"}`);
  console.log("  => Correct promo-then-coupon order. The bug could NOT be shipped.");
  ledger.print("Run B (with back-pressure)");
}

function main(): void {
  runWithoutBackpressure();
  runWithBackpressure();

  header("TAKEAWAY");
  console.log(`
  The Stop hook turned an unreliable single shot into a self-correcting run. The
  check itself cost ZERO model tokens (tests run locally); only the re-injected
  failure text added input tokens. This is "verification is cheap" in miniature.

  WHY HARNESS, NOT A LOOP? Still one task — but now with iteration-until-correct.
  The harness supplies the correctness SIGNAL (the hook) that a bare model lacks.
  It becomes a LOOP only when you want this to run unattended or on a schedule —
  which is exactly Example 5 in Part 2 (/goal: run until a verifiable condition).
`);
}

main();
