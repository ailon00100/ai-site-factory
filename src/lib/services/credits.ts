import { createAdminClient } from '@/lib/supabase/admin';

/**
 * 积分服务 - 处理用户余额校验与消耗记录
 */
export const CreditService = {
  /**
   * 检查用户是否有足够积分
   * @param userId 用户 ID
   * @param requiredCredits 所需积分
   */
  async checkBalance(userId: string, requiredCredits: number = 1): Promise<boolean> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('users_profile')
      .select('credits')
      .eq('id', userId)
      .single();

    if (error || !data) return false;
    return data.credits >= requiredCredits;
  },

  /**
   * 扣除积分并记录日志
   * @param userId 用户 ID
   * @param agentId Agent ID
   * @param creditsToDeduct 扣除金额
   * @param modelId 使用的模型
   */
  async deductAndLog(
    userId: string,
    agentId: string,
    creditsToDeduct: number,
    modelId: string
  ) {
    const supabase = createAdminClient();

    // 使用 RPC 或 事务确保原子性
    // 简化版：直接更新 + 插入日志
    const { error: updateError } = await supabase.rpc('deduct_user_credits', {
      user_id: userId,
      amount: creditsToDeduct
    });

    if (updateError) throw new Error('Credit deduction failed');

    await supabase.from('usage_logs').insert({
      user_id: userId,
      agent_id: agentId,
      model_id: modelId,
      credits_used: creditsToDeduct,
    });
  }
};
