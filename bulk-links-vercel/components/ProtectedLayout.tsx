"use client";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/LogoutButton";

export function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-2xl shadow-xl p-6">
        <div className="flex justify-end mb-4">
          <LogoutButton />
        </div>
        {children}
      </div>
    </div>
  );
}
