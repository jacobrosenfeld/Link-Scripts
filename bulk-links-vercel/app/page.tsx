"use client";
import { useEffect, useMemo, useState } from "react";
import { Label, Input, Button, Select } from "@/components/Field";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { Header } from "@/components/Header";

interface Campaign {
  id: number;
  name: string;
  public: boolean;
  rotator: boolean | string;
  list: string;
}

export default function HomePage() {
  // Format today's date as MM-DD-YY
  const getTodayFormatted = () => {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().length === 1 ? '0' + (today.getMonth() + 1) : (today.getMonth() + 1).toString();
    const day = today.getDate().toString().length === 1 ? '0' + today.getDate() : today.getDate().toString();
    const year = today.getFullYear().toString().slice(-2);
    return `${month}-${day}-${year}`;
  };

  const [longUrl, setLongUrl] = useState("");
  const [campaign, setCampaign] = useState("");
  const [date, setDate] = useState(getTodayFormatted());
  const [domain, setDomain] = useState("");
  const [domains, setDomains] = useState<string[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [pubs, setPubs] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [urlError, setUrlError] = useState<string>("");
  const [newPubName, setNewPubName] = useState("");
  const [isAddingPub, setIsAddingPub] = useState(false);
  const [addingPubLoading, setAddingPubLoading] = useState(false);

  // Campaign management
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<number | "">("");
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignSlug, setNewCampaignSlug] = useState("");
  const [newCampaignPublic, setNewCampaignPublic] = useState(true);
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  useEffect(() => {
    fetch("/api/pubs").then(r => r.json()).then((d) => {
      const pubsData = d.pubs || [];
      // Sort alphabetically (case-insensitive) for consistent ordering
      const sortedPubs = pubsData.sort((a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase()));
      setPubs(sortedPubs);
    });
    
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

    // Load campaigns
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setCampaignsLoading(true);
    try {
      const response = await fetch("/api/campaigns");
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error("Failed to load campaigns:", error);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const createNewCampaign = async () => {
    if (!newCampaignName.trim()) return;
    
    setCreatingCampaign(true);
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCampaignName.trim(),
          slug: newCampaignSlug.trim() || undefined,
          public: newCampaignPublic,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await loadCampaigns(); // Reload campaigns
        setSelectedCampaign(data.campaign.id); // Auto-select the new campaign
        setCampaign(newCampaignName.trim()); // Set the campaign name in the old field too
        setShowNewCampaign(false);
        setNewCampaignName("");
        setNewCampaignSlug("");
        setNewCampaignPublic(true);
      } else {
        const errorData = await response.json();
        alert(`Failed to create campaign: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to create campaign:", error);
      alert("Failed to create campaign. Please try again.");
    } finally {
      setCreatingCampaign(false);
    }
  };

  const selectedList = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);

  // No need for arrangeForColumns anymore - we'll use CSS grid-auto-flow: column

  function exportToCSV() {
    if (results.length === 0) return;

    // Create CSV headers
    const headers = ['Publication', 'Campaign', 'Date', 'Short URL', 'Status', 'Original URL', 'Error'];
    
    // Create CSV rows
    const csvRows = results.map((r: any) => {
      return [
        r.pub || '',
        campaign || '',
        date || '',
        r.slug || '',
        r.ok ? 'Success' : 'Error',
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

  function startNewCampaign() {
    // Clear form fields
    setLongUrl("");
    setCampaign("");
    setDate(getTodayFormatted());
    setSelected({});
    setResults([]);
    setUrlError("");
    setLoading(false);
  }

  async function addNewPublication() {
    if (!newPubName.trim()) return;
    
    const trimmedName = newPubName.trim();
    setAddingPubLoading(true);
    
    try {
      // Create the new list locally first - add to end, don't sort yet
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
        
        // Auto-select the newly added publication
        setSelected((s) => ({ ...s, [trimmedName]: true }));
      } else {
        console.error("Failed to add publication: API response not ok", response.status);
        // Fallback to optimistic update
        setPubs(newPubsList);
        setNewPubName("");
        setIsAddingPub(false);
        setSelected((s) => ({ ...s, [trimmedName]: true }));
      }
    } catch (error) {
      console.error("Failed to add publication:", error);
      // Fallback to optimistic update
      const newPubsList = [...pubs, trimmedName];
      setPubs(newPubsList);
      setNewPubName("");
      setIsAddingPub(false);
      setSelected((s) => ({ ...s, [trimmedName]: true }));
    }
    setAddingPubLoading(false);
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

    // Check if no publishers are selected and confirm with user
    if (selectedList.length === 0) {
      const proceed = window.confirm(
        "No publications are selected. This will create a link without a publication in the URL structure. Are you sure you want to proceed?"
      );
      if (!proceed) {
        setLoading(false);
        return;
      }
    }

    try {
      let campaignId = selectedCampaign;
      
      // If no campaign is selected, create a new one
      if (selectedCampaign === "") {
        if (!campaign.trim()) {
          alert("Please enter a campaign name or select an existing campaign.");
          setLoading(false);
          return;
        }
        
        // Create new campaign first
        const campaignResponse = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: campaign.trim(),
            slug: newCampaignSlug.trim() || undefined,
            public: newCampaignPublic,
          }),
        });

        if (!campaignResponse.ok) {
          const errorData = await campaignResponse.json();
          alert(`Failed to create campaign: ${errorData.error || "Unknown error"}`);
          setLoading(false);
          return;
        }

        const campaignData = await campaignResponse.json();
        campaignId = campaignData.campaign.id;
        
        // Reload campaigns to update the list
        await loadCampaigns();
      }

      // Now create the bulk links using the shortener API
      const results = [];
      
      if (selectedList.length === 0) {
        // Single link without publication
        const response = await fetch("/api/shortener", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originalUrl: longUrl,
            name: `${campaign}${date ? `-${date}` : ""}`,
            campaign: campaignId,
            domain: domain,
          }),
        });
        
        const data = await response.json();
        if (data.ok) {
          results.push({
            pub: "No Publication",
            shortUrl: data.shortUrl,
            error: null
          });
        } else {
          results.push({
            pub: "No Publication",
            shortUrl: null,
            error: data.error || "Failed to create link"
          });
        }
      } else {
        // Create links for each selected publication
        for (const pub of selectedList) {
          const linkName = `${campaign}${pub ? `-${pub}` : ""}${date ? `-${date}` : ""}`;
          
          const response = await fetch("/api/shortener", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              originalUrl: longUrl,
              name: linkName,
              campaign: campaignId,
              domain: domain,
            }),
          });
          
          const data = await response.json();
          if (data.ok) {
            results.push({
              pub: pub,
              shortUrl: data.shortUrl,
              error: null
            });
          } else {
            results.push({
              pub: pub,
              shortUrl: null,
              error: data.error || "Failed to create link"
            });
          }
        }
      }
      
      setResults(results);
    } catch (error) {
      console.error("Error creating links:", error);
      alert("An error occurred while creating links. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedLayout>
      <Header title="Link Creator with Campaign Management" />
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
            <Label>Campaign</Label>
            <div className="space-y-2">
              <Select 
                value={selectedCampaign} 
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedCampaign(value === "" ? "" : Number(value));
                  // Update the campaign name when selecting from existing campaigns
                  if (value !== "") {
                    const selected = campaigns.find(c => c.id === Number(value));
                    if (selected) {
                      setCampaign(selected.name);
                    }
                  }
                }}
                disabled={campaignsLoading}
              >
                <option value="">Create new campaign...</option>
                {campaignsLoading ? (
                  <option disabled>Loading campaigns...</option>
                ) : (
                  campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {!c.public && "(Private)"}
                    </option>
                  ))
                )}
              </Select>
              
              {selectedCampaign === "" && (
                <div className="space-y-2">
                  <Input 
                    placeholder="Campaign Name (e.g., Spring Sale 2024)" 
                    value={campaign} 
                    onChange={(e) => setCampaign(e.target.value)} 
                    required 
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewCampaign(!showNewCampaign)}
                      disabled={!campaign.trim()}
                    >
                      {showNewCampaign ? "Hide" : "Advanced Options"}
                    </Button>
                  </div>
                  
                  {showNewCampaign && (
                    <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
                      <div>
                        <Label>Custom Campaign Slug (Optional)</Label>
                        <Input
                          placeholder="spring-sale-2024"
                          value={newCampaignSlug}
                          onChange={(e) => setNewCampaignSlug(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leave empty to auto-generate from campaign name
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="campaign-public"
                          checked={newCampaignPublic}
                          onChange={(e) => setNewCampaignPublic(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="campaign-public">Make campaign public</Label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div>
            <Label>Date</Label>
            <Input placeholder="MM-DD-YY" value={date} onChange={(e) => setDate(e.target.value)} />
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
            <Input value={
              selectedList.length > 0 
                ? `${domain || "adtracking.link"}/[Campaign]-[Publication]-[Date]`
                : `${domain || "adtracking.link"}/[Campaign]-[Date]`
            } readOnly />
            {selectedList.length === 0 && (
              <p className="text-xs text-orange-600 mt-1">No publications selected - URL will be created without publication portion of URL</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Label>Select Publications</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {pubs.length === 0 && !isAddingPub && (
              <div className="text-sm text-[color:var(--muted)] col-span-full">No publications configured yet. Ask an admin to add some.</div>
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
            
            {/* Add New Publication Box */}
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

        <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Links"}</Button>
      </form>

      {results.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Results</h2>
            <div className="flex gap-3">
              <Button onClick={startNewCampaign} className="!mt-0 !bg-blue-600 hover:!brightness-110">
                🚀 New Campaign
              </Button>
              <Button onClick={exportToCSV} className="!mt-0 !bg-green-600 hover:!brightness-110">
                📊 Export CSV
              </Button>
            </div>
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