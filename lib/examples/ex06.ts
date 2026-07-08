import { CostLedger } from "../cost";
import type { Artifact, RunResult } from "./types";

interface Finding {
  id: string;
  service: "catalog" | "checkout";
  desc: string;
  autoFixable: boolean;
}

const FINDINGS: Finding[] = [
  { id: "CAT-101", service: "catalog", desc: "null SKU crashes product page", autoFixable: true },
  { id: "CHK-205", service: "checkout", desc: "coupon+promo stacking rounding bug", autoFixable: true },
  { id: "CHK-206", service: "checkout", desc: "PCI change needs security sign-off", autoFixable: false },
];

export function runEx06(): RunResult {
  const logs: string[] = [];
  const ledger = new CostLedger();
  let state = "# Overnight Loop State\n";
  let inbox = "# Human Triage Inbox (needs judgment)\n";

  logs.push("[00:30] automation fires $overnight-triage");
  ledger.record({ label: "triage skill", model: "haiku", inputTokens: 3000, outputTokens: 500 });
  logs.push(`[triage] discovered ${FINDINGS.length} findings; writing to state.md`);
  FINDINGS.forEach((f) => (state += `- ${f.id} [${f.service}] ${f.desc}\n`));

  for (const f of FINDINGS) {
    logs.push("");
    logs.push(`---- ${f.id} [${f.service}] ----`);
    if (!f.autoFixable) {
      logs.push("  not auto-fixable -> escalate to human triage inbox");
      inbox += `- ${f.id}: ${f.desc} (needs human judgment)\n`;
      state += `  - ${f.id}: ESCALATED\n`;
      continue;
    }
    logs.push(`  [worktree] git worktree add ../wt-${f.service} (isolated checkout)`);
    ledger.record({ label: `${f.id} maker`, model: "sonnet", inputTokens: 12000, outputTokens: 4000 });
    logs.push(`  maker sub-agent: draft fix for ${f.id}`);
    ledger.record({ label: `${f.id} checker`, model: "haiku", inputTokens: 6000, outputTokens: 700 });
    logs.push("  [checker] review APPROVED");
    logs.push(`  [connector] opened PR for ${f.id}, linked ticket, pinged #eng-storefront`);
    state += `  - ${f.id}: PR OPENED\n`;
  }

  const artifacts: Artifact[] = [
    { name: "state.md", content: state },
    { name: "triage-inbox.md", content: inbox },
  ];

  return {
    logs,
    ledger,
    artifacts,
    takeaway:
      "COST = findings × (maker + checker) per finding × cadence. Cadence and parallelism are the two dials you watch. HARNESS vs LOOP made concrete: each fix is a HARNESS problem; the LOOP adds discovery, scheduling, parallel isolation (worktrees), connectors, and unattended operation ACROSS fixes. STAY THE ENGINEER: the PCI change was escalated to a human, not auto-fixed.",
  };
}
