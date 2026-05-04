'use client';

import { useState, useEffect } from 'react';
import { Agent } from '@/types';
import PricingModal from './PricingModal';
import LoginModal from './LoginModal';
import { useEnergy } from '@/lib/useEnergy';

interface IndustrySidebarProps {
  agent: Agent;
}

export default function IndustrySidebar({ agent }: IndustrySidebarProps) {
  const [tips, setTips] = useState<{ title: string; content: string }[]>(agent.industry_info || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const { energy, isCloud } = useEnergy();

  const subdomain = agent.subdomain;

  useEffect(() => {
    if (tips.length === 0 && subdomain) {
      setIsLoading(true);
      fetch('/api/agent/industry-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.news) setTips(data.news);
        })
        .catch(err => console.error('Industry news fetch failed:', err))
        .finally(() => setIsLoading(false));
    }
  }, [subdomain]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBindAccount = () => {
    setIsLoginOpen(true);
  };

  const handleLoginSuccess = async () => {
    setIsLoginOpen(false);
    if (energy > 0 && !isCloud) {
      try {
        const res = await fetch('/api/sync-energy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ localEnergy: energy }),
        });
        if (res.ok) {
          localStorage.setItem('ai_site_energy', '0');
          window.dispatchEvent(new Event('energy_updated'));
          alert('同步成功！您的本地余额已合并至云端账户。');
        }
      } catch (err) {
        console.error('Failed to sync energy:', err);
      }
    }
  };

  const isPro = !!isCloud;

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
                {energy}
              </span>
              <span className="text-xs text-gray-500">次</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${energy > 0 ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min((energy / (isPro ? 3000 : 50)) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 flex items-center justify-between">
              <span className={energy === 0 ? "text-red-400 font-bold" : ""}>
                {energy === 0 ? '额度已用尽，点击充值' : '点击获取更多使用次数'}
              </span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </p>
          </div>

          {!isCloud && energy > 0 && (
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
