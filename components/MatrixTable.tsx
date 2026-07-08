"use client";

import Link from "next/link";
import { useState } from "react";
import { MATRIX } from "@/lib/matrix";

type Filter = "all" | "harness" | "loop" | "both";

function Cell({ v }: { v: "yes" | "no" | "partial" }) {
  if (v === "yes") return <span className="text-accent2" aria-label="yes">●</span>;
  if (v === "partial") return <span className="text-warn" aria-label="partial">◐</span>;
  return <span className="text-edge" aria-label="no">—</span>;
}

export function MatrixTable() {
  const [filter, setFilter] = useState<Filter>("all");

  const rows = MATRIX.filter((r) => {
    if (filter === "all") return true;
    if (filter === "harness") return r.harness === "yes" || r.harness === "partial";
    if (filter === "loop") return r.loop === "yes" || r.loop === "partial";
    if (filter === "both") return r.both;
    return true;
  });

  const btn = (f: Filter, label: string) => (
    <button
      onClick={() => setFilter(f)}
      className={`rounded px-3 py-1.5 text-sm transition-colors ${
        filter === f ? "bg-accent text-ink font-medium" : "border border-edge text-slate-300 hover:bg-panel2"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {btn("all", "All situations")}
        {btn("harness", "Needs harness")}
        {btn("loop", "Needs loop")}
        {btn("both", "Needs both")}
      </div>

      <div className="flex gap-4 text-xs text-muted mb-2">
        <span><span className="text-accent2">●</span> yes</span>
        <span><span className="text-warn">◐</span> partial</span>
        <span><span className="text-edge">—</span> no</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-edge">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-panel2 text-left text-slate-100">
              <th className="px-3 py-2 font-semibold">Situation</th>
              <th className="px-3 py-2 text-center font-semibold">Harness</th>
              <th className="px-3 py-2 text-center font-semibold">Loop</th>
              <th className="px-3 py-2 text-center font-semibold">Both</th>
              <th className="px-3 py-2 font-semibold">Dominant cost driver</th>
              <th className="px-3 py-2 font-semibold">Est. cost/run</th>
              <th className="px-3 py-2 font-semibold">Demo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.situation} className="border-t border-edge hover:bg-panel/60">
                <td className="px-3 py-2 text-slate-200">{r.situation}</td>
                <td className="px-3 py-2 text-center"><Cell v={r.harness} /></td>
                <td className="px-3 py-2 text-center"><Cell v={r.loop} /></td>
                <td className="px-3 py-2 text-center">{r.both ? <span className="text-accent2">●</span> : <span className="text-edge">—</span>}</td>
                <td className="px-3 py-2 text-slate-400">{r.costDriver}</td>
                <td className="px-3 py-2 font-mono text-slate-300">{r.estCost}</td>
                <td className="px-3 py-2">
                  {r.demo ? (
                    <Link href={`/examples/${r.demo}`} className="text-accent hover:underline">
                      {r.demo}
                    </Link>
                  ) : (
                    <span className="text-edge">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="mt-4 text-sm text-muted">No situations match that filter.</p>}
    </div>
  );
}
