// scripts/check-supabase.mjs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function check() {
  console.log('🔍 正在检测 Supabase 连接状态...');
  console.log('🌐 目标 URL:', supabaseUrl);

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 错误: .env.local 中缺失配置信息！');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 测试 1: 尝试读取数据库
  console.log('⏳ 正在测试网络连通性...');
  try {
    const { data, error } = await supabase.from('agents').select('*').limit(1);
    
    if (error) {
      if (error.message.includes('fetch')) {
        console.error('❌ 网络错误: 无法连接到 Supabase，请检查 URL 是否正确。');
      } else if (error.code === 'PGRST204' || error.message.includes('not find the table')) {
        console.log('✅ 网络连接正常！');
        console.log('⚠️ 注意: 数据库表 (agents) 尚未创建。');
      } else {
        console.log('✅ 网络连接正常！');
        console.log('ℹ️ 权限/业务反馈:', error.message);
      }
    } else {
      console.log('✅ 连接完美！数据库表已就绪。');
    }
  } catch (err) {
    console.error('❌ 发生异常:', err.message);
  }

  // 测试 2: 验证 Service Role Key
  if (serviceKey) {
    console.log('\n⏳ 正在验证 Service Role Key...');
    const adminSupabase = createClient(supabaseUrl, serviceKey);
    const { error: adminError } = await adminSupabase.from('agents').select('id').limit(1);
    
    if (adminError && (adminError.message.includes('JWT') || adminError.message.includes('invalid'))) {
      console.error('❌ 凭证错误: 您的 Service Role Key 可能不正确。');
    } else if (!adminError) {
      console.log('✅ Service Role Key 验证通过！');
    } else {
        console.log('ℹ️ Service Role 反馈:', adminError.message);
    }
  }
}

check();
