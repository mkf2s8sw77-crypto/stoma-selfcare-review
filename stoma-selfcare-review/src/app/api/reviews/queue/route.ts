import { NextResponse } from 'next/server';
import { getReviewQueue } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? '全部';
  return NextResponse.json({ records: getReviewQueue(status) });
}
