import { createAdminClient } from '@/lib/supabase/admin';
import type { Agent } from '@/types';

export async function getAgents(): Promise<Agent[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getAgentBySubdomain(subdomain: string): Promise<Agent | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('subdomain', subdomain)
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data;
}

export async function getSystemPrompt(agentId: string): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('prompts')
    .select('content')
    .eq('agent_id', agentId)
    .eq('is_default', true)
    .single();

  if (error || !data) return 'You are a helpful AI assistant.';
  return data.content;
}
