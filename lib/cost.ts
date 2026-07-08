/**
 * Browser-safe token/cost model — mirrors examples/lib/cost.ts.
 *
 * Rate card verified July 2026 (per 1,000,000 tokens, input / output):
 *   Opus $5/$25, Sonnet $3/$15, Haiku $1/$5.
 * See docs/research/00-sources.md (#12).
 */

export type ModelName = "opus" | "sonnet" | "haiku";

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

export function costOf(u: Usage): number {
  const r = RATE_CARD[u.model];
  return u.inputTokens * r.input + u.outputTokens * r.output;
}

/** Accumulates usage; returns structured data for React tables/charts (not console). */
export class CostLedger {
  readonly lines: LedgerLine[] = [];

  record(u: Usage): void {
    this.lines.push({ ...u, costUsd: costOf(u) });
  }

  get totalUsd(): number {
    return this.lines.reduce((s, l) => s + l.costUsd, 0);
  }

  get totalTokens(): number {
    return this.lines.reduce((s, l) => s + l.inputTokens + l.outputTokens, 0);
  }
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function usd(n: number): string {
  return `$${n.toFixed(4)}`;
}
