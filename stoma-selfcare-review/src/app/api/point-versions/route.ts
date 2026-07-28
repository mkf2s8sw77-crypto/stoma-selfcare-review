import { NextResponse } from 'next/server';
import { createVersion, getVersions } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json({ versions: getVersions() });
}
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = createVersion(body);
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: e?.message ?? '参数错误' } }, { status: 400 });
  }
}
