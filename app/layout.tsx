import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Harness & Loop Engineering — A PoV",
  description:
    "A point-of-view on modern AI engineering: harness engineering and modern AI loops, for retail engineering teams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 lg:pl-72">
            <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
