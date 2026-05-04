'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEnergy } from '@/lib/useEnergy';
import { QrCode, Copy, Check, Zap } from 'lucide-react';

const PRICING_PLANS = [
  {
    id: 'starter',
    name: '加油包',
    price: '9.9',
    energy: 50,
    features: ['50 次 AI 对话', '全站通用', '支持图片生成'],
    popular: true,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'pro',
    name: '畅玩包',
    price: '49',
    energy: 300,
    features: ['300 次 AI 对话', '更低单价 (≈0.16元/次)', '支持所有高级模型'],
    popular: false,
    color: 'from-blue-400 to-cyan-400'
  }
];

export default function PricingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addEnergy } = useEnergy();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleRedeem = async () => {
    if (!code.trim()) {
      setError('请输入兑换码');
      return;
    }

    setIsRedeeming(true);
    setError('');

    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '兑换失败');
      } else {
        addEnergy(data.energy_value);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setCode('');
          onClose();
        }, 2000);
      }
    } catch {
      setError('网络连接错误，请稍后重试');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    const plan = PRICING_PLANS.find(p => p.id === planId);
    if (plan) {
      fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      }).catch(() => {});
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
          >
            {/* 左侧：兑换码输入区 */}
            <div className="w-full md:w-1/2 p-8 lg:p-12 bg-gray-900 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-800">
              <h2 className="text-3xl font-bold text-white mb-2">激活兑换码</h2>
              <p className="text-gray-400 mb-8 text-center text-sm">购买套餐后获得兑换码，在此激活使用</p>

              <div className="w-full max-w-xs space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="输入兑换码"
                    className="w-full bg-gray-800 text-white text-sm rounded-xl py-3 px-4 pr-20 outline-none border border-gray-700 focus:border-purple-500 transition-colors font-mono tracking-wider"
                    onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={isRedeeming}
                    className="absolute right-1 top-1 bottom-1 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs font-bold px-4 rounded-lg transition-colors"
                  >
                    {isRedeeming ? '兑换中...' : '兑换'}
                  </button>
                </div>

                {error && <p className="text-red-400 text-xs">{error}</p>}
                {success && (
                  <p className="text-green-400 text-xs flex items-center gap-1">
                    <Check size={14} />
                    兑换成功！能源已恢复
                  </p>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-800 w-full max-w-xs">
                <p className="text-xs text-gray-500 leading-relaxed">
                  免登录模式下，额度保存在当前浏览器中，请勿清除缓存以免丢失。
                </p>
              </div>
            </div>

            {/* 右侧：套餐介绍 */}
            <div className="w-full md:w-1/2 bg-gray-800/30 p-8 lg:p-12">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Zap size={20} className="text-yellow-500" />
                选择套餐
              </h3>
              <div className="space-y-4">
                {PRICING_PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full text-left relative p-6 rounded-2xl border transition-all duration-300 ${
                      selectedPlan === plan.id
                        ? 'bg-gray-800/80 border-purple-500/50 shadow-lg ring-1 ring-purple-500/20'
                        : plan.popular
                          ? 'bg-gray-800/40 border-gray-700 hover:border-gray-600'
                          : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 right-6 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                        推荐
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                        <p className="text-sm text-gray-400">{plan.energy} 次使用</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-white">￥{plan.price}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {plan.features.map((feature, i) => (
                        <span key={i} className="text-[10px] px-2 py-1 bg-gray-800 rounded border border-gray-700 text-gray-300">
                          {feature}
                        </span>
                      ))}
                    </div>
                    {selectedPlan === plan.id && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-xs text-purple-400 mt-3 pt-3 border-t border-gray-700/50"
                      >
                        请联系客服完成支付获取兑换码，或通过管理后台生成
                      </motion.p>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-8 p-4 bg-gray-800/50 rounded-xl">
                <h4 className="text-xs font-bold text-white mb-2">购买流程</h4>
                <div className="space-y-2">
                  {['选择套餐', '完成支付', '获取兑换码', '在此激活'].map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                        {i + 1}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-white bg-gray-800 rounded-full p-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
