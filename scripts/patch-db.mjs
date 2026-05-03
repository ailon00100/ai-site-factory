import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function patchSchema() {
  console.log('正在尝试为 agents 表添加 suggested_prompts 列...');
  
  // 由于 Supabase JS SDK 不直接支持 ALTER TABLE，
  // 我们通常需要通过 SQL Editor 执行。
  // 但在某些环境下，我们可以通过 rpc 或者直接执行 raw sql (如果配置了)。
  // 这里我们采用一种“笨”办法：尝试插入一条带该列的数据，如果失败则说明列不存在。
  
  // 实际上，最好的方式是告知用户在 Dashboard 执行：
  // ALTER TABLE agents ADD COLUMN suggested_prompts JSONB DEFAULT '[]';
  
  console.log('⚠️ 请在 Supabase SQL Editor 中执行以下命令：');
  console.log("ALTER TABLE agents ADD COLUMN suggested_prompts JSONB DEFAULT '[]';");
  
  // 尝试直接使用 upsert 看看是否能成功（万一已经有了）
  const { error } = await supabase.from('agents').select('suggested_prompts').limit(1);
  if (error) {
    console.error('❌ 确认列不存在或无权限:', error.message);
  } else {
    console.log('✅ 列已存在，无需操作。');
  }
}

patchSchema();
