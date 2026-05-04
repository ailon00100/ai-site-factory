-- 4. Usage Logs Table: 记录积分消费
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  model_id TEXT,
  credits_used INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage logs" ON usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage logs" ON usage_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Redemption Codes Table: 兑换码
CREATE TABLE IF NOT EXISTS redemption_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  energy_value INTEGER NOT NULL DEFAULT 50,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE redemption_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on redemption_codes" ON redemption_codes FOR SELECT USING (true);

-- 6. RPC: 原子扣减用户积分
CREATE OR REPLACE FUNCTION deduct_user_credits(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET energy_balance = energy_balance - amount,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = user_id AND energy_balance >= amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits or user not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
