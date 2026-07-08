import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders documentation markdown (GFM: tables, task lists) with dark-theme styling from
 * globals.css (.doc). Internal links (/docs/..., /matrix, etc.) use Next Link for SPA
 * navigation; external links open in a new tab.
 */
export function Markdown({ content }: { content: string }) {
  return (
    <div className="doc">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const url = href ?? "#";
            // Served app routes.
            if (url.startsWith("/") || url.startsWith("#")) {
              return <Link href={url}>{children}</Link>;
            }
            // External citations open in a new tab.
            if (url.startsWith("http")) {
              return (
                <a href={url} target="_blank" rel="noreferrer noopener">
                  {children}
                </a>
              );
            }
            // Relative repo links (research/…, ../examples/) aren't served as pages;
            // render as plain text so navigation never breaks.
            return <span className="text-slate-400">{children}</span>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
