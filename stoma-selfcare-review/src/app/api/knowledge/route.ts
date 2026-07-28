import { NextResponse } from 'next/server';
import { KNOWLEDGE } from '@/lib/knowledge';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json({ items: KNOWLEDGE });
}
