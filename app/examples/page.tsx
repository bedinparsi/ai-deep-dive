import Link from "next/link";
import { EXAMPLES } from "@/lib/examples";

export const metadata = { title: "Runnable Examples — Harness & Loops" };

export default function ExamplesPage() {
  const harness = EXAMPLES.filter((e) => e.kind === "harness");
  const loop = EXAMPLES.filter((e) => e.kind === "loop");

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Runnable Examples</h1>
      <p className="mt-3 max-w-2xl text-slate-300">
        Six mocked sandboxes (retail domain). Model calls are scripted — deterministic, free,
        no API key — while the harness/loop mechanics are real. Each run prints a live cost
        ledger computed against the verified rate card. The same code runs from the CLI in{" "}
        <code className="rounded bg-panel2 px-1 py-0.5 font-mono text-accent2">examples/</code>.
      </p>

      <Section title="Harness examples (Part 1)" items={harness} />
      <Section title="Loop examples (Part 2)" items={loop} />
    </div>
  );
}

function Section({ title, items }: { title: string; items: typeof EXAMPLES }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4 grid gap-4">
        {items.map((e) => (
          <Link
            key={e.id}
            href={`/examples/${e.id}`}
            className="block rounded-lg border border-edge bg-panel p-5 transition-colors hover:border-accent/60 hover:bg-panel2"
          >
            <div className="flex items-center gap-2">
              <span
                className={`rounded px-2 py-0.5 text-xs font-semibold ${
                  e.kind === "harness" ? "bg-accent/20 text-accent" : "bg-accent2/20 text-accent2"
                }`}
              >
                {e.tier}
              </span>
              <span className="font-semibold text-white">{e.title}</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">{e.problem}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {e.components.map((c) => (
                <span key={c} className="rounded border border-edge px-2 py-0.5 text-xs text-slate-400">
                  {c}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
