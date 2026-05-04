import { createAdminClient } from '@/lib/supabase/admin';

export const CreditService = {
  async checkBalance(userId: string, requiredCredits: number = 1): Promise<boolean> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('energy_balance')
      .eq('id', userId)
      .single();

    if (error || !data) return false;
    return data.energy_balance >= requiredCredits;
  },

  async deductAndLog(
    userId: string,
    agentId: string,
    creditsToDeduct: number,
    modelId: string
  ) {
    const supabase = createAdminClient();

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
