import { NextResponse } from "next/server";
import { getPubs, setPubs } from "@/lib/kv";

export async function GET() {
  const pubs = await getPubs();
  return NextResponse.json({ pubs });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const pubs: string[] = Array.isArray(body?.pubs) ? body.pubs : [];
    await setPubs(pubs);
    return NextResponse.json({ ok: true, count: pubs.length });
  } catch (error) {
    return NextResponse.json({ message: "Failed to update pubs" }, { status: 500 });
  }
}