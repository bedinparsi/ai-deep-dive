/**
 * A tiny, dependency-free test runner for the pricing module's promotion behavior.
 *
 * This stands in for `npm test -- pricing` restricted to the PROMOTION SUBSET. We
 * deliberately run only the relevant subset, not the whole suite — flooding the agent's
 * context with thousands of lines of passing tests is a known anti-pattern (HumanLayer).
 */

import type { Cart } from "./pricing.js";

export interface TestResult {
  passed: boolean;
  failures: string[];
}

interface Case {
  name: string;
  cart: Cart;
  expectedCents: number;
}

// A $12.00 item (1200 cents), various carts.
const CASES: Case[] = [
  { name: "qty 3, no coupon -> 15% promo", cart: { unitPriceCents: 1200, quantity: 3 }, expectedCents: 3060 },
  { name: "qty 2, no coupon -> no promo", cart: { unitPriceCents: 1200, quantity: 2 }, expectedCents: 2400 },
  {
    name: "qty 3 + 10% coupon -> promo THEN coupon",
    cart: { unitPriceCents: 1200, quantity: 3, couponPercent: 10 },
    // gross 3600 -> promo 15% => 3060 -> coupon 10% => 2754
    expectedCents: 2754,
  },
];

/** Run the promotion subset against a supplied total() implementation. */
export function runPromotionTests(total: (cart: Cart) => number): TestResult {
  const failures: string[] = [];
  for (const c of CASES) {
    const got = total(c.cart);
    if (got !== c.expectedCents) {
      failures.push(`FAIL "${c.name}": expected ${c.expectedCents} cents, got ${got}`);
    }
  }
  return { passed: failures.length === 0, failures };
}
