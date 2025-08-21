import { ReactNode } from "react";

export function Label({ children }: { children: ReactNode }) {
  return <label className="block mt-3 mb-1 font-semibold">{children}</label>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full px-3 py-2 rounded-xl bg-[color:var(--card)] text-[color:var(--text)] border border-[color:var(--border)] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0b1219]"
      }
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={
        "w-full min-h-[140px] px-3 py-2 rounded-xl bg-[color:var(--card)] text-[color:var(--text)] border border-[color:var(--border)] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0b1219]"
      }
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={
        "w-full px-3 py-2 rounded-xl bg-[color:var(--card)] text-[color:var(--text)] border border-[color:var(--border)] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0b1219] appearance-none bg-no-repeat bg-right-2 pr-8"
      }
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundSize: '1.5em 1.5em'
      }}
    />
  );
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:brightness-110 text-white px-4 py-2 rounded-xl font-semibold"
    />
  );
}
