import { NextResponse } from "next/server";

const JJA_BASE = process.env.JJA_BASE || "https://link.josephjacobs.org/api";
const JJA_API_KEY = process.env.JJA_API_KEY!;

interface LinkData {
  id: number;
  alias: string;
  shorturl: string;
  longurl: string;
  clicks: number;
  uniqueClicks?: number;
  title: string;
  description: string;
  date: string;
  campaign?: string | number;
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
    const limit = parseInt(searchParams.get('limit') || '50'); // Reduced to 50 to prevent timeout
    
    console.log(`🔍 API Request - Page: ${page}, Limit: ${limit}`);
    
    // Fetch campaigns map (cached)
    const campaignsMap = await getCampaignsMap();

    // Fetch links for this page only (with timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    let data;
    try {
      const response = await fetch(`${JJA_BASE}/urls?limit=${limit}&page=${page}&order=date`, {
        headers: {
          "Authorization": `Bearer ${JJA_API_KEY}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch links: ${response.status}` },
          { status: response.status }
        );
      }

      data = await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout - try reducing the page size' },
          { status: 504 }
        );
      }
      throw error;
    }
    
    if (data.error !== 0 && data.error !== "0") {
      return NextResponse.json(
        { error: data.message || "Failed to fetch links" },
        { status: 400 }
      );
    }

    const links: LinkData[] = data.data?.urls || [];
    
    // Debug: Log pagination data from JJA API
    console.log('🔍 JJA API pagination data:', {
      currentpage: data.data?.currentpage,
      maxpage: data.data?.maxpage,
      result: data.data?.result,
      requested_page: page,
      requested_limit: limit,
      received_links: links.length
    });
    
    // Debug: Log first link structure to understand available fields
    if (links.length > 0 && page === 1) {
      console.log('🔍 First link structure:', JSON.stringify(links[0], null, 2));
      console.log('🔍 Available fields:', Object.keys(links[0]));
      console.log('🔍 Available campaigns map:', Object.keys(campaignsMap).length, 'campaigns');
    }
    
    // Enhance links with campaign names only (no unique clicks for performance)
    console.log(`🚀 Processing ${links.length} links with campaign mapping only`);
    const enhancedLinks = links.map((link) => {
      // Get campaign name from the campaign ID in the link data
      let campaignName = 'No Campaign';
      
      if (link.campaign) {
        // If campaign is a number (campaign ID), look it up in the campaigns map
        if (typeof link.campaign === 'number') {
          campaignName = campaignsMap[link.campaign] || `Campaign ${link.campaign}`;
        } else {
          // If campaign is already a string, use it as is
          campaignName = link.campaign;
        }
      }

      return {
        ...link,
        campaign: campaignName,
        createdAt: link.date,
      };
    });

    // Calculate quick summary stats for this page
    const totalClicks = enhancedLinks.reduce((sum, link) => sum + link.clicks, 0);
    
    // Prepare response
    const responseData = {
      links: enhancedLinks,
      summary: {
        totalLinks: data.data?.result || enhancedLinks.length,
        totalClicks,
        clicksByUrl: enhancedLinks.reduce((acc, link) => {
          acc[link.shorturl] = {
            title: link.title || link.description || link.shorturl,
            clicks: link.clicks,
          };
          return acc;
        }, {} as Record<string, { title: string; clicks: number }>),
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
