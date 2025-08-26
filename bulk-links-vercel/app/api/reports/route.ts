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
  campaign?: number | string; // Can be campaign ID or name
}

interface CampaignData {
  id: number;
  name: string;
  public: boolean;
  rotator: boolean | string;
  list: string;
}

// GET - Get all links with statistics for reporting
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignFilter = searchParams.get('campaign');
    const searchQuery = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000'); // High limit to get all data

    // Fetch campaigns first to map campaign IDs to names
    const campaignsResponse = await fetch(`${JJA_BASE}/campaigns?limit=1000&page=1`, {
      headers: {
        "Authorization": `Bearer ${JJA_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    let campaignsMap: Record<number, string> = {};
    if (campaignsResponse.ok) {
      const campaignsData = await campaignsResponse.json();
      if (campaignsData.error === 0 || campaignsData.error === "0") {
        const campaigns: CampaignData[] = campaignsData.data?.campaigns || [];
        campaignsMap = campaigns.reduce((acc, campaign) => {
          acc[campaign.id] = campaign.name;
          return acc;
        }, {} as Record<number, string>);
      }
    }

    // Fetch all links with pagination to get complete dataset
    let allLinks: LinkData[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const response = await fetch(`${JJA_BASE}/urls?limit=100&page=${currentPage}&order=date`, {
        headers: {
          "Authorization": `Bearer ${JJA_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: "Failed to fetch links" },
          { status: response.status }
        );
      }

      const data = await response.json();
      
      if (data.error === 0 || data.error === "0") {
        const pageLinks: LinkData[] = data.data?.urls || [];
        allLinks = [...allLinks, ...pageLinks];

        // Check if there are more pages
        const currentPageNum = data.data?.currentpage || 1;
        const maxPage = data.data?.maxpage || 1;
        hasMorePages = currentPageNum < maxPage;
        currentPage++;
      } else {
        hasMorePages = false;
      }
    }

    // Enhance links with campaign names and detailed statistics
    const enhancedLinks = await Promise.all(
      allLinks.map(async (link) => {
        // Get detailed statistics for each link
        try {
          const detailResponse = await fetch(`${JJA_BASE}/url/${link.id}`, {
            headers: {
              "Authorization": `Bearer ${JJA_API_KEY}`,
              "Content-Type": "application/json",
            },
          });

          let detailedStats = null;
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            if (detailData.error === 0) {
              detailedStats = detailData.data;
            }
          }

          return {
            ...link,
            campaign: (link.campaign && campaignsMap[Number(link.campaign)]) || 'No Campaign',
            uniqueClicks: detailedStats?.uniqueClicks || 0,
            topCountries: detailedStats?.topCountries || {},
            topReferrers: detailedStats?.topReferrers || {},
            topBrowsers: detailedStats?.topBrowsers || {},
            createdAt: link.date,
          };
        } catch (error) {
          console.error(`Error fetching details for link ${link.id}:`, error);
          return {
            ...link,
            campaign: 'No Campaign',
            uniqueClicks: 0,
            topCountries: {},
            topReferrers: {},
            topBrowsers: {},
            createdAt: link.date,
          };
        }
      })
    );

    // Apply filters
    let filteredLinks = enhancedLinks;

    // Campaign filter
    if (campaignFilter && campaignFilter !== 'all') {
      filteredLinks = filteredLinks.filter(link => 
        link.campaign.toLowerCase().includes(campaignFilter.toLowerCase())
      );
    }

    // Search filter (description, original URL, short URL)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredLinks = filteredLinks.filter(link =>
        link.description.toLowerCase().includes(query) ||
        link.longurl.toLowerCase().includes(query) ||
        link.shorturl.toLowerCase().includes(query) ||
        link.title.toLowerCase().includes(query)
      );
    }

    // Calculate summary statistics
    const totalClicks = filteredLinks.reduce((sum, link) => sum + link.clicks, 0);
    const totalUniqueClicks = filteredLinks.reduce((sum, link) => sum + (link.uniqueClicks || 0), 0);
    
    // Group clicks by URL for summary
    const clicksByUrl = filteredLinks.reduce((acc, link) => {
      acc[link.shorturl] = {
        title: link.title || link.description || link.shorturl,
        clicks: link.clicks,
        uniqueClicks: link.uniqueClicks || 0,
      };
      return acc;
    }, {} as Record<string, { title: string; clicks: number; uniqueClicks: number }>);

    // Apply pagination to filtered results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLinks = filteredLinks.slice(startIndex, endIndex);

    return NextResponse.json({
      links: paginatedLinks,
      summary: {
        totalLinks: filteredLinks.length,
        totalClicks,
        totalUniqueClicks,
        clicksByUrl,
      },
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(filteredLinks.length / limit),
        hasNextPage: endIndex < filteredLinks.length,
        hasPrevPage: page > 1,
      },
      campaigns: Object.keys(campaignsMap).map((id: string) => ({ 
        id: parseInt(id), 
        name: campaignsMap[parseInt(id)] 
      })),
    });

  } catch (error) {
    console.error("Error in reports API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
