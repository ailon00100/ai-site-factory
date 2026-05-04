import { NextRequest, NextResponse } from 'next/server';
import { getAgentBySubdomain, getSystemPrompt } from '@/lib/agents';
import { callAiStream, callImageGeneration } from '@/lib/ai-router';
import { CreditService } from '@/lib/services/credits';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, image, fileContent, fileName, subdomain, history, options } = body;

    if (!message || !subdomain) {
      return NextResponse.json({ error: '缺少必要参数 (message/subdomain)' }, { status: 400 });
    }

    const agent = await getAgentBySubdomain(subdomain);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    let userMessageContent = message;
    if (fileContent) {
      const ext = fileName?.split('.').pop()?.toLowerCase() || '';
      userMessageContent = `[上传文件: ${fileName}]\n\`\`\`${ext}\n${fileContent.slice(0, 3000)}\n\`\`\`\n\n${message}`;
    }

    // 检查登录用户并扣减积分
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const hasBalance = await CreditService.checkBalance(user.id, agent.credit_per_use || 1);
      if (!hasBalance) {
        return NextResponse.json({ error: '积分不足，请购买套餐后继续使用' }, { status: 402 });
      }
    }

    if (options && agent.category === 'vision' && agent.model_id.toLowerCase().includes('flux')) {
      const imageUrl = await callImageGeneration(
        agent.api_provider,
        agent.model_id,
        userMessageContent,
        { ratio: options.ratio }
      );

      if (user) {
        await CreditService.deductAndLog(user.id, agent.id, agent.credit_per_use || 1, agent.model_id);
      }

      return NextResponse.json({ url: imageUrl });
    }

    const systemPrompt = await getSystemPrompt(agent.id);

    let currentUserMessage;
    let targetModelId = agent.model_id;

    if (image) {
      targetModelId = 'Qwen/Qwen2-VL-72B-Instruct';
      currentUserMessage = {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: image } },
          { type: 'text', text: userMessageContent }
        ]
      };
    } else {
      currentUserMessage = { role: 'user', content: userMessageContent };
    }

    const messages = [...(history || []), currentUserMessage];

    const response = await callAiStream(
      agent.api_provider,
      targetModelId,
      messages,
      systemPrompt
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('AI Provider Error:', errorData);
      throw new Error(errorData.error?.message || `AI Provider Error: ${response.status}`);
    }

    // 登录用户扣减积分 + 记录日志
    if (user) {
      await CreditService.deductAndLog(user.id, agent.id, agent.credit_per_use || 1, targetModelId);
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
