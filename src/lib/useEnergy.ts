'use client';

import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const ENERGY_KEY = 'ai_site_energy';
const DEFAULT_ENERGY = 5;

export function useEnergy() {
  const [energy, setEnergy] = useState<number>(DEFAULT_ENERGY);
  const [isCloud, setIsCloud] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    // 初始化本地存储
    const stored = localStorage.getItem(ENERGY_KEY);
    const initialLocalEnergy = stored !== null ? parseInt(stored, 10) : DEFAULT_ENERGY;
    if (stored === null) localStorage.setItem(ENERGY_KEY, DEFAULT_ENERGY.toString());

    // 获取云端数据
    const fetchCloudEnergy = async (uid: string) => {
      const { data } = await supabase.from('profiles').select('energy_balance').eq('id', uid).single();
      if (data) {
        setEnergy(data.energy_balance);
        setIsCloud(true);
      }
    };

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        fetchCloudEnergy(data.user.id);
      } else {
        setEnergy(initialLocalEnergy);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        fetchCloudEnergy(session.user.id);
      } else {
        setUserId(null);
        setIsCloud(false);
        const current = localStorage.getItem(ENERGY_KEY);
        setEnergy(current !== null ? parseInt(current, 10) : DEFAULT_ENERGY);
      }
    });

    // 监听本地变化
    const handleStorageChange = () => {
      if (!isCloud) {
        const current = localStorage.getItem(ENERGY_KEY);
        if (current !== null) setEnergy(parseInt(current, 10));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('energy_updated', handleStorageChange);

    // 监听云端变化
    let channel: any;
    if (userId) {
      channel = supabase.channel(`useEnergy_${userId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, 
          (payload) => setEnergy(payload.new.energy_balance)
        ).subscribe();
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('energy_updated', handleStorageChange);
      authListener.subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, isCloud, userId]);

  const deductEnergy = async (amount = 1) => {
    if (isCloud && userId) {
      const newEnergy = Math.max(0, energy - amount);
      setEnergy(newEnergy); // 乐观更新
      await supabase.from('profiles').update({ energy_balance: newEnergy }).eq('id', userId);
    } else {
      setEnergy((prev) => {
        const newEnergy = Math.max(0, prev - amount);
        localStorage.setItem(ENERGY_KEY, newEnergy.toString());
        window.dispatchEvent(new Event('energy_updated'));
        return newEnergy;
      });
    }
  };

  const addEnergy = async (amount: number) => {
    if (isCloud && userId) {
      const newEnergy = energy + amount;
      setEnergy(newEnergy); // 乐观更新
      await supabase.from('profiles').update({ energy_balance: newEnergy }).eq('id', userId);
    } else {
      setEnergy((prev) => {
        const newEnergy = prev + amount;
        localStorage.setItem(ENERGY_KEY, newEnergy.toString());
        window.dispatchEvent(new Event('energy_updated'));
        return newEnergy;
      });
    }
  };

  return { energy, deductEnergy, addEnergy, isCloud };
}
