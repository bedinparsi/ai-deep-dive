"use client";

import { useState } from "react";
import { getExample } from "@/lib/examples";
import type { RunResult } from "@/lib/examples/types";
import { LedgerView } from "./LedgerView";

export function ExampleRunner({ id }: { id: string }) {
  const meta = getExample(id);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);

  if (!meta) return <p className="text-danger">Unknown example: {id}</p>;

  function run() {
    setRunning(true);
    // Synchronous, but simulate a beat so the UI reads like a run.
    setTimeout(() => {
      setResult(meta!.run());
      setRunning(false);
    }, 150);
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          onClick={run}
          disabled={running}
          className="rounded bg-accent px-4 py-2 text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {running ? "Running…" : result ? "Run again" : "Run example"}
        </button>
        {result && (
          <span className="text-sm text-accent2">
            Total: ${result.ledger.totalUsd.toFixed(4)} · {result.ledger.totalTokens.toLocaleString()} tokens
          </span>
        )}
      </div>

      {result && (
        <div className="mt-6 space-y-6">
          {/* Terminal-style log */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Run output</div>
            <pre className="max-h-[28rem] overflow-auto rounded-lg border border-edge bg-[#0b0d11] p-4 font-mono text-xs leading-5 text-slate-300">
              {result.logs.join("\n")}
            </pre>
          </div>

          {/* Artifacts */}
          {result.artifacts && result.artifacts.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Files written (filesystem / memory)
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.artifacts.map((a) => (
                  <div key={a.name} className="rounded-lg border border-edge bg-panel2">
                    <div className="border-b border-edge px-3 py-1.5 font-mono text-xs text-accent">{a.name}</div>
                    <pre className="max-h-56 overflow-auto p-3 font-mono text-[11px] leading-5 text-slate-300">
                      {a.content}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost ledger */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Cost ledger</div>
            <LedgerView lines={result.ledger.lines} />
          </div>

          {/* Takeaway */}
          <div className="rounded-lg border border-accent/40 bg-accent/5 p-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">Takeaway</div>
            <p className="text-sm leading-6 text-slate-200">{result.takeaway}</p>
          </div>
        </div>
      )}
    </div>
  );
}
