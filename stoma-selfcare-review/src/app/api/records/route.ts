import { NextResponse } from 'next/server';
import { getRecentRecords, submitRecord } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const url = new URL(req.url);
  const patientId = Number(url.searchParams.get('patientId') ?? 0);
  const limit = Number(url.searchParams.get('limit') ?? 8);
  if (!patientId) return NextResponse.json({ error: { code: 'BAD_REQUEST', message: '缺少 patientId' } }, { status: 400 });
  return NextResponse.json({ records: getRecentRecords(patientId, limit) });
}
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = submitRecord(body);
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: e?.message ?? '参数错误' } }, { status: 400 });
  }
}
