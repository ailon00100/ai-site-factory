'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useEnergy } from '@/lib/useEnergy';
import PricingModal from './PricingModal';
import LoginModal from './LoginModal';
import type { Agent } from '@/types';

interface GlobalHeaderProps {
  agent?: Agent;
}

export default function GlobalHeader({ agent }: GlobalHeaderProps) {
  const { energy, isCloud, userId } = useEnergy();
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleLoginSuccess = async () => {
    setIsLoginOpen(false);
    if (energy > 0 && !isCloud) {
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

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-black/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI Site Factory
          </Link>

          {agent && (
            <div className="flex items-center gap-3 pl-6 border-l border-white/10">
              <span className="text-xl">{agent.icon}</span>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white leading-tight">{agent.name}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">{agent.category}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div
            onClick={() => setIsPricingOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600/20 cursor-pointer transition-colors"
          >
            <span className="text-blue-400 text-sm font-medium">⚡ {energy}</span>
            <span className="text-gray-400 text-xs">次可用</span>
            <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-[10px] rounded-full font-bold">充值</span>
          </div>

          {isCloud ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                {userId?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-xs text-gray-500">已登录</span>
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
