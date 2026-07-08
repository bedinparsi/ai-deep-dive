/**
 * The lint HOOK (harness component §1.3e).
 *
 * Runs after each agent edit. Scans a proposed code change for the two conventions in
 * CLAUDE.md. Embodies "success is silent, failures are verbose": returns [] when the code
 * is clean, or a list of specific violations (with the fix) when it isn't.
 *
 * This is pure, local, deterministic code — it costs ZERO model tokens. That is the whole
 * point of a hook: cheap, reliable enforcement the model can't forget.
 */

export interface Violation {
  rule: string;
  detail: string;
  fixHint: string;
}

export function checkConventions(code: string): Violation[] {
  const violations: Violation[] = [];

  // Rule 1: no floating-point money math. Flag multiplying a *price*-ish name by a decimal.
  const floatMoney = /\b(price|amount|total|subtotal|cost)\w*\s*\*\s*\d*\.\d+/i;
  if (floatMoney.test(code)) {
    violations.push({
      rule: "integer-cents",
      detail: "Detected floating-point arithmetic on a money value.",
      fixHint:
        "Money is integer cents. Compute in cents, e.g. Math.round(priceCents * 85 / 100).",
    });
  }

  // Rule 2: no console.log in service code.
  if (/\bconsole\.log\s*\(/.test(code)) {
    violations.push({
      rule: "use-logger",
      detail: "Detected console.log in service code.",
      fixHint: "Import { logger } from './logger' and use logger.info(...) instead.",
    });
  }

  return violations;
}

/** Format violations as the verbose feedback that gets re-injected into the agent loop. */
export function formatFeedback(violations: Violation[]): string {
  return (
    "HOOK FAILED — fix these before finishing:\n" +
    violations
      .map((v, i) => `  ${i + 1}. [${v.rule}] ${v.detail}\n     Fix: ${v.fixHint}`)
      .join("\n")
  );
}
