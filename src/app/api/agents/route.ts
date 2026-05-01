import { NextResponse } from 'next/server';
import { getAgents } from '@/lib/agents';

export async function GET() {
  try {
    const agents = await getAgents();
    return NextResponse.json(agents);
  } catch (error: any) {
    console.error('API Error /api/agents:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
