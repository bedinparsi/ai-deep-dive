import { BarChart, type Bar } from "@/components/BarChart";
import { RATE_CARD, DAW_RUN, RELIABILITY_PREMIUM } from "@/lib/matrix";

export const metadata = { title: "Token Economics — Harness & Loops" };

const GROUP_COLOR = { planner: "#7ee0c0", generator: "#5b9dff", evaluator: "#f0b45b" } as const;

export default function EconomicsPage() {
  const dawBars: Bar[] = DAW_RUN.map((p) => ({
    label: p.phase,
    value: p.cost,
    color: GROUP_COLOR[p.group],
    valueLabel: `$${p.cost.toFixed(2)}`,
  }));

  const genTotal = DAW_RUN.filter((p) => p.group === "generator").reduce((s, p) => s + p.cost, 0);
  const evalTotal = DAW_RUN.filter((p) => p.group === "evaluator").reduce((s, p) => s + p.cost, 0);
  const planTotal = DAW_RUN.filter((p) => p.group === "planner").reduce((s, p) => s + p.cost, 0);
  const dawTotal = genTotal + evalTotal + planTotal;

  const premiumBars: Bar[] = RELIABILITY_PREMIUM.map((r) => ({
    label: r.approach,
    value: r.cost,
    color: r.cost > 100 ? "#5b9dff" : "#8a93a6",
    valueLabel: `$${r.cost} · ${r.duration}`,
  }));

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Token Economics</h1>
      <p className="mt-3 max-w-2xl text-slate-300">
        Honest numbers. The rate card is verified (July 2026); the two runs below are
        Anthropic&apos;s <strong className="text-white">real measured</strong> builds. The
        single most important insight:{" "}
        <strong className="text-white">generation is expensive, verification is cheap.</strong>
      </p>

      {/* Rate card */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-white">Rate card (per 1M tokens)</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-edge">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-panel2 text-left text-slate-100">
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2">Input</th>
                <th className="px-3 py-2">Output</th>
                <th className="px-3 py-2">Use it for</th>
              </tr>
            </thead>
            <tbody>
              {RATE_CARD.map((r) => (
                <tr key={r.model} className="border-t border-edge">
                  <td className="px-3 py-2 font-medium text-white">{r.model}</td>
                  <td className="px-3 py-2 font-mono text-slate-300">${r.input}</td>
                  <td className="px-3 py-2 font-mono text-slate-300">${r.output}</td>
                  <td className="px-3 py-2 text-slate-400">{r.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          Discounts to remember: batch ~50% off; prompt caching heavily discounts repeated
          input (e.g. a stable CLAUDE.md read every turn).
        </p>
      </section>

      {/* Reliability premium */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-white">The reliability premium (retro game maker)</h2>
        <p className="mt-2 text-sm text-slate-400">
          Same one-line prompt. The cheap run&apos;s core feature was broken; the harness run
          worked. ~20× the cost bought correctness.
        </p>
        <div className="mt-4 rounded-lg border border-edge bg-panel p-5">
          <BarChart bars={premiumBars} unit="$" />
        </div>
      </section>

      {/* DAW per-phase */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-white">Where the money goes (DAW build, ${dawTotal.toFixed(2)})</h2>
        <p className="mt-2 text-sm text-slate-400">
          Per-phase breakdown of Anthropic&apos;s real build. Blue = generator, green =
          planner, amber = evaluator.
        </p>
        <div className="mt-4 rounded-lg border border-edge bg-panel p-5">
          <BarChart bars={dawBars} unit="$" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Generator" value={`$${genTotal.toFixed(2)}`} pct={`${((genTotal / dawTotal) * 100).toFixed(0)}%`} color="#5b9dff" />
          <Stat label="Evaluator (QA)" value={`$${evalTotal.toFixed(2)}`} pct={`${((evalTotal / dawTotal) * 100).toFixed(0)}%`} color="#f0b45b" />
          <Stat label="Planner" value={`$${planTotal.toFixed(2)}`} pct={`${((planTotal / dawTotal) * 100).toFixed(1)}%`} color="#7ee0c0" />
        </div>
      </section>

      {/* Levers */}
      <section className="mt-10 rounded-lg border border-edge bg-panel p-5">
        <h2 className="text-lg font-semibold text-white">Cost levers you control</h2>
        <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-slate-300">
          <li><strong className="text-white">Model routing:</strong> Opus to plan, Sonnet to build, Haiku to verify/triage.</li>
          <li><strong className="text-white">Verification is cheap</strong> — spend it freely; a local test run costs zero model tokens.</li>
          <li><strong className="text-white">Context discipline:</strong> tight CLAUDE.md + focused tools lower input cost every turn.</li>
          <li><strong className="text-white">Cadence is the loop throttle:</strong> daily is pennies, per-minute is ~1,440× more.</li>
          <li><strong className="text-white">Cache stable prefixes</strong> (system prompt / CLAUDE.md).</li>
        </ul>
      </section>

      <p className="mt-8 text-xs text-muted">
        Per-example figures elsewhere in this site are realistic estimates computed exactly
        against the rate card (model calls are mocked for reproducibility). The two runs above
        are Anthropic&apos;s measurements. Measure your own workloads before committing a budget.
      </p>
    </div>
  );
}

function Stat({ label, value, pct, color }: { label: string; value: string; pct: string; color: string }) {
  return (
    <div className="rounded-lg border border-edge bg-panel2 p-4">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
        <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold text-white">{pct}</div>
      <div className="font-mono text-sm text-slate-400">{value}</div>
    </div>
  );
}
