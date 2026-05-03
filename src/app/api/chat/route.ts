import { NextRequest, NextResponse } from 'next/server';
import { getAgentBySubdomain, getSystemPrompt } from '@/lib/agents';
import { callAiStream, callImageGeneration } from '@/lib/ai-router';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, image, subdomain, history, options } = body;

    if (!message || !subdomain) {
      return NextResponse.json({ error: '缺少必要参数 (message/subdomain)' }, { status: 400 });
    }

    // 1. 获取该 Agent 的完整配置
    const agent = await getAgentBySubdomain(subdomain);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // 2. 判断是否为图像生成请求 (CreativeInterface 会带 options)
    // 只有当分类为 vision 且模型 ID 包含 'FLUX' 时才调用图像生成接口
    if (options && agent.category === 'vision' && agent.model_id.toLowerCase().includes('flux')) {
      const imageUrl = await callImageGeneration(
        agent.api_provider as any,
        agent.model_id,
        message,
        { ratio: options.ratio }
      );
      return NextResponse.json({ url: imageUrl });
    }

    console.log(`🔍 Chat attempt for agent: ${subdomain} (Guest Mode)`);

    // 3. 获取系统提示词
    const systemPrompt = await getSystemPrompt(agent.id);

    // 4. 构建当前消息
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

    // 5. 构建对话上下文 (合并历史记录与当前消息)
    const messages = [...(history || []), currentUserMessage];

    // 6. 调用 AI 路由
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

    // 7. 返回流式响应
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
