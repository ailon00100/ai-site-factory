// scripts/seed-data.mjs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 请在 .env.local 中配置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🚀 开始检查并初始化数据...');

  // 1. 检查 agents 表是否存在且有数据
  const { data: agents, error: fetchError } = await supabase
    .from('agents')
    .select('id, subdomain, name');

  if (fetchError) {
    if (fetchError.code === 'PGRST204' || fetchError.message.includes('not find the table')) {
      console.error('❌ 错误: 数据库表尚未创建！');
      console.log('👉 请先在 Supabase SQL Editor 中运行 supabase/migrations/001_initial_schema.sql');
      return;
    }
    console.error('❌ 获取 Agent 失败:', fetchError.message);
    return;
  }

  if (!agents || agents.length === 0) {
    console.log('⚠️ 提示: agents 表为空。正在尝试重新注入基础数据...');
    // 这里可以补充通过 JS 注入基础数据的逻辑，但建议优先使用 SQL 注入
    console.log('👉 建议直接在 Supabase SQL Editor 中运行迁移文件以获得最完整的数据。');
    return;
  }

  console.log(`✅ 找到 ${agents.length} 个 Agent，正在同步系统提示词...`);

  // 2. 为每个 Agent 注入系统提示词
  const prompts = agents.map(agent => ({
    agent_id: agent.id,
    prompt_type: 'system',
    name: 'Default System Prompt',
    content: `你是一个专业的${agent.name}。你的目标是为用户提供高质量的${agent.subdomain}相关服务。`,
    is_default: true
  }));

  const { error: promptError } = await supabase
    .from('prompts')
    .upsert(prompts, { onConflict: 'agent_id, name' });

  if (promptError) {
    console.error('❌ 注入提示词失败:', promptError.message);
  } else {
    console.log('✨ 数据同步完成！');
  }
}

seed();
