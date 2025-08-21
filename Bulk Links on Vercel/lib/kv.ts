import { kv } from "@vercel/kv";

const PUBS_KEY = "pubs:list";

export async function getPubs(): Promise<string[]> {
  const pubs = await kv.get<string[]>(PUBS_KEY);
  return Array.isArray(pubs) ? pubs : [];
}

export async function setPubs(pubs: string[]): Promise<void> {
  const clean = pubs
    .map((p) => p.trim())
    .filter(Boolean);
  await kv.set(PUBS_KEY, clean);
}