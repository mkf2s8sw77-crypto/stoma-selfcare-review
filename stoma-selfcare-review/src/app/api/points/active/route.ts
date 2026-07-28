import { NextResponse } from 'next/server';
import { getActivePoints, getVersion, getVersions } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  const versions = getVersions();
  const active = versions.find((v) => v.isActive);
  if (!active) return NextResponse.json({ version: null, points: [] });
  const detail = getVersion(active.id)!;
  return NextResponse.json({ version: detail.version, points: detail.points, versions });
}
