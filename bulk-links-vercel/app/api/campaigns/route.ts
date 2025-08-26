import { NextResponse } from "next/server";

const JJA_BASE = process.env.JJA_BASE || "https://link.josephjacobs.org/api";
const JJA_API_KEY = process.env.JJA_API_KEY!;

// GET - List campaigns
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') || '100';
    const page = searchParams.get('page') || '1';

    const response = await fetch(`${JJA_BASE}/campaigns?limit=${limit}&page=${page}`, {
      headers: {
        "Authorization": `Bearer ${JJA_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch campaigns" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (data.error === 0 || data.error === "0") {
      return NextResponse.json({
        campaigns: data.data?.campaigns || [],
        result: data.data?.result || 0,
        currentpage: data.data?.currentpage || 1,
        maxpage: data.data?.maxpage || 1
      });
    } else {
      return NextResponse.json(
        { error: data.message || "Failed to fetch campaigns" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new campaign
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, public: isPublic } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Campaign name is required" },
        { status: 400 }
      );
    }

    const payload: any = { name };
    if (slug) payload.slug = slug;
    if (typeof isPublic === 'boolean') payload.public = isPublic;

    const response = await fetch(`${JJA_BASE}/campaign/add`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${JJA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && (data.error === 0 || data.error === "0")) {
      return NextResponse.json({
        id: data.id,
        name: data.domain || data.name, // API sometimes returns name as 'domain'
        public: data.public,
        rotator: data.rotator,
        list: data.list
      });
    } else {
      return NextResponse.json(
        { error: data.message || "Failed to create campaign" },
        { status: response.status || 400 }
      );
    }
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
