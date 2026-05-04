import { NextResponse } from 'next/server';
import { getAgents } from '@/lib/agents';

export async function GET() {
  try {
    const agents = await getAgents();
    return NextResponse.json(agents);
  } catch (error: unknown) {
    console.error('API Error /api/agents:', error);
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
