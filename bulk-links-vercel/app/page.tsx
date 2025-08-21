"use client";
import { useEffect, useMemo, useState } from "react";
import { Label, Input, Button, Select } from "@/components/Field";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { Header } from "@/components/Header";

export default function HomePage() {
  const [longUrl, setLongUrl] = useState("");
  const [campaign, setCampaign] = useState("");
  const [date, setDate] = useState("");
  const [domain, setDomain] = useState("");
  const [domains, setDomains] = useState<string[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [pubs, setPubs] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [urlError, setUrlError] = useState<string>("");

  useEffect(() => {
    fetch("/api/pubs").then(r => r.json()).then((d) => setPubs(d.pubs || []));
    
    setDomainsLoading(true);
    fetch("/api/domains").then(r => r.json()).then((d) => {
      const domainList = d.domains || ["adtracking.link"];
      setDomains(domainList);
      setDomain(d.defaultDomain || domainList[0] || "adtracking.link");
      setDomainsLoading(false);
    }).catch(() => {
      // Fallback if domains API fails
      const fallbackDomain = "adtracking.link";
      setDomains([fallbackDomain]);
      setDomain(fallbackDomain);
      setDomainsLoading(false);
    });
  }, []);

  const selectedList = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);

  function exportToCSV() {
    if (results.length === 0) return;

    // Create CSV headers
    const headers = ['Publication', 'Campaign', 'Date', 'Slug', 'Status', 'Short URL', 'Original URL', 'Error'];
    
    // Create CSV rows
    const csvRows = results.map((r: any) => {
      return [
        r.pub || '',
        campaign || '',
        date || '',
        r.slug || '',
        r.ok ? 'Success' : 'Error',
        r.ok && r.data?.short ? r.data.short : '',
        longUrl || '',
        r.ok ? '' : (r.data?.message || r.data?.error || 'Unknown error')
      ].map(field => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const escaped = String(field).replace(/"/g, '""');
        return /[,"\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
      });
    });

    // Combine headers and rows
    const csvContent = [headers, ...csvRows]
      .map(row => row.join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bulk-links-${campaign || 'export'}-${date || new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function validateUrl(url: string): string {
    if (!url.trim()) {
      return "";
    }
    
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return "URL must start with http:// or https://";
      }
      return "";
    } catch {
      return "Please enter a valid URL starting with http:// or https://";
    }
  }

  function handleUrlChange(value: string) {
    setLongUrl(value);
    setUrlError(validateUrl(value));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validate URL before submission
    const urlValidationError = validateUrl(longUrl);
    if (urlValidationError) {
      setUrlError(urlValidationError);
      return;
    }
    
    setLoading(true);
    const selectedList = Object.keys(selected).filter((k) => selected[k]);

    const resp = await fetch("/api/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ longUrl, campaign, date, pubs: selectedList, domain }),
    });

    const data = await resp.json();
    setResults(data.results || []);
    setLoading(false);
  }

  return (
    <ProtectedLayout>
      <Header title="Bulk Link Creator" />
      <form onSubmit={onSubmit} className="mt-4">
        <Label>Long URL</Label>
        <Input 
          placeholder="https://example.com/landing?..." 
          value={longUrl} 
          onChange={(e) => handleUrlChange(e.target.value)} 
          required 
          className={urlError ? "!border-red-500 !ring-red-500" : ""}
        />
        {urlError && (
          <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <span>⚠️</span>
            {urlError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Campaign Name</Label>
            <Input placeholder="Spring Sale" value={campaign} onChange={(e) => setCampaign(e.target.value)} required />
          </div>
          <div>
            <Label>Date</Label>
            <Input placeholder="2025-08-21" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          <div>
            <Label>Domain</Label>
            <Select value={domain} onChange={(e) => setDomain(e.target.value)} disabled={domainsLoading}>
              {domainsLoading ? (
                <option>Loading domains...</option>
              ) : (
                domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))
              )}
            </Select>
            <p className="text-xs text-[color:var(--muted)]">
              {domainsLoading ? "Loading your branded domains..." : "Select from your branded domains"}
            </p>
          </div>
          <div className="md:col-span-2">
            <Label>Preview Pattern</Label>
            <Input value={`${domain || "adtracking.link"}/[campaign]-[pub]-[date]`} readOnly />
          </div>
        </div>

        <div className="mt-4">
          <Label>Select Publications</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {pubs.length === 0 && (
              <div className="text-sm text-[color:var(--muted)]">No publications configured yet. Ask an admin to add some.</div>
            )}
            {pubs.map((p) => (
              <label key={p} className="flex items-center gap-2 bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg px-3 py-2 cursor-pointer hover:bg-[color:var(--accent)]">
                <input
                  type="checkbox"
                  checked={!!selected[p]}
                  onChange={(e) => setSelected((s) => ({ ...s, [p]: e.target.checked }))}
                  className="rounded border-[color:var(--border)] text-blue-600 focus:ring-blue-500"
                />
                <span>{p}</span>
              </label>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Links"}</Button>
      </form>

      {results.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Results</h2>
            <Button onClick={exportToCSV} className="!mt-0 !bg-green-600 hover:!brightness-110">
              📊 Export CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 border-b border-[color:var(--border)]">Publication</th>
                  <th className="text-left py-2 border-b border-[color:var(--border)]">URL</th>
                  <th className="text-left py-2 border-b border-[color:var(--border)]">Status</th>
                  <th className="text-left py-2 border-b border-[color:var(--border)]">Details</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r: any, idx: number) => (
                  <tr key={idx} className="align-top">
                    <td className="py-2 border-b border-[color:var(--border)]">{r.pub}</td>
                    <td className="py-2 border-b border-[color:var(--border)]"><code>{r.slug}</code></td>
                    <td className="py-2 border-b border-[color:var(--border)]">
                      {r.ok ? <span className="text-green-400 font-semibold">Created</span> : <span className="text-red-400 font-semibold">Error</span>}
                    </td>
                    <td className="py-2 border-b border-[color:var(--border)]">
                      {r.ok && r.data?.short ? (
                        <a href={r.data.short} target="_blank" className="text-blue-300 underline">{r.data.short}</a>
                      ) : (
                        <span className="text-[color:var(--muted)]">{r.data?.message || r.data?.error || ""}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}