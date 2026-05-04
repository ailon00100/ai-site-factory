import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { localEnergy } = await req.json();

    if (typeof localEnergy !== 'number' || localEnergy <= 0) {
      return NextResponse.json({ success: true, message: '无需同步' });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // 获取当前登录用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未授权或未登录' }, { status: 401 });
    }

    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabaseAdmin = createAdminClient();

    // 查询当前余额
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('energy_balance')
      .eq('id', user.id)
      .single();

    const currentBalance = profile?.energy_balance || 0;
    const newBalance = currentBalance + localEnergy;

    // 更新余额
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ energy_balance: newBalance })
      .eq('id', user.id);

    if (updateError) throw updateError;

    console.log(`✅ [Sync] User ${user.id} synced ${localEnergy} local energy. New balance: ${newBalance}`);

    return NextResponse.json({ success: true, energy_balance: newBalance });
  } catch (error: unknown) {
    console.error('Sync API Error:', error);
    return NextResponse.json({ error: '同步失败' }, { status: 500 });
  }
}
