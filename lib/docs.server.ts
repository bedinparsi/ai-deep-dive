import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DOCS, type DocMeta } from "./docs";

export function getDoc(slug: string): { meta: DocMeta; content: string } | null {
  const meta = DOCS.find((d) => d.slug === slug);
  if (!meta) return null;
  const path = join(process.cwd(), "docs", meta.file);
  let content = readFileSync(path, "utf8");
  // Rewrite inter-doc markdown links to site routes so navigation works inside the app.
  content = content
    .replace(/\]\((?:\.\/)?(\d{2}-[a-z0-9-]+)\.md\)/g, "](/docs/$1)")
    .replace(/\]\(docs\/(\d{2}-[a-z0-9-]+)\.md\)/g, "](/docs/$1)");
  return { meta, content };
}
