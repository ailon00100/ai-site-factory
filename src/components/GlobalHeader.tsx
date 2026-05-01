'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEnergy } from '@/lib/useEnergy';
import { createBrowserClient } from '@supabase/ssr';
import PricingModal from './PricingModal';
import LoginModal from './LoginModal';

export default function GlobalHeader() {
  const { energy } = useEnergy();
  const [user, setUser] = useState<any>(null);
  const [cloudBalance, setCloudBalance] = useState<number | null>(null);
  
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const fetchCloudBalance = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('energy_balance')
      .eq('id', userId)
      .single();
    if (data) setCloudBalance(data.energy_balance);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchCloudBalance(data.user.id);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchCloudBalance(session.user.id);
      } else {
        setCloudBalance(null);
      }
    });

    const channel = supabase
      .channel('profile_changes_header')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: user ? `id=eq.${user.id}` : undefined
      }, (payload) => {
        setCloudBalance(payload.new.energy_balance);
      })
      .subscribe();

    return () => { 
      authListener.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [supabase, user?.id]);

  const handleLoginSuccess = async () => {
    setIsLoginOpen(false);
    
    // 如果本地有余额，执行同步合并
    if (energy > 0 && !user) {
      try {
        await fetch('/api/sync-energy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ localEnergy: energy }),
        });
      } catch (err) {
        console.error('Failed to sync energy', err);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const displayEnergy = cloudBalance !== null ? cloudBalance : energy;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-black/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          AI Site Factory
        </Link>

        <div className="flex items-center gap-4">
          <div 
            onClick={() => setIsPricingOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600/20 cursor-pointer transition-colors"
          >
            <span className="text-blue-400 text-sm font-medium">⚡ {displayEnergy}</span>
            <span className="text-gray-400 text-xs">次可用</span>
            <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-[10px] rounded-full font-bold">充值</span>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <button 
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                退出
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsLoginOpen(true)}
              className="text-sm font-medium text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all"
            >
              登录 / 注册
            </button>
          )}
        </div>
      </header>

      <PricingModal 
        isOpen={isPricingOpen} 
        onClose={() => setIsPricingOpen(false)} 
      />
      
      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}
