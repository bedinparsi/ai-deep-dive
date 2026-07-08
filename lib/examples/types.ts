import type { CostLedger } from "../cost";

export interface Artifact {
  name: string;
  content: string;
}

export interface RunResult {
  logs: string[];
  ledger: CostLedger;
  artifacts?: Artifact[];
  takeaway: string;
}

export interface ExampleMeta {
  id: string;
  number: number;
  kind: "harness" | "loop";
  tier: "Simple" | "Medium" | "Complex";
  title: string;
  problem: string;
  components: string[];
  docHref: string;
  run: () => RunResult;
}
