"use client";
import { JJALogoAdaptive } from "./JJALogoAdaptive";
import { LogoutButton } from "./LogoutButton";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  title: string;
  showBackLink?: boolean;
  backHref?: string;
  backText?: string;
}

export function Header({ title, showBackLink = false, backHref = "/", backText = "Back" }: HeaderProps) {
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
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
      
      {/* Page Title and Navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        {showBackLink && (
          <a href={backHref} className="text-sm text-blue-300 underline hover:text-blue-200">
            {backText}
          </a>
        )}
      </div>
    </header>
  );
}
