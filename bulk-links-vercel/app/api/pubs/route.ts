import { NextResponse } from "next/server";
import { getPubs, setPubs } from "@/lib/kv";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

export async function GET() {
  const pubs = await getPubs();
  return NextResponse.json({ pubs });
}

export async function POST(req: Request) {
  if (!ADMIN_TOKEN) return NextResponse.json({ message: "ADMIN_TOKEN not set" }, { status: 500 });
  const token = req.headers.get("x-admin-token");
  if (token !== ADMIN_TOKEN) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const pubs: string[] = Array.isArray(body?.pubs) ? body.pubs : [];
  await setPubs(pubs);
  return NextResponse.json({ ok: true, count: pubs.length });
}