import { notFound } from "next/navigation";
import Link from "next/link";
import { DOCS } from "@/lib/docs";
import { getDoc } from "@/lib/docs.server";
import { Markdown } from "@/components/Markdown";

export function generateStaticParams() {
  return DOCS.map((d) => ({ slug: d.slug }));
}

export default function DocPage({ params }: { params: { slug: string } }) {
  const doc = getDoc(params.slug);
  if (!doc) notFound();

  const idx = DOCS.findIndex((d) => d.slug === params.slug);
  const prev = idx > 0 ? DOCS[idx - 1] : null;
  const next = idx < DOCS.length - 1 ? DOCS[idx + 1] : null;

  return (
    <article>
      <Markdown content={doc.content} />

      <nav className="mt-12 flex items-center justify-between border-t border-edge pt-6 text-sm">
        {prev ? (
          <Link href={`/docs/${prev.slug}`} className="text-accent hover:underline">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/docs/${next.slug}`} className="text-accent hover:underline">
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
