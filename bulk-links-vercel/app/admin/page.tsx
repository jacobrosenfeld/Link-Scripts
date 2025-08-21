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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingPub, setEditingPub] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isAddingPub, setIsAddingPub] = useState(false);
  const [newPubName, setNewPubName] = useState("");
  const [addingPubLoading, setAddingPubLoading] = useState(false);

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

  async function deletePub(pubToDelete: string) {
    setDeleting(pubToDelete);
    const updatedPubs = pubs.filter(p => p !== pubToDelete);
    
    try {
      const r = await fetch("/api/pubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pubs: updatedPubs })
      });
      
      if (r.ok) {
        setPubs(updatedPubs);
        setRaw(updatedPubs.join("\n"));
        setSaved(`Deleted "${pubToDelete}" ✔`);
      } else {
        const d = await r.json().catch(() => ({}));
        setSaved(`Error deleting: ${d?.message || r.status}`);
      }
    } catch (error) {
      setSaved(`Error deleting: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setDeleting(null);
      setDeleteConfirm(null);
    }
  }

  async function editPub(oldName: string, newName: string) {
    if (!newName.trim() || newName.trim() === oldName) {
      setEditingPub(null);
      setEditValue("");
      return;
    }

    const trimmedName = newName.trim();
    const updatedPubs = pubs.map(p => p === oldName ? trimmedName : p);
    
    try {
      const r = await fetch("/api/pubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pubs: updatedPubs })
      });
      
      if (r.ok) {
        setPubs(updatedPubs);
        setRaw(updatedPubs.join("\n"));
        setSaved(`Renamed "${oldName}" to "${trimmedName}" ✔`);
      } else {
        const d = await r.json().catch(() => ({}));
        setSaved(`Error editing: ${d?.message || r.status}`);
      }
    } catch (error) {
      setSaved(`Error editing: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setEditingPub(null);
      setEditValue("");
    }
  }

  async function addNewPublication() {
    if (!newPubName.trim()) return;
    
    const trimmedName = newPubName.trim();
    setAddingPubLoading(true);
    
    try {
      // Create the new list locally first
      const newPubsList = [...pubs, trimmedName];
      
      const response = await fetch("/api/pubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pubs: newPubsList }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("API Response:", data); // Debug log
        
        // Ensure we have the expected data structure
        if (data.pubs && Array.isArray(data.pubs)) {
          setPubs(data.pubs);
        } else {
          // Fallback to our local list if API response is unexpected
          setPubs(newPubsList);
        }
        
        setNewPubName("");
        setIsAddingPub(false);
        setSaved(`Added "${trimmedName}" ✔`);
      } else {
        console.error("Failed to add publication: API response not ok", response.status);
        // Fallback to optimistic update
        setPubs([...pubs, trimmedName]);
        setNewPubName("");
        setIsAddingPub(false);
        setSaved(`Added "${trimmedName}" ✔`);
      }
    } catch (error) {
      console.error("Failed to add publication:", error);
      // Fallback to optimistic update
      setPubs([...pubs, trimmedName]);
      setNewPubName("");
      setIsAddingPub(false);
      setSaved(`Added "${trimmedName}" ✔`);
    }
    setAddingPubLoading(false);
  }

  return (
    <ProtectedLayout>
      <Header title="Admin • Publications" />
      
      <div className="mt-6">
        <Label>Publications</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
          {pubs.map((p) => (
            <div key={p} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[color:var(--card)] border border-[color:var(--border)] text-[color:var(--foreground)]">
              {editingPub === p ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        editPub(p, editValue);
                      } else if (e.key === 'Escape') {
                        setEditingPub(null);
                        setEditValue("");
                      }
                    }}
                    className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() => editPub(p, editValue)}
                    className="text-green-600 hover:text-green-700 px-1"
                    title="Save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setEditingPub(null);
                      setEditValue("");
                    }}
                    className="text-gray-500 hover:text-gray-700 px-1"
                    title="Cancel"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <span className="flex-1">{p}</span>
                  
                  {deleteConfirm === p ? (
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-xs text-red-600">Delete?</span>
                      <button
                        onClick={() => deletePub(p)}
                        disabled={deleting === p}
                        className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        title="Confirm delete"
                      >
                        {deleting === p ? "..." : "✓"}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => {
                          setEditingPub(p);
                          setEditValue(p);
                        }}
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded px-1 py-1 transition-colors"
                        title={`Edit ${p}`}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(p)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded px-1 py-1 transition-colors"
                        title={`Delete ${p}`}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          
          {/* Add Publication Feature */}
          <div className="px-3 py-2">
            {isAddingPub ? (
              <div className="flex items-center gap-2 bg-[color:var(--card)] border-2 border-dashed border-blue-400 rounded-lg px-3 py-2">
                <Input
                  value={newPubName}
                  onChange={(e) => setNewPubName(e.target.value)}
                  placeholder="Publication name"
                  className="!mt-0 !mb-0 flex-1 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addNewPublication()}
                  disabled={addingPubLoading}
                />
                <button
                  type="button"
                  onClick={addNewPublication}
                  disabled={addingPubLoading || !newPubName.trim()}
                  className="text-green-600 hover:text-green-700 disabled:opacity-50"
                  title="Save"
                >
                  {addingPubLoading ? "⏳" : "✓"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingPub(false);
                    setNewPubName("");
                  }}
                  className="text-red-600 hover:text-red-700"
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingPub(true)}
                className="flex items-center justify-center gap-2 bg-[color:var(--card)] border-2 border-dashed border-[color:var(--border)] rounded-lg px-3 py-2 cursor-pointer hover:bg-[color:var(--accent)] hover:border-blue-400 text-[color:var(--muted)] hover:text-blue-600 transition-colors"
              >
                <span className="text-lg">+</span>
                <span className="text-sm">Add Publication</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="md:col-span-2">
          <Label>Bulk Edit (one per line)</Label>
          <Textarea 
            value={raw} 
            onChange={(e) => {
              console.log("Textarea changed to:", e.target.value);
              setRaw(e.target.value);
            }} 
            placeholder="facebook&#10;google&#10;newsletter" 
          />
          <div className="text-xs text-[color:var(--muted)] mt-1">Edit publications in bulk by typing one per line, then save.</div>
          
          <div className="mt-4 flex items-center gap-4">
            <Button onClick={save} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
            {saved && <div className="text-sm">{saved}</div>}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}