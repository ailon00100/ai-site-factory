import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * 管理端 API: 批量生成兑换码
 * 鉴权: 需要在 .env.local 中配置 ADMIN_API_KEY
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { count = 1, energyValue = 50, prefix = '' } = await req.json();

    if (count < 1 || count > 100) {
      return NextResponse.json({ error: '单次生成数量限制 1-100' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const codes = [];

    for (let i = 0; i < count; i++) {
      const code = prefix
        ? `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
        : crypto.randomUUID().slice(0, 12).toUpperCase();

      codes.push({
        code,
        energy_value: energyValue,
        is_used: false,
      });
    }

    const { error } = await supabase.from('redemption_codes').insert(codes);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      generated: count,
      codes: codes.map(c => c.code),
    });
  } catch (error: unknown) {
    console.error('Generate Codes Error:', error);
    const msg = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
