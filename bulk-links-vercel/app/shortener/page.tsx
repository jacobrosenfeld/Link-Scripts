"use client";
import { useEffect, useState } from "react";
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

interface CreateLinkResult {
  ok: boolean;
  shortUrl: string;
  error?: string;
  data?: any;
}

export default function URLShortenerPage() {
  const [originalUrl, setOriginalUrl] = useState("");
  const [name, setName] = useState("");
  const [useCustomSlug, setUseCustomSlug] = useState(false);
  const [customSlug, setCustomSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [domains, setDomains] = useState<string[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<number | "">("");
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateLinkResult | null>(null);
  const [urlError, setUrlError] = useState<string>("");
  const [slugError, setSlugError] = useState<string>("");
  
  // New campaign creation
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignSlug, setNewCampaignSlug] = useState("");
  const [newCampaignPublic, setNewCampaignPublic] = useState(true);
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  useEffect(() => {
    // Load domains
    setDomainsLoading(true);
    fetch("/api/domains")
      .then(r => r.json())
      .then((d) => {
        const domainList = d.domains || ["adtracking.link"];
        setDomains(domainList);
        setDomain(d.defaultDomain || domainList[0] || "adtracking.link");
        setDomainsLoading(false);
      })
      .catch(() => {
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

  const validateUrl = (url: string): string => {
    if (!url.trim()) {
      return "URL is required";
    }
    
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return "URL must use HTTP or HTTPS protocol";
      }
      return "";
    } catch {
      return "Please enter a valid URL (e.g., https://example.com)";
    }
  };

  const validateSlug = (slug: string): string => {
    if (!slug.trim()) {
      return "Custom slug is required when enabled";
    }
    
    if (!/^[a-zA-Z0-9-_]+$/.test(slug)) {
      return "Slug can only contain letters, numbers, hyphens, and underscores";
    }
    
    if (slug.length < 3) {
      return "Slug must be at least 3 characters long";
    }
    
    return "";
  };

  const handleUrlChange = (url: string) => {
    setOriginalUrl(url);
    setUrlError(validateUrl(url));
    setResult(null);
  };

  const handleSlugChange = (slug: string) => {
    setCustomSlug(slug);
    setSlugError(useCustomSlug ? validateSlug(slug) : "");
  };

  const handleCustomSlugToggle = (checked: boolean) => {
    setUseCustomSlug(checked);
    if (!checked) {
      setCustomSlug("");
      setSlugError("");
    } else {
      setSlugError(validateSlug(customSlug));
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
          name: newCampaignName,
          slug: newCampaignSlug || undefined,
          public: newCampaignPublic
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Reload campaigns to include the new one
        await loadCampaigns();
        // Select the newly created campaign
        setSelectedCampaign(data.id);
        // Reset form
        setNewCampaignName("");
        setNewCampaignSlug("");
        setNewCampaignPublic(true);
        setShowNewCampaign(false);
      } else {
        console.error("Failed to create campaign");
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const urlValidationError = validateUrl(originalUrl);
    const slugValidationError = useCustomSlug ? validateSlug(customSlug) : "";
    
    setUrlError(urlValidationError);
    setSlugError(slugValidationError);
    
    if (urlValidationError || slugValidationError) {
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch("/api/shortener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: originalUrl,
          custom: useCustomSlug ? customSlug : undefined,
          domain,
          campaign: selectedCampaign || undefined,
          description: name || undefined,
          metatitle: name || undefined
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.ok) {
        setResult({
          ok: true,
          shortUrl: data.shortUrl
        });
        // Clear form for next link
        setOriginalUrl("");
        setName("");
        setCustomSlug("");
        setUseCustomSlug(false);
      } else {
        setResult({
          ok: false,
          shortUrl: "",
          error: data.message || "Failed to create short link"
        });
      }
    } catch (error) {
      setResult({
        ok: false,
        shortUrl: "",
        error: "Network error occurred"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedLayout>
      <Header title="URL Shortener" />
      
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Original URL */}
        <div>
          <Label>Original URL *</Label>
          <Input
            type="url"
            placeholder="https://example.com/very/long/url"
            value={originalUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            required
          />
          {urlError && (
            <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <span>⚠️</span>
              <span>{urlError}</span>
            </div>
          )}
        </div>

        {/* Name/Description */}
        <div>
          <Label>Name/Description</Label>
          <Input
            placeholder="My Important Link"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="text-xs text-gray-500 mt-1">
            Optional. Used as meta title and internal description.
          </div>
        </div>

        {/* Custom Slug Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="useCustomSlug"
              checked={useCustomSlug}
              onChange={(e) => handleCustomSlugToggle(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="useCustomSlug" className="!mb-0">Use Custom Slug</Label>
          </div>
          
          {useCustomSlug && (
            <div>
              <Input
                placeholder="my-custom-slug"
                value={customSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                required={useCustomSlug}
              />
              {slugError && (
                <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>{slugError}</span>
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                Letters, numbers, hyphens, and underscores only. Minimum 3 characters.
              </div>
            </div>
          )}
        </div>

        {/* Domain Selection */}
        <div>
          <Label>Domain</Label>
          <Select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            disabled={domainsLoading}
          >
            {domainsLoading ? (
              <option>Loading domains...</option>
            ) : (
              domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))
            )}
          </Select>
        </div>

        {/* Campaign Selection */}
        <div>
          <Label>Campaign</Label>
          <div className="flex gap-2">
            <Select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value ? Number(e.target.value) : "")}
              disabled={campaignsLoading}
              className="flex-1"
            >
              <option value="">No Campaign</option>
              {campaignsLoading ? (
                <option disabled>Loading campaigns...</option>
              ) : (
                campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))
              )}
            </Select>
            <Button
              type="button"
              onClick={() => setShowNewCampaign(!showNewCampaign)}
              className="!mt-0 whitespace-nowrap"
            >
              {showNewCampaign ? "Cancel" : "New Campaign"}
            </Button>
          </div>
        </div>

        {/* New Campaign Form */}
        {showNewCampaign && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium mb-3">Create New Campaign</h3>
            <div className="space-y-3">
              <div>
                <Label>Campaign Name *</Label>
                <Input
                  placeholder="Summer Sale 2024"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Campaign Slug</Label>
                <Input
                  placeholder="summer-sale-2024"
                  value={newCampaignSlug}
                  onChange={(e) => setNewCampaignSlug(e.target.value)}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Optional. Used for campaign rotator URLs.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newCampaignPublic"
                  checked={newCampaignPublic}
                  onChange={(e) => setNewCampaignPublic(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="newCampaignPublic" className="!mb-0">Public Campaign</Label>
              </div>
              <Button
                type="button"
                onClick={createNewCampaign}
                disabled={creatingCampaign || !newCampaignName.trim()}
                className="!mt-2"
              >
                {creatingCampaign ? "Creating..." : "Create Campaign"}
              </Button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={loading || !!urlError || (useCustomSlug && !!slugError)}
        >
          {loading ? "Creating Short Link..." : "Create Short Link"}
        </Button>
      </form>

      {/* Result Display */}
      {result && (
        <div className="mt-6">
          {result.ok ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">✅ Short Link Created!</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-green-700">Short URL:</span>
                  <div className="font-mono bg-white border rounded px-2 py-1 mt-1">
                    <a 
                      href={result.shortUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {result.shortUrl}
                    </a>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(result.shortUrl)}
                  className="!mt-2 !bg-green-600 hover:!brightness-110"
                >
                  📋 Copy Link
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-800 mb-2">❌ Error</h3>
              <p className="text-red-700">{result.error}</p>
            </div>
          )}
        </div>
      )}
    </ProtectedLayout>
  );
}
