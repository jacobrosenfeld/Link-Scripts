import { NextResponse } from "next/server";
import { fetchBrandedDomains, DEFAULT_DOMAIN } from "@/lib/jja";

export async function GET() {
  try {
    const result = await fetchBrandedDomains();
    
    if (result.ok && result.domains.length > 0) {
      // Include the default domain as the first option if it's not already in the list
      const domains = result.domains.includes(DEFAULT_DOMAIN) 
        ? result.domains 
        : [DEFAULT_DOMAIN, ...result.domains];
        
      return NextResponse.json({ 
        ok: true, 
        domains,
        defaultDomain: DEFAULT_DOMAIN 
      });
    } else {
      // Fallback to default domain if API fails
      return NextResponse.json({ 
        ok: false, 
        domains: [DEFAULT_DOMAIN],
        defaultDomain: DEFAULT_DOMAIN,
        error: "Failed to fetch branded domains" 
      });
    }
  } catch (error) {
    console.error("Error in domains API:", error);
    return NextResponse.json({ 
      ok: false, 
      domains: [DEFAULT_DOMAIN],
      defaultDomain: DEFAULT_DOMAIN,
      error: "Internal server error" 
    });
  }
}
