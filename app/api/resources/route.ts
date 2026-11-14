import { NextResponse } from 'next/server';
import { getResources } from '@/lib/voicebridge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'food';
  const area = searchParams.get('area');
  const rows = await getResources(type, area);
  return NextResponse.json({ resources: rows });
}
