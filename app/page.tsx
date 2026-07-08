import Link from "next/link";
import { EXAMPLES } from "@/lib/examples";

function Card({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-edge bg-panel p-5 transition-colors hover:border-accent/60 hover:bg-panel2"
    >
      <div className="font-semibold text-white">{title}</div>
      <p className="mt-1 text-sm text-slate-400">{children}</p>
    </Link>
  );
}

export default function Home() {
  return (
    <div>
      <p className="text-sm font-medium text-accent">A Point-of-View for engineering leaders</p>
      <h1 className="mt-2 text-4xl font-bold leading-tight text-white">
        Harness Engineering &amp; Modern AI Loops
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
        Two disciplines have replaced hand-prompting coding agents. This PoV explains what
        they are, why they matter, and how to implement them — anchored in Claude Code and a
        retail / e-commerce domain, with six runnable examples.
      </p>

      <div className="mt-8 rounded-lg border border-edge bg-panel2 p-5 font-mono text-sm">
        <div className="text-slate-400"># the one equation everything hangs off</div>
        <div className="mt-1 text-accent2">coding agent = AI model(s) + harness</div>
        <div className="mt-3 text-slate-400"># and one floor above it</div>
        <div className="mt-1 text-accent2">loop = harness, run on a cadence, feeding itself</div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-edge bg-panel p-5">
          <div className="text-sm font-semibold uppercase tracking-wide text-accent">Harness engineering</div>
          <p className="mt-2 text-sm text-slate-300">
            Makes a <strong className="text-white">single agent run reliable</strong>: prompts,
            tools, sandbox, hooks, orchestration, observability. Solves state, verification,
            memory, and safety — problems a smarter model alone can&apos;t fix.
          </p>
        </div>
        <div className="rounded-lg border border-edge bg-panel p-5">
          <div className="text-sm font-semibold uppercase tracking-wide text-accent2">Loop engineering</div>
          <p className="mt-2 text-sm text-slate-300">
            Makes <strong className="text-white">many runs autonomous</strong>: scheduler,
            worktrees, skills, connectors, sub-agents, memory. Solves the &quot;you are the
            bottleneck&quot; problem for recurring, verifiable work.
          </p>
        </div>
      </div>

      <h2 className="mt-12 text-xl font-semibold text-white">Start here</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card href="/docs/00-executive-summary" title="Executive Summary">
          The two-layer model, the headline benchmark, and the headline cost fact in 60 seconds.
        </Card>
        <Card href="/matrix" title="Decision Matrix">
          When to use harness vs loop vs both — filter by situation and see the cost driver.
        </Card>
        <Card href="/economics" title="Token Economics">
          The verified rate card and Anthropic&apos;s real measured runs, as charts.
        </Card>
        <Card href="/examples" title="Runnable Examples">
          Six mocked sandboxes that run in your browser and print a live cost ledger.
        </Card>
      </div>

      <h2 className="mt-12 text-xl font-semibold text-white">The six examples</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {EXAMPLES.map((e) => (
          <Link
            key={e.id}
            href={`/examples/${e.id}`}
            className="flex items-start gap-3 rounded-lg border border-edge bg-panel p-4 transition-colors hover:border-accent/60"
          >
            <span
              className={`mt-0.5 rounded px-2 py-0.5 text-xs font-semibold ${
                e.kind === "harness" ? "bg-accent/20 text-accent" : "bg-accent2/20 text-accent2"
              }`}
            >
              {e.kind}
            </span>
            <span>
              <span className="text-sm font-medium text-white">
                {e.tier}: {e.title}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
