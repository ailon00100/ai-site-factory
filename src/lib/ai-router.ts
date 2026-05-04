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
 * 调用图像生成接口。DeepSeek 和阿里云不提供图像生成，自动回退到 SiliconFlow。
 * SiliconFlow 支持的生图模型: Kwai-Kolors/Kolors, Qwen/Qwen-Image-Edit-2509
 */
export async function callImageGeneration(
  provider: ApiProvider,
  modelId: string,
  prompt: string,
  options?: { ratio?: string; guidance?: number }
): Promise<string> {
  const imageProvider: ApiProvider = 'siliconflow';
  const baseUrl = API_ENDPOINTS[imageProvider];
  const apiUrl = `${baseUrl}/images/generations`;
  const apiKey = getApiKey(imageProvider);

  // FLUX 模型在 images/generations 端点不可用，映射到 Kolors
  let imageModel = modelId;
  if (modelId.toLowerCase().includes('flux')) {
    console.log(`🔄 模型 ${modelId} 不支持生图端点，切换为 Kwai-Kolors/Kolors`);
    imageModel = 'Kwai-Kolors/Kolors';
  }
  if (modelId.toLowerCase().includes('qwen2-vl')) {
    console.log(`🔄 模型 ${modelId} 是视觉理解模型不支持生图，切换为 Kwai-Kolors/Kolors`);
    imageModel = 'Kwai-Kolors/Kolors';
  }

  if (provider !== 'siliconflow') {
    console.log(`🔄 ${provider} 不支持图像生成，自动切换到 SiliconFlow`);
  }

  // Kolors 兼容的分辨率
  const sizeMap: Record<string, string> = {
    '1:1': '1024x1024',
    '4:3': '960x1280',
    '16:9': '720x1440',
  };

  const payload: Record<string, unknown> = {
    model: imageModel,
    prompt: prompt,
    image_size: sizeMap[options?.ratio || '1:1'] || '1024x1024',
    batch_size: 1,
    num_inference_steps: 20,
  };

  if (imageModel === 'Kwai-Kolors/Kolors') {
    payload.guidance_scale = options?.guidance || 7.5;
  }

  console.log(`🎨 Generating image: ${imageModel} (${payload.image_size})...`);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMsg = `图像生成失败 (HTTP ${response.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMsg = errorJson.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data.images?.[0]?.url || '';
}
