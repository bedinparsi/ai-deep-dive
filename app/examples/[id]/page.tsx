import { notFound } from "next/navigation";
import Link from "next/link";
import { EXAMPLES, getExample } from "@/lib/examples";
import { ExampleRunner } from "@/components/ExampleRunner";

export function generateStaticParams() {
  return EXAMPLES.map((e) => ({ id: e.id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const e = getExample(params.id);
  return { title: e ? `${e.tier}: ${e.title}` : "Example" };
}

export default function ExampleDetail({ params }: { params: { id: string } }) {
  const e = getExample(params.id);
  if (!e) notFound();

  return (
    <div>
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`rounded px-2 py-0.5 text-xs font-semibold ${
            e.kind === "harness" ? "bg-accent/20 text-accent" : "bg-accent2/20 text-accent2"
          }`}
        >
          {e.kind} · {e.tier}
        </span>
        <span className="text-muted">Example {e.number}</span>
      </div>

      <h1 className="mt-3 text-3xl font-bold text-white">{e.title}</h1>

      <div className="mt-4 rounded-lg border border-edge bg-panel p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">The problem (plain English)</div>
        <p className="mt-1 text-slate-300">{e.problem}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {e.components.map((c) => (
            <span key={c} className="rounded border border-edge px-2 py-0.5 text-xs text-slate-400">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <ExampleRunner id={e.id} />
      </div>

      <div className="mt-8 border-t border-edge pt-4 text-sm">
        <Link href={e.docHref} className="text-accent hover:underline">
          Read the full write-up in the docs →
        </Link>
      </div>
    </div>
  );
}
