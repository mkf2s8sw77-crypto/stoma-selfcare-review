import { NextResponse } from 'next/server';
import { reviewItem } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const { id } = await ctx.params;
    const res = reviewItem({ ...body, itemId: Number(id) });
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: e?.message ?? '参数错误' } }, { status: 400 });
  }
}
