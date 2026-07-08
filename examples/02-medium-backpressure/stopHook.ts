/**
 * The Stop HOOK (harness component §1.3e) — back-pressure.
 *
 * Fires when the agent tries to declare "done". It runs the promotion test subset and:
 *   - PASS  -> exit "silent": the agent is allowed to finish.
 *   - FAIL  -> return the failing test names + error text to be re-injected, and signal
 *              "keep working" (analogous to a non-zero exit code that re-engages the agent).
 *
 * "Success is silent, failures are verbose." The verifier runs LOCALLY, so it costs ZERO
 * model tokens — only the re-injected failure text costs input tokens next turn.
 */

import type { Cart } from "./pricing.js";
import { runPromotionTests } from "./tests.js";

export interface HookOutcome {
  allowFinish: boolean;
  feedback: string | null; // null on success (silent)
}

export function stopHook(total: (cart: Cart) => number): HookOutcome {
  const result = runPromotionTests(total);
  if (result.passed) {
    return { allowFinish: true, feedback: null };
  }
  const feedback =
    "STOP HOOK: promotion tests are RED — you cannot finish yet.\n" +
    result.failures.map((f) => "  " + f).join("\n") +
    "\nHint: apply the buy-3+ promo BEFORE the coupon, and make sure the promo still" +
    "\napplies when a coupon is present.";
  return { allowFinish: false, feedback };
}
