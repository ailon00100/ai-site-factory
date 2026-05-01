'use client';

import { useState, useEffect, useMemo } from 'react';
import { Agent } from '@/types';
import PricingModal from './PricingModal';
import LoginModal from './LoginModal';
import { useEnergy } from '@/lib/useEnergy';
import { createBrowserClient } from '@supabase/ssr';

interface IndustrySidebarProps {
  agent: Agent;
}

export default function IndustrySidebar({ agent }: IndustrySidebarProps) {
  const [tips, setTips] = useState<any[]>(agent.industry_info as any[] || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  // 使用本地免登录能源系统
  const { energy, deductEnergy } = useEnergy();
  
  // 检查是否已登录及云端余额
  const [user, setUser] = useState<any>(null);
  const [cloudBalance, setCloudBalance] = useState<number | null>(null);

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

    // 监听云端余额变动
    const channel = supabase
      .channel('profile_changes_sidebar')
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

  // 使用稳定的依赖项
  const subdomain = agent.subdomain;

  useEffect(() => {
    const initRefresh = async () => {
      if (tips.length === 0 && subdomain) {
        setIsLoading(true);
        try {
          const res = await fetch('/api/agent/industry-news', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subdomain }),
          });
          const data = await res.json();
          if (data.news) {
            setTips(data.news);
          }
        } catch (err) {
          console.error('Initial content generation failed:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initRefresh();
  }, [subdomain, tips.length]);

  const handleBindAccount = () => {
    setIsLoginOpen(true);
  };

  const handleLoginSuccess = async () => {
    setIsLoginOpen(false);
    
    // 如果本地有余额，执行同步合并
    // 此时 user 还未完全更新到 state，所以 energy 仍是本地余额
    if (energy > 0 && !user) {
      try {
        const res = await fetch('/api/sync-energy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ localEnergy: energy }),
        });
        
        if (res.ok) {
          // 同步成功后，直接清空本地缓存的额度，防止后续退出登录时重复使用
          localStorage.setItem('ai_site_energy', '0');
          window.dispatchEvent(new Event('energy_updated'));
          alert('同步成功！您的本地余额已合并至云端账户。');
        }
      } catch (err) {
        console.error('Failed to sync energy:', err);
      }
    }
  };

  // 决定显示哪个余额
  const displayEnergy = user && cloudBalance !== null ? cloudBalance : energy;
  const isPro = !!user;

  return (
    <>
      <aside className="w-80 hidden lg:flex flex-col p-6 space-y-6 overflow-y-auto border-l border-gray-800/50 bg-gray-900/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
            行业动态与情报
          </h3>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-800/50 rounded-xl"></div>
              ))}
            </div>
          ) : (
            tips.map((tip, i) => (
              <div 
                key={i} 
                className="group p-4 rounded-xl bg-gray-900/40 border border-gray-800 hover:border-blue-500/30 hover:bg-gray-900/60 transition-all duration-300 relative overflow-hidden"
              >
                <h4 className="text-sm font-medium text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {tip.title}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                  {tip.content}
                </p>
              </div>
            ))
          )}
          
          {!isLoading && tips.length === 0 && (
            <p className="text-xs text-gray-500 italic text-center py-10">
              正在召唤 AI 深度分析行业数据...
            </p>
          )}
        </div>
        
        <div className="mt-auto space-y-4">
          {/* 变现入口：余额卡片 */}
          <div 
            onClick={() => setIsPricingOpen(true)}
            className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {isPro ? '云端能源账户' : '当前剩余体验'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-[10px] text-blue-400 font-bold">
                {isPro ? 'PRO' : '体验版'}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">
                {displayEnergy}
              </span>
              <span className="text-xs text-gray-500">次</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${displayEnergy > 0 ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-red-500'}`} 
                style={{ width: `${Math.min((displayEnergy / (isPro ? 3000 : 50)) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 flex items-center justify-between">
              <span className={displayEnergy === 0 ? "text-red-400 font-bold" : ""}>
                {displayEnergy === 0 ? '额度已用尽，点击充值' : '点击获取更多使用次数'}
              </span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </p>
          </div>

          {/* 渐进式登录引导按钮 */}
          {!user && energy > 0 && (
            <div 
              onClick={handleBindAccount}
              className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <h4 className="text-[11px] font-bold text-orange-400 mb-1">云端同步提示</h4>
                  <p className="text-[10px] text-orange-300/80 leading-relaxed">
                    您当前的 <span className="font-bold text-orange-300">{energy}</span> 次体验额度仅保存在本机。点击绑定账号，永久保存至云端防丢失。
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">AI 专家在线</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-normal">
              系统已连接至最新深度模型。建议结合侧边栏的情报向 AI 提问以获取更精准的建议。
            </p>
          </div>
        </div>
      </aside>

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
