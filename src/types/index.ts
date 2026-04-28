export type AgentCategory = 'text' | 'image' | 'vision' | 'audio' | 'video' | 'search' | 'code' | 'business' | 'edu' | 'marketing' | 'lifestyle' | 'pro' | 'game';
export type ApiProvider = 'siliconflow' | 'aliyun' | 'deepseek';

export interface Agent {
  id: string;
  subdomain: string;
  name: string;
  description: string;
  category: AgentCategory;
  primary_color: string;
  icon: string;
  model_id: string;
  api_provider: ApiProvider;
  credit_per_use: number;
  is_active: boolean;
  created_at: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  subdomain: string;
}
