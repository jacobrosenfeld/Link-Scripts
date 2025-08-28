import { NextResponse } from "next/server";

const JJA_BASE = process.env.JJA_BASE || "https://link.josephjacobs.org/api";
const JJA_API_KEY = process.env.JJA_API_KEY!;

interface LinkData {
  id: number;
  alias: string;
  shorturl: string;
  longurl: string;
  clicks: number;
  title: string;
  description: string;
  date: string;
  campaign?: string;
}

interface CampaignData {
  id: number;
  name: string;
  public: boolean;
  rotator: boolean | string;
  list: string;
}

// Cache for campaigns to avoid repeated API calls
let campaignsCache: Record<number, string> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCampaignsMap(): Promise<Record<number, string>> {
  const now = Date.now();
  
  // Return cached data if it's still valid
  if (campaignsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return campaignsCache;
  }
  
  try {
    const campaignsResponse = await fetch(`${JJA_BASE}/campaigns?limit=1000&page=1`, {
      headers: {
        "Authorization": `Bearer ${JJA_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (campaignsResponse.ok) {
      const campaignsData = await campaignsResponse.json();
      if (campaignsData.error === 0 || campaignsData.error === "0") {
        const campaigns: CampaignData[] = campaignsData.data?.campaigns || [];
        campaignsCache = campaigns.reduce((acc, campaign) => {
          acc[campaign.id] = campaign.name;
          return acc;
        }, {} as Record<number, string>);
        cacheTimestamp = now;
        return campaignsCache;
      }
    }
  } catch (error) {
    console.error("Error fetching campaigns:", error);
  }
  
  return {};
}

// GET - Get links with pagination for progressive loading
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // Fetch campaigns map (cached)
    const campaignsMap = await getCampaignsMap();

    // Fetch links for this page only
    const response = await fetch(`${JJA_BASE}/urls?limit=${limit}&page=${page}&order=date`, {
      headers: {
        "Authorization": `Bearer ${JJA_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch links: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (data.error !== 0 && data.error !== "0") {
      return NextResponse.json(
        { error: data.message || "Failed to fetch links" },
        { status: 400 }
      );
    }

    const links: LinkData[] = data.data?.urls || [];
    
    // Enhance links with campaign names (fast lookup)
    const enhancedLinks = links.map((link) => ({
      ...link,
      campaign: campaignsMap[link.id] || 'No Campaign',
      uniqueClicks: 0, // Will be fetched individually if needed
      createdAt: link.date,
    }));

    // Calculate quick summary stats for this page
    const totalClicks = enhancedLinks.reduce((sum, link) => sum + link.clicks, 0);
    
    // Prepare response
    const responseData = {
      links: enhancedLinks,
      summary: {
        totalLinks: data.data?.result || enhancedLinks.length,
        totalClicks,
        totalUniqueClicks: 0, // Not calculated for performance
        clicksByUrl: enhancedLinks.reduce((acc, link) => {
          acc[link.shorturl] = {
            title: link.title || link.description || link.shorturl,
            clicks: link.clicks,
            uniqueClicks: 0,
          };
          return acc;
        }, {} as Record<string, { title: string; clicks: number; uniqueClicks: number }>),
      },
      pagination: {
        page,
        limit,
        totalPages: data.data?.maxpage || 1,
        hasNextPage: (data.data?.currentpage || 1) < (data.data?.maxpage || 1),
        hasPrevPage: page > 1,
      },
      campaigns: Object.keys(campaignsMap).map((id: string) => ({ 
        id: parseInt(id), 
        name: campaignsMap[parseInt(id)] 
      })),
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Error in reports API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
