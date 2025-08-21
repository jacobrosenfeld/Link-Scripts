import { NextResponse } from "next/server";
import { slugify } from "@/lib/slug";
import { createShortLink } from "@/lib/jja";

export async function POST(req: Request) {
  const { longUrl, campaign, date, pubs, domain } = await req.json();
  if (!longUrl || !campaign || !date) {
    return NextResponse.json({ message: "Missing fields" }, { status: 400 });
  }

  const campaignSlug = slugify(campaign);
  const dateSlug = slugify(date);
  const pubList: string[] = Array.isArray(pubs) && pubs.length ? pubs : ["default"];
  const dom = (domain || "").trim() || process.env.DEFAULT_DOMAIN || "adtracking.link";

  const results = [] as any[];
  for (const pub of pubList) {
    const pubSlug = slugify(pub);
    const slug = [campaignSlug, pubSlug, dateSlug].filter(Boolean).join("-");
    const { ok, data } = await createShortLink(longUrl, slug, dom);
    results.push({ pub, slug: `${dom}/${slug}`, ok, data });
  }

  return NextResponse.json({ results });
}