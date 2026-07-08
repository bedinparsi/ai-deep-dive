/**
 * Dependency-free horizontal bar chart (pure CSS/flex). Server-renderable.
 */

export interface Bar {
  label: string;
  value: number;
  color?: string;
  valueLabel?: string;
}

export function BarChart({ bars, unit = "" }: { bars: Bar[]; unit?: string }) {
  const max = Math.max(...bars.map((b) => b.value), 0.0001);
  return (
    <div className="space-y-2">
      {bars.map((b) => {
        const pct = (b.value / max) * 100;
        return (
          <div key={b.label} className="flex items-center gap-3">
            <div className="w-40 shrink-0 truncate text-right text-xs text-slate-400" title={b.label}>
              {b.label}
            </div>
            <div className="relative h-6 flex-1 overflow-hidden rounded bg-panel2">
              <div
                className="h-full rounded"
                style={{ width: `${Math.max(pct, 1.5)}%`, backgroundColor: b.color ?? "#5b9dff" }}
              />
            </div>
            <div className="w-24 shrink-0 font-mono text-xs text-slate-300">
              {b.valueLabel ?? `${unit}${b.value.toLocaleString()}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
