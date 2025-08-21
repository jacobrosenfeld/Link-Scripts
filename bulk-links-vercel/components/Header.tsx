"use client";
import { JJALogoAdaptive } from "./JJALogoAdaptive";
import { LogoutButton } from "./LogoutButton";
import { AdminButton } from "./AdminButton";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="mb-6">
      {/* Logo and Company */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[color:var(--border)]">
        <div className="flex items-center space-x-3">
          <JJALogoAdaptive className="h-10 w-auto" />
          <div>
            <div className="text-lg font-bold text-[color:var(--text)]">Joseph Jacobs Advertising</div>
            <div className="text-sm text-[color:var(--muted)]">Bulk Link Creator</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AdminButton />
          <LogoutButton />
        </div>
      </div>
      
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[color:var(--foreground)]">{title}</h1>
      </div>
    </header>
  );
}
