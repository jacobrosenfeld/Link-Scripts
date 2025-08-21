import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Bulk Link Creator",
  description: "Create bulk short links with custom slugs",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="max-w-5xl mx-auto p-6">
          <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-2xl shadow-xl p-6">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}