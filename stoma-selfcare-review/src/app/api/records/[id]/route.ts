import { NextResponse } from 'next/server';
import { getRecord } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const r = getRecord(Number(id));
  if (!r) return NextResponse.json({ error: { code: 'NOT_FOUND', message: '记录不存在' } }, { status: 404 });
  return NextResponse.json(r);
}
