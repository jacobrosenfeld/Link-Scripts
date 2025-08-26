"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { JJALogoAdaptive } from "./JJALogoAdaptive";
import { LogoutButton } from "./LogoutButton";
import { AdminButton } from "./AdminButton";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const pathname = usePathname();
  
  return (
    <header className="mb-6">
      {/* Logo and Company */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[color:var(--border)]">
        <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <JJALogoAdaptive className="h-10 w-auto" />
          <div>
            <div className="text-lg font-bold text-[color:var(--text)]">Joseph Jacobs Advertising</div>
            <div className="text-sm text-[color:var(--muted)]">Link Creator & Campaign Management</div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <AdminButton />
          <LogoutButton />
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex items-center gap-4 mb-4">
        <Link 
          href="/"
          className={`px-3 py-2 rounded-lg transition-colors ${
            pathname === '/' 
              ? 'bg-blue-100 text-blue-800 font-medium' 
              : 'text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--accent)]'
          }`}
        >
          Link Creator
        </Link>
        <Link 
          href="/reports"
          className={`px-3 py-2 rounded-lg transition-colors ${
            pathname === '/reports' 
              ? 'bg-blue-100 text-blue-800 font-medium' 
              : 'text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--accent)]'
          }`}
        >
          Reports
        </Link>
      </nav>
      
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[color:var(--foreground)]">{title}</h1>
      </div>
    </header>
  );
}
