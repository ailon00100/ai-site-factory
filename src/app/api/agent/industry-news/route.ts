import { NextRequest, NextResponse } from 'next/server';
import { getAgentBySubdomain } from '@/lib/agents';
import { callAiStream } from '@/lib/ai-router';

export async function POST(req: NextRequest) {
  try {
    const { subdomain } = await req.json();
    const agent = await getAgentBySubdomain(subdomain);

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const systemPrompt = `你是一位${agent.category}领域的资深专家和行业观察员。
请针对“${agent.name}”这个工具所属的垂直赛道，生成3条最新的行业情报、专业小贴士或避坑指南。
要求：
1. 内容必须专业、具有前瞻性，对用户有实际价值。
2. 严格输出为 JSON 格式，数组形式，每个对象包含 title 和 content 字段。
3. 不要包含任何多余的解释文字。

示例输出：
[
  {"title": "最新趋势", "content": "内容内容..."},
  {"title": "专家建议", "content": "内容内容..."}
]`;

    // 这里我们不需要流式，直接获取完整结果
    const response = await callAiStream(
      agent.api_provider as any,
      agent.model_id,
      [{ role: 'user', content: '请立即生成最新的行业情报。' }],
      systemPrompt
    );

    if (!response.ok) throw new Error('Failed to generate news');

    // 解析流式输出并提取 JSON
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            fullText += json.choices[0]?.delta?.content || '';
          } catch (e) {}
        }
      }
    }

    // 提取 JSON 部分
    const jsonMatch = fullText.match(/\[[\s\S]*\]/);
    const news = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    // --- 新增：自动持久化到数据库 ---
    if (news.length > 0) {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const supabase = createAdminClient();
      await supabase
        .from('agents')
        .update({ 
          industry_info: news,
          last_updated: new Date().toISOString()
        })
        .eq('id', agent.id);
      
      console.log(`✅ Successfully updated industry info for ${agent.subdomain}`);
    }

    return NextResponse.json({ news });

  } catch (error: any) {
    console.error('Industry News Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
