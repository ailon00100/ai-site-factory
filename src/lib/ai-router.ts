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

  console.log(`🚀 Sending request to ${provider} (${modelId})...`);
  
  const payload = {
    model: modelId,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: true,
    temperature: 0.7,
    max_tokens: 2048, // 降低一点 max_tokens 以提高兼容性
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  // 阿里云特殊处理
  if (provider === 'aliyun') {
    (headers as any)['X-DashScope-SSE'] = 'enable';
  }

  return fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
}
