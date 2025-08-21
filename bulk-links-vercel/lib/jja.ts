const JJA_BASE = process.env.JJA_BASE || "https://link.josephjacobs.org/api";
const DEFAULT_DOMAIN = process.env.DEFAULT_DOMAIN || "adtracking.link";
const JJA_API_KEY = process.env.JJA_API_KEY!;

export type CreateLinkResult = {
  ok: boolean;
  pub: string;
  slug: string;
  data: any;
};

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function createShortLink(longUrl: string, customSlug: string, domain = DEFAULT_DOMAIN, maxRetries = 3): Promise<{ ok: boolean; data: any }> {
  const payload = { url: longUrl, custom: customSlug, domain };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const resp = await fetch(`${JJA_BASE}/url/add`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${JJA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await resp.json().catch(() => ({}));

    if (resp.ok && (data?.error === 0 || data?.error === "0" || data?.error === undefined)) {
      return { ok: true, data };
    }

    if (resp.status === 429) {
      const retryAfter = Number(resp.headers.get("Retry-After"));
      await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : 2 ** attempt * 1000);
      continue;
    }
    return { ok: false, data };
  }

  return { ok: false, data: { error: 1, message: "Rate limit: retries exhausted" } };
}

export async function fetchBrandedDomains(): Promise<{ ok: boolean; domains: string[] }> {
  try {
    const resp = await fetch(`${JJA_BASE}/domains?limit=100&page=1`, {
      headers: {
        "Authorization": `Bearer ${JJA_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      console.error("Failed to fetch domains:", resp.status, resp.statusText);
      return { ok: false, domains: [] };
    }

    const data = await resp.json();
    
    // Extract domain names from the API response
    // Assuming the API returns { data: [{ domain: "example.com" }, ...] } or similar
    const domains = Array.isArray(data.data) 
      ? data.data.map((item: any) => item.domain || item.name || item).filter(Boolean)
      : [];

    return { ok: true, domains };
  } catch (error) {
    console.error("Error fetching branded domains:", error);
    return { ok: false, domains: [] };
  }
}

export { DEFAULT_DOMAIN };