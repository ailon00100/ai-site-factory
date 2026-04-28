import type { ChatMessage, ApiProvider } from '@/types';

const API_ENDPOINTS: Record<ApiProvider, string> = {
  siliconflow: 'https://api.siliconflow.cn/v1/chat/completions',
  aliyun: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
};

function getApiKey(provider: ApiProvider): string {
  const keyMap: Record<ApiProvider, string | undefined> = {
    siliconflow: process.env.SILICONFLOW_API_KEY,
    aliyun: process.env.ALIYUN_BAILIAN_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
  };
  const key = keyMap[provider];
  if (!key) throw new Error(`Missing ${provider.toUpperCase()}_API_KEY`);
  return key;
}

export async function callAiStream(
  provider: ApiProvider,
  modelId: string,
  messages: ChatMessage[],
  systemPrompt: string
): Promise<Response> {
  const apiUrl = API_ENDPOINTS[provider];
  const apiKey = getApiKey(provider);

  const payload = {
    model: modelId,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: true,
    temperature: 0.7,
    max_tokens: 4096,
  };

  // 处理不同供应商的特殊参数需求
  if (provider === 'aliyun') {
    // 阿里云百炼可能需要特殊的头部
    return fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-DashScope-SSE': 'enable' // 启用流式输出
      },
      body: JSON.stringify(payload),
    });
  }

  return fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
}
