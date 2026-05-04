export type AgentCategory = 'text' | 'vision' | 'code' | 'business' | 'edu' | 'marketing' | 'lifestyle' | 'multimedia' | 'pro' | 'game';
export type ApiProvider = 'siliconflow' | 'aliyun' | 'deepseek';
export type UiTemplate = 'chat' | 'creative' | 'analyst';

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
  ui_template?: UiTemplate;
  industry_info?: { title: string; content: string }[];
  suggested_prompts?: string[];
  created_at: string;
  last_updated?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
