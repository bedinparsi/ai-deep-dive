/**
 * Shared token/cost model for all examples.
 *
 * Rate card verified July 2026 (per 1,000,000 tokens, input / output):
 *   - Claude Opus   : $5 in  / $25 out
 *   - Claude Sonnet : $3 in  / $15 out
 *   - Claude Haiku  : $1 in  / $5  out
 *
 * Sources cross-checked across multiple trackers; see docs/research/00-sources.md (#12).
 *
 * These examples MOCK all model calls, so token counts are realistic *estimates* for the
 * described work, not live measurements. The cost math itself is exact against the rate
 * card, which is the honest-numbers approach the PoV commits to.
 */

export type ModelName = "opus" | "sonnet" | "haiku";

/** USD per token (not per million), input and output. */
const RATE_CARD: Record<ModelName, { input: number; output: number }> = {
  opus: { input: 5 / 1_000_000, output: 25 / 1_000_000 },
  sonnet: { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  haiku: { input: 1 / 1_000_000, output: 5 / 1_000_000 },
};

export interface Usage {
  label: string;
  model: ModelName;
  inputTokens: number;
  outputTokens: number;
}

export interface LedgerLine extends Usage {
  costUsd: number;
}

/** Compute the USD cost of a single model call. */
export function costOf(usage: Usage): number {
  const rate = RATE_CARD[usage.model];
  return usage.inputTokens * rate.input + usage.outputTokens * rate.output;
}

/**
 * A tiny cost ledger that accumulates model usage and prints a readable table.
 * This is the "observability" harness component (§1.3f) made concrete.
 */
export class CostLedger {
  private lines: LedgerLine[] = [];

  record(usage: Usage): void {
    this.lines.push({ ...usage, costUsd: costOf(usage) });
  }

  get totalUsd(): number {
    return this.lines.reduce((sum, l) => sum + l.costUsd, 0);
  }

  get totalTokens(): number {
    return this.lines.reduce((sum, l) => sum + l.inputTokens + l.outputTokens, 0);
  }

  print(title: string): void {
    const usd = (n: number) => `$${n.toFixed(4)}`;
    const pad = (s: string, n: number) => s.padEnd(n);
    const padL = (s: string, n: number) => s.padStart(n);

    console.log(`\n  COST LEDGER — ${title}`);
    console.log("  " + "-".repeat(74));
    console.log(
      "  " +
        pad("Phase", 30) +
        pad("Model", 9) +
        padL("In tok", 9) +
        padL("Out tok", 9) +
        padL("Cost", 12),
    );
    console.log("  " + "-".repeat(74));
    for (const l of this.lines) {
      console.log(
        "  " +
          pad(l.label, 30) +
          pad(l.model, 9) +
          padL(l.inputTokens.toLocaleString(), 9) +
          padL(l.outputTokens.toLocaleString(), 9) +
          padL(usd(l.costUsd), 12),
      );
    }
    console.log("  " + "-".repeat(74));
    console.log(
      "  " +
        pad("TOTAL", 30) +
        pad("", 9) +
        padL("", 9) +
        padL(this.totalTokens.toLocaleString(), 9) +
        padL(usd(this.totalUsd), 12),
    );
    console.log("");
  }
}

/** Pretty section header for example output. */
export function header(text: string): void {
  console.log("\n" + "=".repeat(78));
  console.log("  " + text);
  console.log("=".repeat(78));
}
