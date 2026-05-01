import { NextRequest, NextResponse } from 'next/server';
import { getAgentBySubdomain, getSystemPrompt } from '@/lib/agents';
import { callAiStream } from '@/lib/ai-router';

export async function POST(req: NextRequest) {
  try {
    const { message, image, subdomain, history } = await req.json();

    if (!message || !subdomain) {
      return NextResponse.json({ error: '缺少必要参数 (message/subdomain)' }, { status: 400 });
    }

    // 1. 获取该 Agent 的完整配置
    const agent = await getAgentBySubdomain(subdomain);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    console.log(`🔍 Chat attempt for agent: ${subdomain} (Guest Mode)`);

    // 2. 获取系统提示词
    const systemPrompt = await getSystemPrompt(agent.id);

    // 3. 构建当前消息
    let currentUserMessage;
    let targetModelId = agent.model_id;

    if (image) {
      // 携带图片，自动升级为视觉大模型
      targetModelId = 'Qwen/Qwen2-VL-72B-Instruct';
      currentUserMessage = {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: image } },
          { type: 'text', text: message }
        ]
      };
    } else {
      currentUserMessage = { role: 'user', content: message };
    }

    // 4. 构建对话上下文 (合并历史记录与当前消息)
    const messages = [...(history || []), currentUserMessage];

    // 5. 调用 AI 路由
    const response = await callAiStream(
      agent.api_provider as any,
      targetModelId,
      messages,
      systemPrompt
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('AI Provider Error:', errorData);
      throw new Error(errorData.error?.message || `AI Provider Error: ${response.status}`);
    }

    // 4. 返回流式响应
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
