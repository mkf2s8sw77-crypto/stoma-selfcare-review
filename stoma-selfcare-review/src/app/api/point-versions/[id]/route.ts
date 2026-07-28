import { NextResponse } from 'next/server';
import { getVersion, activateVersion } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const v = getVersion(Number(id));
  if (!v) return NextResponse.json({ error: { code: 'NOT_FOUND', message: '版本不存在' } }, { status: 404 });
  return NextResponse.json(v);
}
export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  activateVersion(Number(id), '陈素清');
  return NextResponse.json({ ok: true });
}
