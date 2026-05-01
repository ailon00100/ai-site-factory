import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用 Service Role Key 绕过前端权限，确保核销操作的安全性和原子性
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: '请输入有效的兑换码' }, { status: 400 });
    }

    // 1. 查询卡密是否有效且未被使用
    const { data: codeData, error: fetchError } = await supabaseAdmin
      .from('redemption_codes')
      .select('*')
      .eq('code', code.trim())
      .single();

    if (fetchError || !codeData) {
      return NextResponse.json({ error: '无效的兑换码，请核对后重试' }, { status: 404 });
    }

    if (codeData.is_used) {
      return NextResponse.json({ error: '该兑换码已被使用过，无法重复核销' }, { status: 403 });
    }

    // 2. 执行核销 (更新为已使用)
    const { error: updateError } = await supabaseAdmin
      .from('redemption_codes')
      .update({ 
        is_used: true, 
        used_at: new Date().toISOString() 
      })
      .eq('code', code.trim())
      .eq('is_used', false); // 乐观锁：防止高并发下被重复核销

    if (updateError) {
      return NextResponse.json({ error: '核销失败，请稍后重试' }, { status: 500 });
    }

    // 3. 返回充值点数给前端
    console.log(`✅ [Redeem] Code ${code} redeemed successfully for ${codeData.energy_value} energy.`);
    
    return NextResponse.json({ 
      success: true, 
      energy_value: codeData.energy_value,
      message: '兑换成功！'
    });

  } catch (error: any) {
    console.error('Redeem API Error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
