import { NextResponse } from "next/server";
import { DEFAULT_DOMAIN } from "@/lib/jja";

export async function GET() {
  return NextResponse.json({ defaultDomain: DEFAULT_DOMAIN });
}
