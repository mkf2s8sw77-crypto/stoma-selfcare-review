import { NextResponse } from 'next/server';
import { getPatients } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json({ patients: getPatients() });
}
