import { NextResponse } from 'next/server';
import { recomputeRecord, getRecord } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ok = recomputeRecord(Number(id), '陈素清');
  if (!ok) return NextResponse.json({ error: { code: 'NOT_FOUND', message: '记录不存在' } }, { status: 404 });
  return NextResponse.json({ ok: true, record: getRecord(Number(id)) });
}
