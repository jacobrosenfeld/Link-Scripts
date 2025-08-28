import { NextResponse } from "next/server";

const JJA_BASE = process.env.JJA_BASE || "https://link.josephjacobs.org/api";
const JJA_API_KEY = process.env.JJA_API_KEY!;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    console.log(`🔍 Testing pagination logic - Page: ${page}, Limit: ${limit}`);
    
    // Mock JJA API response to test pagination logic
    const totalLinks = 150; // Pretend we have 150 total links
    const totalPages = Math.ceil(totalLinks / limit);
    const mockCurrentPage = page;
    
    // Simulate what would be in each page
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalLinks);
    const linksOnThisPage = Math.max(0, endIndex - startIndex);
    
    const mockJJAResponse = {
      error: 0,
      data: {
        currentpage: mockCurrentPage,
        maxpage: totalPages,
        result: totalLinks,
        urls: new Array(linksOnThisPage).fill(null).map((_, i) => ({
          id: startIndex + i + 1,
          alias: `link${startIndex + i + 1}`,
          shorturl: `https://example.com/link${startIndex + i + 1}`,
        }))
      }
    };
    
    console.log('🔍 Mock JJA Response:', {
      currentpage: mockJJAResponse.data.currentpage,
      maxpage: mockJJAResponse.data.maxpage,
      result: mockJJAResponse.data.result,
      urls_count: mockJJAResponse.data.urls.length,
      totalLinks,
      totalPages,
      startIndex,
      endIndex,
      linksOnThisPage
    });

    return NextResponse.json({
      request: { page, limit },
      mock_jja_response: {
        error: mockJJAResponse.error,
        currentpage: mockJJAResponse.data.currentpage,
        maxpage: mockJJAResponse.data.maxpage,
        result: mockJJAResponse.data.result,
        urls_count: mockJJAResponse.data.urls.length,
      },
      calculated_pagination: {
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        totalPages: totalPages,
        totalLinks: totalLinks,
        isLastPage: page >= totalPages,
        shouldStopLoading: page >= totalPages || linksOnThisPage < limit
      },
      explanation: {
        totalLinks,
        totalPages,
        currentPage: page,
        linksOnThisPage,
        isFullPage: linksOnThisPage === limit,
        shouldContinue: page < totalPages && linksOnThisPage === limit
      }
    });

  } catch (error) {
    console.error("Error testing pagination:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
