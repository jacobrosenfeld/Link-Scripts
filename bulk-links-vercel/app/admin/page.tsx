"use client";
import { useEffect, useState } from "react";
import { Label, Input, Button, Textarea } from "@/components/Field";
import { ProtectedLayout } from "@/components/ProtectedLayout";

export default function AdminPage() {
  const [pubs, setPubs] = useState<string[]>([]);
  const [raw, setRaw] = useState<string>("");
  const [saved, setSaved] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  async function load() {
    const r = await fetch("/api/pubs");
    const d = await r.json();
    setPubs(d.pubs || []);
    setRaw((d.pubs || []).join("\n"));
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaved("");
    setLoading(true);
    
    try {
      const r = await fetch("/api/pubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pubs: raw.split("\n").map((s) => s.trim()).filter(Boolean) })
      });
      
      if (r.ok) {
        setSaved("Saved ✔");
        await load();
      } else {
        const d = await r.json().catch(() => ({}));
        setSaved(`Error: ${d?.message || r.status}`);
      }
    } catch (error) {
      setSaved("Network error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedLayout>
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin • Pubs</h1>
          <a href="/" className="text-sm text-blue-300 underline">Back</a>
        </div>

      <div className="mt-4">
        <div className="md:col-span-2">
          <Label>Pubs (one per line)</Label>
          <Textarea value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="facebook&#10;google&#10;newsletter" />
          <div className="text-xs text-[color:var(--muted)] mt-1">These will appear as checkboxes on the main form.</div>
          
          <div className="mt-4 flex items-center gap-4">
            <Button onClick={save} disabled={loading}>
              {loading ? "Saving..." : "Save Pubs"}
            </Button>
            {saved && <div className="text-sm">{saved}</div>}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Label>Preview</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {pubs.map((p) => (
            <div key={p} className="px-3 py-2 rounded-lg bg-[#0b1219] border border-[color:var(--border)]">{p}</div>
          ))}
          {pubs.length === 0 && <div className="text-sm text-[color:var(--muted)]">No pubs yet.</div>}
        </div>
      </div>
      </div>
    </ProtectedLayout>
  );
}