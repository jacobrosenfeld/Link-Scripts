"use client";
import { useEffect, useState } from "react";
import { Label, Input, Button, Textarea } from "@/components/Field";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { Header } from "@/components/Header";

export default function AdminPage() {
  const [pubs, setPubs] = useState<string[]>([]);
  const [raw, setRaw] = useState<string>("");
  const [saved, setSaved] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  async function load() {
    const r = await fetch("/api/pubs");
    const d = await r.json();
    console.log("Loaded pubs data:", d);
    setPubs(d?.pubs || []);
    setRaw((d?.pubs || []).join("\n"));
    console.log("Set raw state to:", (d?.pubs || []).join("\n"));
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaved("");
    setLoading(true);
    
    console.log("Raw text input:", raw);
    const processedPubs = raw.split("\n").map((s: string) => s.trim()).filter(Boolean);
    console.log("Processed pubs array:", processedPubs);
    
    // Sort alphabetically (case-insensitive)
    const sortedPubs = processedPubs.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    console.log("Sorted pubs array:", sortedPubs);
    
    try {
      const r = await fetch("/api/pubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pubs: sortedPubs })
      });
      
      if (r.ok) {
        setSaved("Saved ✔");
        await load();
      } else {
        const d = await r.json().catch(() => ({}));
        setSaved(`Error: ${d?.message || r.status}`);
      }
    } catch (error) {
      setSaved(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedLayout>
      <Header title="Admin • Publications" />
      
      <div className="mt-4">
        <div className="md:col-span-2">
          <Label>Publications (one per line)</Label>
          <Textarea 
            value={raw} 
            onChange={(e) => {
              console.log("Textarea changed to:", e.target.value);
              setRaw(e.target.value);
            }} 
            placeholder="facebook&#10;google&#10;newsletter" 
          />
          <div className="text-xs text-[color:var(--muted)] mt-1">These will appear as checkboxes on the main form.</div>
          
          <div className="mt-4 flex items-center gap-4">
            <Button onClick={save} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
            {saved && <div className="text-sm">{saved}</div>}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Label>Preview</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {pubs.map((p) => (
            <div key={p} className="px-3 py-2 rounded-lg bg-[color:var(--card)] border border-[color:var(--border)] text-[color:var(--foreground)]">{p}</div>
          ))}
        </div>
      </div>
    </ProtectedLayout>
  );
}