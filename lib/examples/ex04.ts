import { CostLedger } from "../cost";
import type { Artifact, RunResult } from "./types";

const FEED: Record<string, { failedOrders: number; ciFailures: string[] }> = {
  "2026-07-06": { failedOrders: 3, ciFailures: ["checkout-e2e: timeout on /pay"] },
  "2026-07-07": { failedOrders: 0, ciFailures: [] },
  "2026-07-08": { failedOrders: 7, ciFailures: ["catalog-unit: null SKU", "inventory-sync: drift"] },
};

function triage(feed: (typeof FEED)[string]): { summary: string; actionable: boolean } {
  const issues: string[] = [];
  if (feed.failedOrders > 5) issues.push(`HIGH: ${feed.failedOrders} failed orders — investigate payment gateway`);
  else if (feed.failedOrders > 0) issues.push(`LOW: ${feed.failedOrders} failed orders — monitor`);
  feed.ciFailures.forEach((c) => issues.push(`CI: ${c}`));
  return { summary: issues.map((i) => "  - " + i).join("\n"), actionable: issues.length > 0 };
}

export function runEx04(): RunResult {
  const logs: string[] = [];
  const ledger = new CostLedger();
  let state = "# Triage State — Storefront\n(kept on disk; the agent forgets, the repo doesn't)\n";

  for (const date of Object.keys(FEED)) {
    const feed = FEED[date];
    logs.push(`[SCHEDULER] ${date} 06:00 — automation fires $triage-skill`);
    ledger.record({ label: `triage ${date}`, model: "haiku", inputTokens: 1200 + feed.failedOrders * 30 + feed.ciFailures.length * 120, outputTokens: 220 });
    const { summary, actionable } = triage(feed);
    if (!actionable) {
      logs.push("  [TRIAGE] all clear — run archives itself, nothing written to state.");
      continue;
    }
    state += `\n## ${date}\n${summary}\n`;
    logs.push("  [TRIAGE] findings:");
    logs.push(...summary.split("\n"));
    logs.push("  -> appended to state.md");
  }

  return {
    logs,
    ledger,
    artifacts: [{ name: "state.md", content: state }],
    takeaway:
      "COST = CADENCE × PER-RUN COST. Three daily runs cost pennies; per-minute would cost ~1,440× more. The scheduler IS the cost throttle. WHY A LOOP, NOT JUST A HARNESS? The value is recurrence without a human initiating it, and the state file lets each run build on the last.",
  };
}
