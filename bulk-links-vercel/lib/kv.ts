import { kv } from "@vercel/kv";

const PUBS_KEY = "pubs:list";

export async function getPubs(): Promise<string[]> {
  try {
    // Check if KV is properly configured
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.error("KV environment variables not set:", {
        hasUrl: !!process.env.KV_REST_API_URL,
        hasToken: !!process.env.KV_REST_API_TOKEN
      });
      throw new Error("KV database not configured. Please set KV_REST_API_URL and KV_REST_API_TOKEN environment variables.");
    }
    
    const pubs = await kv.get<string[]>(PUBS_KEY);
    return Array.isArray(pubs) ? pubs : [];
  } catch (error) {
    console.error("Error getting pubs from KV:", error);
    throw error;
  }
}

export async function setPubs(pubs: string[]): Promise<void> {
  try {
    // Check if KV is properly configured
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.error("KV environment variables not set:", {
        hasUrl: !!process.env.KV_REST_API_URL,
        hasToken: !!process.env.KV_REST_API_TOKEN
      });
      throw new Error("KV database not configured. Please set KV_REST_API_URL and KV_REST_API_TOKEN environment variables.");
    }
    
    const clean = pubs
      .map((p) => p.trim())
      .filter(Boolean);
    
    console.log("Setting pubs in KV:", clean);
    await kv.set(PUBS_KEY, clean);
    console.log("Pubs set successfully in KV");
  } catch (error) {
    console.error("Error setting pubs in KV:", error);
    throw error;
  }
}