/**
 * A deterministic, offline mock of a coding-agent model call.
 *
 * Why mocked? The PoV commits to examples that are reproducible and free to run. A live
 * model call would be non-deterministic, cost money, and require API keys. So we script
 * the "model" behavior and estimate token usage. The *harness mechanics* around the call
 * (memory files, hooks, sub-agents, ledgers) are 100% real code — that's the part that
 * matters for learning harness engineering.
 *
 * To make these examples call a real model later, replace `mockCall` with a fetch to the
 * Claude Agent SDK / Messages API and read the real usage from the response.
 */

import type { ModelName } from "./cost.js";

export interface MockResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export interface MockTurn {
  /** What the "model" produces this turn. */
  text: string;
  /** Realistic token estimates for this turn. */
  inputTokens: number;
  outputTokens: number;
}

/**
 * A scripted agent: returns pre-written turns in order. Simulates a model that reasons and
 * emits a result, without any network call.
 */
export class ScriptedAgent {
  private turns: MockTurn[];
  private i = 0;
  constructor(
    public readonly name: string,
    public readonly model: ModelName,
    turns: MockTurn[],
  ) {
    this.turns = turns;
  }

  hasNext(): boolean {
    return this.i < this.turns.length;
  }

  /** Produce the next scripted turn. */
  next(): MockTurn {
    if (!this.hasNext()) {
      throw new Error(`ScriptedAgent "${this.name}" ran out of scripted turns.`);
    }
    return this.turns[this.i++];
  }
}

/** Rough token estimate: ~4 characters per token, the common industry heuristic. */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

/** Small helper to slow output slightly so the console reads like a live run (optional). */
export async function tick(ms = 0): Promise<void> {
  if (ms > 0) await new Promise((r) => setTimeout(r, ms));
}
