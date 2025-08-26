import { NextResponse } from "next/server";

const JJA_BASE = process.env.JJA_BASE || "https://link.josephjacobs.org/api";
const JJA_API_KEY = process.env.JJA_API_KEY!;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      url, 
      custom, 
      domain, 
      campaign, 
      description, 
      metatitle,
      metadescription,
      type,
      password,
      expiry,
      status
    } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Build payload for JJA API
    const payload: any = { url };
    
    if (custom) payload.custom = custom;
    if (domain) payload.domain = domain;
    if (campaign) payload.campaign = campaign;
    if (description) payload.description = description;
    if (metatitle) payload.metatitle = metatitle;
    if (metadescription) payload.metadescription = metadescription;
    if (type) payload.type = type;
    if (password) payload.password = password;
    if (expiry) payload.expiry = expiry;
    if (status) payload.status = status;

    const response = await fetch(`${JJA_BASE}/url/add`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${JJA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && (data.error === 0 || data.error === "0" || data.error === undefined)) {
      // Use the actual shorturl from the API response, fallback to constructed URL only if needed
      const shortUrl = data.shorturl || data.short || data.url || `${domain || 'adtracking.link'}/${custom || data.id}`;
      
      return NextResponse.json({
        ok: true,
        shortUrl,
        id: data.id,
        data
      });
    } else {
      return NextResponse.json({
        ok: false,
        message: data.message || "Failed to create short link",
        error: data.error
      }, { status: response.status || 400 });
    }
  } catch (error) {
    console.error("Error creating short link:", error);
    return NextResponse.json({
      ok: false,
      message: "Internal server error"
    }, { status: 500 });
  }
}
