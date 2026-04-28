-- ============================================
-- AI Site Factory - 核心数据库模型 (升级版 v1.1.0)
-- 支持 10 大赛道、100 站点布局
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 表 1: 用户配置文件
CREATE TABLE IF NOT EXISTS public.users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  credits INTEGER NOT NULL DEFAULT 100,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 表 2: Agent 配置（支持 10 大赛道）
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subdomain TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  -- 赛道分类
  category TEXT NOT NULL CHECK (category IN (
    'text', 'vision', 'code', 'business', 'edu', 
    'marketing', 'lifestyle', 'multimedia', 'pro', 'game'
  )),
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  icon TEXT DEFAULT '🤖',
  welcome_message TEXT DEFAULT '你好！我是你的 AI 助手。',
  model_id TEXT NOT NULL,
  api_provider TEXT NOT NULL DEFAULT 'siliconflow' CHECK (api_provider IN ('siliconflow', 'aliyun', 'deepseek')),
  credits_per_call INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deploy_status TEXT DEFAULT 'pending' CHECK (deploy_status IN ('pending', 'deployed', 'error')),
  zeabur_service_id TEXT,
  deploy_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 表 3: 使用日志
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 1,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 表 4: 提示词库
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  prompt_type TEXT NOT NULL DEFAULT 'system' CHECK (prompt_type IN ('system', 'example', 'template')),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 开启 RLS
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- 策略：用户读取自己，所有人读激活的 Agent
CREATE POLICY "Public read active agents" ON public.agents FOR SELECT USING (is_active = true);
CREATE POLICY "Users read own profile" ON public.users_profile FOR SELECT USING (auth.uid() = id);

-- ============================================
-- 注入种子数据：首批核心赛道站点 (20个)
-- ============================================

INSERT INTO public.agents (subdomain, name, description, category, primary_color, icon, model_id, api_provider, credits_per_call) VALUES
-- 第一赛道：内容进化 (Text)
('blog', 'AI 深度博客', '自动生成 SEO 优化的 3000 字长文', 'text', '#6366f1', '📝', 'deepseek-ai/DeepSeek-V3', 'siliconflow', 2),
('xhs', '小红书爆款机', '生成带 Emoji 的爆款种草文案', 'text', '#ff4d4f', '📕', 'deepseek-ai/DeepSeek-V3', 'siliconflow', 1),
-- 第二赛道：设计美学 (Vision)
('logo', 'AI Logo 设计站', '输入品牌名生成矢量灵感', 'vision', '#ec4899', '🎨', 'black-forest-labs/FLUX.1-schnell', 'siliconflow', 5),
('fix', '老照片修复站', '视觉模型修复模糊图片并上色', 'vision', '#10b981', '🖼️', 'Qwen/Qwen2-VL-72B-Instruct', 'siliconflow', 3),
-- 第三赛道：程序员工具 (Code)
('audit', '代码审计站', '上传代码，查找漏洞并修复', 'code', '#0ea5e9', '💻', 'deepseek-ai/DeepSeek-V3', 'siliconflow', 2),
('sql', 'SQL 转换器', '自然语言转复杂 SQL 语句', 'code', '#3b82f6', '📊', 'deepseek-ai/DeepSeek-V3', 'siliconflow', 1),
-- 第四赛道：职场效率 (Business)
('interview', '模拟面试官', '针对特定岗位进行文字/语音对练', 'business', '#f59e0b', '🤝', 'deepseek-ai/DeepSeek-V3', 'siliconflow', 2),
('contract', '合同风险分析', '标记合同中的“霸王条款”', 'business', '#ef4444', '📄', 'Qwen/Qwen2-VL-72B-Instruct', 'siliconflow', 5),
-- 第五赛道：教育学习 (Edu)
('tutor', '苏格拉底私教', '通过提问引导学生思考', 'edu', '#8b5cf6', '🎓', 'deepseek-ai/DeepSeek-V3', 'siliconflow', 1),
('ielts', '雅思作文批改', '按官方标准评分并给改进建议', 'edu', '#f43f5e', '✍️', 'deepseek-ai/DeepSeek-V3', 'siliconflow', 2),
-- 第六赛道：营销电商 (Marketing)
('seo', 'SEO 关键词挖掘', '生成高流量、低竞争关键词', 'marketing', '#14b8a6', '📈', 'deepseek-ai/DeepSeek-V3', 'siliconflow', 1),
('listing', '亚马逊 Listing', '优化海外市场语境的产品描述', 'marketing', '#f97316', '🛒', 'deepseek-ai/DeepSeek-V3', 'siliconflow', 2),
-- 第七赛道：心理生活 (Lifestyle)
('cbt', 'AI 心理树洞', '基于 CBT 疗法的情绪疏导', 'lifestyle', '#fbbf24', '🌿', 'deepseek-ai/DeepSeek-V3', 'siliconflow', 1),
('travel', '旅行计划师', '生成保姆级避人流旅行攻略', 'lifestyle', '#2dd4bf', '✈️', 'deepseek-ai/DeepSeek-V3', 'siliconflow', 1),
-- 第八赛道：多媒体 (Multimedia)
('pod', '播客脚本助手', '长文转对谈式播客脚本', 'multimedia', '#f43f5e', '🎙️', 'deepseek-ai/DeepSeek-V3', 'siliconflow', 2),
('vsum', '视频总结器', '输入链接总结视频干货内容', 'multimedia', '#ef4444', '📺', 'deepseek-ai/DeepSeek-V3', 'siliconflow', 1),
-- 第九赛道：法律专业 (Pro)
('law', '法律咨询助手', '劳动法、婚姻法初步建议', 'pro', '#1e293b', '⚖️', 'deepseek-ai/DeepSeek-V3', 'siliconflow', 3),
('tax', '税务计算器', '跨国身份最优纳税方案计算', 'pro', '#475569', '💰', 'deepseek-ai/DeepSeek-V3', 'siliconflow', 2),
-- 第十赛道：游戏娱乐 (Game)
('trpg', 'TRPG 跑团主持', 'AI 担任 KP/DM 开启无限地下城', 'game', '#7c3aed', '🎲', 'deepseek-ai/DeepSeek-V3', 'siliconflow', 2),
('future', '未来职业预测', '预测 10 年后你的技能价值', 'game', '#c026d3', '🚀', 'deepseek-ai/DeepSeek-V3', 'siliconflow', 1)
ON CONFLICT (subdomain) DO UPDATE SET 
  name = EXCLUDED.name, 
  category = EXCLUDED.category,
  primary_color = EXCLUDED.primary_color,
  icon = EXCLUDED.icon;

-- ============================================
-- 5. 存储过程：原子扣除积分
-- ============================================

CREATE OR REPLACE FUNCTION deduct_user_credits(user_id UUID, amount INT)
RETURNS VOID AS $$
BEGIN
    UPDATE users_profile
    SET credits = credits - amount,
        updated_at = NOW()
    WHERE id = user_id AND credits >= amount;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '余额不足或用户不存在';
    END IF;
END;
$$ LANGUAGE plpgsql;
