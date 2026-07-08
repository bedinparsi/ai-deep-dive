import { CostLedger } from "../cost";
import type { RunResult } from "./types";

interface Cart {
  unitPriceCents: number;
  quantity: number;
  couponPercent?: number;
}

function totalBuggy(cart: Cart): number {
  const gross = cart.unitPriceCents * cart.quantity;
  if (cart.couponPercent) return Math.round((gross * (100 - cart.couponPercent)) / 100);
  const promo = cart.quantity >= 3 ? 15 : 0;
  return Math.round((gross * (100 - promo)) / 100);
}

function totalCorrect(cart: Cart): number {
  const gross = cart.unitPriceCents * cart.quantity;
  const promo = cart.quantity >= 3 ? 15 : 0;
  const afterPromo = Math.round((gross * (100 - promo)) / 100);
  const coupon = cart.couponPercent ?? 0;
  return Math.round((afterPromo * (100 - coupon)) / 100);
}

const CASES: { name: string; cart: Cart; expected: number }[] = [
  { name: "qty 3, no coupon -> 15% promo", cart: { unitPriceCents: 1200, quantity: 3 }, expected: 3060 },
  { name: "qty 2, no coupon -> no promo", cart: { unitPriceCents: 1200, quantity: 2 }, expected: 2400 },
  { name: "qty 3 + 10% coupon -> promo THEN coupon", cart: { unitPriceCents: 1200, quantity: 3, couponPercent: 10 }, expected: 2754 },
];

function runTests(total: (c: Cart) => number): string[] {
  const fails: string[] = [];
  for (const c of CASES) {
    const got = total(c.cart);
    if (got !== c.expected) fails.push(`FAIL "${c.name}": expected ${c.expected}, got ${got}`);
  }
  return fails;
}

export function runEx02(): RunResult {
  const logs: string[] = [];
  const ledger = new CostLedger();

  logs.push("RUN A — NO BACK-PRESSURE (agent grades its own work)");
  ledger.record({ label: "generate + self-review", model: "sonnet", inputTokens: 900, outputTokens: 350 });
  logs.push('  Agent: "Implemented and reviewed it. Looks correct. Done!"');
  const skipped = runTests(totalBuggy);
  logs.push(`  Reality (tests the agent skipped): ${skipped.length ? "RED" : "GREEN"}`);
  skipped.forEach((f) => logs.push("    " + f));
  logs.push("  => broken promo/coupon interaction ships; found via support tickets.");

  logs.push("");
  logs.push("RUN B — WITH STOP HOOK (back-pressure gates completion)");
  const attempts = [totalBuggy, totalBuggy, totalCorrect];
  for (let i = 0; i < attempts.length; i++) {
    const turn = i + 1;
    ledger.record({ label: `attempt ${turn} (generate)`, model: "sonnet", inputTokens: 900 + i * 220, outputTokens: 300 });
    const fails = runTests(attempts[i]);
    if (fails.length === 0) {
      logs.push(`  Attempt ${turn}: STOP HOOK PASSED (silent). Agent finishes.`);
      break;
    }
    logs.push(`  Attempt ${turn}: STOP HOOK — tests RED, cannot finish. Feedback re-injected.`);
    fails.forEach((f) => logs.push("    " + f));
  }
  logs.push("  Final tests: GREEN. The bug could NOT be shipped.");

  return {
    logs,
    ledger,
    takeaway:
      "The Stop hook turned an unreliable single shot into a self-correcting run. The check itself cost ZERO model tokens (tests run locally). WHY HARNESS, NOT A LOOP? Still one task, but with iteration-until-correct. It becomes a loop only when it must run unattended/on a schedule (Example 5).",
  };
}
