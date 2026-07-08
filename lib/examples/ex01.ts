import { CostLedger, estimateTokens } from "../cost";
import type { RunResult } from "./types";

const TASK = "Apply a 15% discount to the cart subtotal and log the result.";

const CLAUDE_MD = `# Checkout Service — Agent Guide
## Money
- Money is ALWAYS integer cents (never floating-point dollars).
## Logging
- Use the shared logger. Never console.log in service code.`;

const BAD_CODE = `export function applyDiscount(subtotal) {
  const discounted = subtotal * 0.85;      // float dollars — WRONG here
  console.log("discounted:", discounted);  // console.log — WRONG here
  return discounted;
}`;

const GOOD_CODE = `import { logger } from "./logger";
export function applyDiscount(subtotalCents: number): number {
  const discountedCents = Math.round((subtotalCents * 85) / 100); // integer cents
  logger.info("discounted", { discountedCents });
  return discountedCents;
}`;

interface Violation {
  rule: string;
  detail: string;
}

function check(code: string): Violation[] {
  const v: Violation[] = [];
  if (/\b(price|amount|total|subtotal|cost)\w*\s*\*\s*\d*\.\d+/i.test(code))
    v.push({ rule: "integer-cents", detail: "floating-point money math detected" });
  if (/\bconsole\.log\s*\(/.test(code))
    v.push({ rule: "use-logger", detail: "console.log in service code" });
  return v;
}

export function runEx01(): RunResult {
  const logs: string[] = [];
  const ledger = new CostLedger();

  logs.push("RUN A — NO HARNESS (bare model)");
  ledger.record({ label: "single turn", model: "sonnet", inputTokens: estimateTokens(TASK), outputTokens: estimateTokens(BAD_CODE) });
  logs.push(`  Task: ${TASK}`);
  logs.push("  Output accepted with no checks:");
  logs.push(...BAD_CODE.split("\n").map((l) => "    " + l));
  const bad = check(BAD_CODE);
  logs.push(`  Reality check: ${bad.length} bug(s): ${bad.map((b) => b.rule).join(", ")}`);
  logs.push("  => ships a 1-cent rounding bug + broken log aggregation.");

  logs.push("");
  logs.push("RUN B — WITH HARNESS (CLAUDE.md injected + lint hook)");
  const md = estimateTokens(CLAUDE_MD);
  logs.push(`  CLAUDE.md injected: ${md} tokens`);
  let code = BAD_CODE;
  for (let turn = 1; turn <= 3; turn++) {
    ledger.record({ label: `turn ${turn} (generate)`, model: "sonnet", inputTokens: md + estimateTokens(TASK) + (turn > 1 ? 100 : 0), outputTokens: estimateTokens(code) });
    const v = check(code);
    if (v.length === 0) {
      logs.push(`  Turn ${turn}: hook PASSED (silent). Agent may finish.`);
      break;
    }
    logs.push(`  Turn ${turn}: HOOK FAILED — ${v.map((x) => x.rule).join(", ")}; feedback re-injected.`);
    code = GOOD_CODE;
  }
  logs.push("  Final output is correct integer-cents math + logger. Zero bugs shipped.");

  return {
    logs,
    ledger,
    artifacts: [{ name: "CLAUDE.md", content: CLAUDE_MD }],
    takeaway:
      "Same model, same task. ~250 tokens/turn of CLAUDE.md + a zero-token local hook is the difference between shipping a money bug and shipping a correct change. WHY HARNESS, NOT A LOOP? Single-run reliability problem — no schedule, no autonomous iteration. A loop would be over-engineering.",
  };
}
