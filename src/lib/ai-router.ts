import type { ChatMessage, ApiProvider } from '@/types';

const API_ENDPOINTS: Record<ApiProvider, string> = {
  siliconflow: 'https://api.siliconflow.cn/v1',
  aliyun: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  deepseek: 'https://api.deepseek.com/v1',
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
  const baseUrl = API_ENDPOINTS[provider];
  const apiUrl = `${baseUrl}/chat/completions`;
  const apiKey = getApiKey(provider);

  console.log(`🚀 Sending request to ${provider} (${modelId})...`);

  const payload = {
    model: modelId,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: true,
    temperature: 0.7,
    max_tokens: 2048,
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  if (provider === 'aliyun') {
    (headers as any)['X-DashScope-SSE'] = 'enable';
  }

  return fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
}

/**
 * 调用图像生成接口
 */
export async function callImageGeneration(
  provider: ApiProvider,
  modelId: string,
  prompt: string,
  options?: { ratio?: string }
): Promise<string> {
  const baseUrl = API_ENDPOINTS[provider];
  const apiUrl = `${baseUrl}/images/generations`;
  const apiKey = getApiKey(provider);

  // 映射比例到 SiliconFlow 支持的格式 (例如 1024x1024)
  const sizeMap: Record<string, string> = {
    '1:1': '1024x1024',
    '4:3': '1024x768',
    '16:9': '1024x576',
  };

  const payload = {
    model: modelId,
    prompt: prompt,
    image_size: sizeMap[options?.ratio || '1:1'] || '1024x1024',
    batch_size: 1,
  };

  console.log(`🎨 Generating image with ${provider} (${modelId})...`);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || '图像生成失败');
  }

  const data = await response.json();
  return data.images?.[0]?.url || data.data?.[0]?.url || '';
}
