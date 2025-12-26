import packageJson from '../package.json';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const version = packageJson.version;

  return (
    <footer className="mt-8 pt-6 border-t border-[color:var(--border)] text-center space-y-2">
      <div className="text-sm text-[color:var(--muted)]">
        Made with ❤️ in Teaneck, NJ
      </div>
      <div className="text-xs text-[color:var(--muted)]">
        © {currentYear} Joseph Jacobs Advertising
      </div>
      <div className="text-xs">
        <a 
          href="mailto:admin@josephjacobs.org" 
          className="text-blue-300 hover:text-blue-200 underline"
        >
          Contact Support
        </a>
      </div>
      <div className="text-xs mt-2">
        <code className="px-2 py-1 rounded bg-[color:var(--card)] border border-[color:var(--border)] text-blue-300 font-mono">
          v{version}
        </code>
      </div>
    </footer>
  );
}
