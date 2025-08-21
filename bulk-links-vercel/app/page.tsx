"use client";
import { useEffect, useMemo, useState } from "react";
import { Label, Input, Button } from "@/components/Field";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { Header } from "@/components/Header";

export default function HomePage() {
  const [longUrl, setLongUrl] = useState("");
  const [campaign, setCampaign] = useState("");
  const [date, setDate] = useState("");
  const [domain, setDomain] = useState("");
  const [pubs, setPubs] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/pubs").then(r => r.json()).then((d) => setPubs(d.pubs || []));
    fetch("/api/config").then(r => r.json()).then((d) => setDomain(d.defaultDomain));
  }, []);

  const selectedList = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResults([]);
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
        <Input placeholder="https://example.com/landing?..." value={longUrl} onChange={(e) => setLongUrl(e.target.value)} required />

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
            <Label>Custom Domain</Label>
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} />
            <p className="text-xs text-[color:var(--muted)]">Defaults to your system domain</p>
          </div>
          <div className="md:col-span-2">
            <Label>Preview Pattern</Label>
            <Input value={`${domain || "adtracking.link"}/[campaign]-[date]-[pub]`} readOnly />
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
          <h2 className="text-xl font-semibold mb-2">Results</h2>
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