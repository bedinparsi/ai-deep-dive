"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DOCS } from "@/lib/docs";
import { EXAMPLES } from "@/lib/examples";

interface NavItem {
  href: string;
  label: string;
}

const TOP: NavItem[] = [
  { href: "/", label: "Overview" },
  { href: "/matrix", label: "Decision Matrix" },
  { href: "/economics", label: "Token Economics" },
  { href: "/examples", label: "Runnable Examples" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkCls = (active: boolean) =>
    `block rounded px-3 py-1.5 text-sm transition-colors ${
      active ? "bg-accent/15 text-accent font-medium" : "text-slate-400 hover:text-slate-100 hover:bg-panel2"
    }`;

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed left-4 top-4 z-50 rounded border border-edge bg-panel px-3 py-1.5 text-sm text-slate-200 lg:hidden"
        aria-label="Toggle navigation"
      >
        Menu
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto border-r border-edge bg-panel px-4 py-6 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link href="/" className="block px-3" onClick={() => setOpen(false)}>
          <div className="text-lg font-bold text-white">Harness &amp; Loops</div>
          <div className="text-xs text-muted">A PoV for retail engineering</div>
        </Link>

        <nav className="mt-6 space-y-1">
          {TOP.map((i) => (
            <Link key={i.href} href={i.href} className={linkCls(pathname === i.href)} onClick={() => setOpen(false)}>
              {i.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6">
          <div className="px-3 text-xs font-semibold uppercase tracking-wide text-muted">Documentation</div>
          <nav className="mt-2 space-y-1">
            {DOCS.map((d) => (
              <Link
                key={d.slug}
                href={`/docs/${d.slug}`}
                className={linkCls(pathname === `/docs/${d.slug}`)}
                onClick={() => setOpen(false)}
              >
                {d.title}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          <div className="px-3 text-xs font-semibold uppercase tracking-wide text-muted">Examples</div>
          <nav className="mt-2 space-y-1">
            {EXAMPLES.map((e) => (
              <Link
                key={e.id}
                href={`/examples/${e.id}`}
                className={linkCls(pathname === `/examples/${e.id}`)}
                onClick={() => setOpen(false)}
              >
                <span className="text-muted">{e.number}.</span> {e.tier}{" "}
                <span className="text-muted">({e.kind})</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
