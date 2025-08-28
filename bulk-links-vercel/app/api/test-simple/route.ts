import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "API is working",
    timestamp: new Date().toISOString(),
    env_check: {
      jja_base: process.env.JJA_BASE || "not set",
      has_api_key: !!process.env.JJA_API_KEY,
    }
  });
}
