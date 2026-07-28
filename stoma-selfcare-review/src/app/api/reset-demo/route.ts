import { NextResponse } from 'next/server';
import { resetDemoData } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function POST() {
  resetDemoData();
  return NextResponse.json({ ok: true });
}
