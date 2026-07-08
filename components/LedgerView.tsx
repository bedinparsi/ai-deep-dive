import type { LedgerLine } from "@/lib/cost";
import { usd } from "@/lib/cost";
import { BarChart, type Bar } from "./BarChart";

const MODEL_COLOR: Record<string, string> = {
  opus: "#7ee0c0",
  sonnet: "#5b9dff",
  haiku: "#f0b45b",
};

export function LedgerView({ lines }: { lines: LedgerLine[] }) {
  const totalTokens = lines.reduce((s, l) => s + l.inputTokens + l.outputTokens, 0);
  const totalUsd = lines.reduce((s, l) => s + l.costUsd, 0);

  const bars: Bar[] = lines.map((l) => ({
    label: l.label,
    value: l.costUsd,
    color: MODEL_COLOR[l.model] ?? "#5b9dff",
    valueLabel: usd(l.costUsd),
  }));

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-edge">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-panel2 text-left text-slate-100">
              <th className="px-3 py-2 font-semibold">Phase</th>
              <th className="px-3 py-2 font-semibold">Model</th>
              <th className="px-3 py-2 text-right font-semibold">In tok</th>
              <th className="px-3 py-2 text-right font-semibold">Out tok</th>
              <th className="px-3 py-2 text-right font-semibold">Cost</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-t border-edge">
                <td className="px-3 py-1.5 text-slate-200">{l.label}</td>
                <td className="px-3 py-1.5">
                  <span
                    className="rounded px-1.5 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: (MODEL_COLOR[l.model] ?? "#5b9dff") + "22", color: MODEL_COLOR[l.model] ?? "#5b9dff" }}
                  >
                    {l.model}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-slate-400">{l.inputTokens.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right font-mono text-slate-400">{l.outputTokens.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right font-mono text-slate-200">{usd(l.costUsd)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-edge bg-panel2/60">
              <td className="px-3 py-2 font-semibold text-white" colSpan={2}>TOTAL</td>
              <td className="px-3 py-2" />
              <td className="px-3 py-2 text-right font-mono text-slate-300">{totalTokens.toLocaleString()}</td>
              <td className="px-3 py-2 text-right font-mono font-semibold text-accent2">{usd(totalUsd)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="rounded-lg border border-edge bg-panel p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Cost by phase</div>
        <BarChart bars={bars} />
      </div>
    </div>
  );
}
