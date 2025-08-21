import { NextRequest, NextResponse } from "next/server";
import { getPubs, setPubs } from "@/lib/blob";

export async function GET() {
  try {
    const pubs = await getPubs();
    return NextResponse.json({ pubs });
  } catch (error) {
    console.error("Error getting publications:", error);
    return NextResponse.json({ 
      message: "Failed to get publications", 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const pubs: string[] = Array.isArray(body?.pubs) ? body.pubs : [];
    
    console.log("Attempting to save pubs:", pubs);
    console.log("setPubs function:", typeof setPubs);
    
    if (typeof setPubs !== 'function') {
      throw new Error(`setPubs is not a function, it is: ${typeof setPubs}`);
    }
    
    await setPubs(pubs);
    console.log("Pubs saved successfully");
    
    return NextResponse.json({ ok: true, count: pubs.length });
  } catch (error) {
    console.error("Error saving pubs:", error);
    return NextResponse.json({ 
      message: "Failed to update publications", 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}