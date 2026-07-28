import { NextResponse } from 'next/server';
import { getAnalytics } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawRange = Number(url.searchParams.get('range') ?? 30);
  const range = Number.isFinite(rawRange) && rawRange > 0 && rawRange <= 365 ? Math.floor(rawRange) : 30;
  return NextResponse.json(getAnalytics(range));
}
