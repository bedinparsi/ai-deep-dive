import { MatrixTable } from "@/components/MatrixTable";

export const metadata = { title: "Decision Matrix — Harness & Loops" };

export default function MatrixPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Decision Matrix</h1>
      <p className="mt-3 max-w-2xl text-slate-300">
        They stack, they don&apos;t compete. Ask two questions in order:{" "}
        <strong className="text-white">how good does this single run need to be?</strong> (how
        much harness), then <strong className="text-white">does it need to happen repeatedly,
        unattended?</strong> (whether to add a loop). Filter the situations below and follow the
        demo link to run the matching example.
      </p>

      <div className="mt-6">
        <MatrixTable />
      </div>

      <div className="mt-8 rounded-lg border border-edge bg-panel p-5">
        <h2 className="text-lg font-semibold text-white">How to break down a project</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-6 text-sm text-slate-300">
          <li><strong className="text-white">One-off or recurring?</strong> One-off → no loop. Recurring on a cadence → candidate for a loop.</li>
          <li><strong className="text-white">Is &quot;done&quot; verifiable?</strong> Tests/types/running app → back-pressure and possibly /goal. Pure taste → keep a human in the seat.</li>
          <li><strong className="text-white">Blast radius?</strong> Money/data/prod → more enforcement; if looped, escalate risky items to a human inbox.</li>
          <li><strong className="text-white">Horizon?</strong> One context window → single harnessed run. Many windows/hours → orchestration, and a loop if unattended.</li>
        </ol>
      </div>
    </div>
  );
}
