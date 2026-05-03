-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Agents Table: 存储站群配置
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subdomain TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  model_id TEXT NOT NULL,
  primary_color TEXT DEFAULT '#3b82f6',
  api_provider TEXT DEFAULT 'siliconflow',
  credit_per_use INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  suggested_prompts JSONB DEFAULT '[]',
  industry_info JSONB,
  deploy_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Prompts Table: 存储系统提示词
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  prompt_type TEXT NOT NULL DEFAULT 'system',
  name TEXT DEFAULT 'Default System Prompt',
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Profiles Table: 用户画像与积分余额
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  energy_balance INTEGER DEFAULT 50,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Simple Policies (Allow Read for everyone)
CREATE POLICY "Allow public read on agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Allow public read on prompts" ON prompts FOR SELECT USING (true);
CREATE POLICY "Users can view and update own profile" ON profiles FOR ALL USING (auth.uid() = id);
