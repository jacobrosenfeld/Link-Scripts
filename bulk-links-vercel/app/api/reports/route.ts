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

// Function to fetch unique clicks for a single link
async function getUniqueClicksForLink(linkId: number): Promise<number> {
  try {
    console.log(`🔍 Fetching unique clicks for link ID: ${linkId}`);
    const response = await fetch(`${JJA_BASE}/url/${linkId}`, {
      headers: {
        "Authorization": `Bearer ${JJA_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`📊 Response status for link ${linkId}:`, response.status);

    if (response.ok) {
      const data = await response.json();
      console.log(`📊 Response data for link ${linkId}:`, JSON.stringify(data, null, 2));
      
      if (data.error === 0 || data.error === "0") {
        const uniqueClicks = data.data?.uniqueClicks || 0;
        console.log(`✅ Unique clicks for link ${linkId}:`, uniqueClicks);
        return uniqueClicks;
      } else {
        console.log(`❌ API error for link ${linkId}:`, data.message);
      }
    } else {
      console.log(`❌ HTTP error for link ${linkId}:`, response.status, response.statusText);
    }
  } catch (error) {
    console.error(`❌ Exception fetching unique clicks for link ${linkId}:`, error);
  }
  
  return 0;
}

// GET - Get links with pagination for progressive loading
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const includeUniqueClicks = searchParams.get('includeUniqueClicks') === 'true';
    
    console.log(`🔍 API Request - Page: ${page}, Limit: ${limit}, Include Unique Clicks: ${includeUniqueClicks}`);
    
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
    
    // Debug: Log first link structure to understand available fields
    if (links.length > 0 && page === 1) {
      console.log('🔍 First link structure:', JSON.stringify(links[0], null, 2));
      console.log('🔍 Available fields:', Object.keys(links[0]));
      console.log('🔍 Available campaigns map:', Object.keys(campaignsMap).length, 'campaigns');
    }
    
    // Enhance links with campaign names and optionally unique clicks (fast lookup)
    const enhancedLinks = await Promise.all(links.map(async (link) => {
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

      // Fetch unique clicks if requested (this will be slower)
      let uniqueClicks = 0;
      if (includeUniqueClicks) {
        console.log(`🔄 Fetching unique clicks for link ${link.id} (${link.alias})`);
        uniqueClicks = await getUniqueClicksForLink(link.id);
        console.log(`📈 Got ${uniqueClicks} unique clicks for link ${link.id}`);
      } else {
        console.log(`⏭️ Skipping unique clicks for link ${link.id} (not requested)`);
      }
      
      return {
        ...link,
        campaign: campaignName,
        uniqueClicks,
        createdAt: link.date,
      };
    }));

    // Calculate quick summary stats for this page
    const totalClicks = enhancedLinks.reduce((sum, link) => sum + link.clicks, 0);
    const totalUniqueClicks = enhancedLinks.reduce((sum, link) => sum + (link.uniqueClicks || 0), 0);
    
    // Prepare response
    const responseData = {
      links: enhancedLinks,
      summary: {
        totalLinks: data.data?.result || enhancedLinks.length,
        totalClicks,
        totalUniqueClicks,
        clicksByUrl: enhancedLinks.reduce((acc, link) => {
          acc[link.shorturl] = {
            title: link.title || link.description || link.shorturl,
            clicks: link.clicks,
            uniqueClicks: link.uniqueClicks || 0,
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
