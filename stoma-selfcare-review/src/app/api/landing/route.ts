import { NextResponse } from 'next/server';
import { getLandingSummary } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json(getLandingSummary());
}
