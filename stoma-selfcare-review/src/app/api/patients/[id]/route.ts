import { NextResponse } from 'next/server';
import { getPatient, getPatientRecords } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const p = getPatient(Number(id));
  if (!p) return NextResponse.json({ error: { code: 'NOT_FOUND', message: '患者不存在' } }, { status: 404 });
  const records = getPatientRecords(p.id);
  return NextResponse.json({ patient: p, records });
}
