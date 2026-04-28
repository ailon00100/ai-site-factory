import { NextRequest } from 'next/server';
import { getAgentBySubdomain, getSystemPrompt } from '@/lib/agents';
import { callAiStream } from '@/lib/ai-router';
import { CreditService } from '@/lib/services/credits';
import { createBrowserClient } from '@supabase/ssr';
import type { ChatRequest } from '@/types';

export const runtime = 'edge'; 

export async function POST(req: NextRequest) {
  try {
    const { messages, subdomain } = (await req.json()) as ChatRequest;

    const agent = await getAgentBySubdomain(subdomain);
    if (!agent) return new Response('Agent not found', { status: 404 });

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Unauthorized - Please login', { status: 401 });
    }

    const hasBalance = await CreditService.checkBalance(user.id, agent.credit_per_use);
    if (!hasBalance) {
      return new Response('Insufficient credits', { status: 402 });
    }

    const systemPrompt = await getSystemPrompt(agent.id);
    const aiResponse = await callAiStream(
      agent.api_provider,
      agent.model_id,
      messages,
      systemPrompt
    );

    const stream = aiResponse.body;
    if (!stream) throw new Error('No AI content');

    // 同步扣费
    await CreditService.deductAndLog(
      user.id,
      agent.id,
      agent.credit_per_use,
      agent.model_id
    );

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(error.message || 'Internal Error', { status: 500 });
  }
}
