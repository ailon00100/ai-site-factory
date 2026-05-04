import { NextRequest, NextResponse } from 'next/server';

/**
 * 支付订单创建 API (预留接口)
 * 后续接入支付宝/微信支付/Stripe 时，在此处对接支付网关。
 * 当前版本返回兑换码购买指引。
 */
export async function POST(req: NextRequest) {
  try {
    const { planId } = await req.json();

    const plans: Record<string, { name: string; price: string; energy: number }> = {
      starter: { name: '加油包', price: '9.9', energy: 50 },
      pro: { name: '畅玩包', price: '49', energy: 300 },
    };

    const plan = plans[planId];
    if (!plan) {
      return NextResponse.json({ error: '无效的套餐' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      orderId: `ORDER-${Date.now()}`,
      plan,
      message: `请支付 ￥${plan.price} 获取 ${plan.name}兑换码`,
      // 后续接入真实支付后，此处返回支付链接或二维码
      paymentUrl: null,
    });
  } catch (error: unknown) {
    console.error('Create Order Error:', error);
    return NextResponse.json({ error: '创建订单失败' }, { status: 500 });
  }
}
