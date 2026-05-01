'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEnergy } from '@/lib/useEnergy';

const PRICING_PLANS = [
  {
    id: 'starter',
    name: '加油包',
    price: '9.9',
    energy: '50',
    features: ['免登录直接使用', '全站通用', '支持图片生成'],
    popular: true,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'pro',
    name: '畅玩包',
    price: '49',
    energy: '300',
    features: ['更低单价', '全站通用', '支持所有高级模型'],
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

  const handleRedeem = async () => {
    if (!code.trim()) {
      setError('兑换码不能为空');
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
        // 兑换成功，将数据库返回的真实能量值加到本地
        addEnergy(data.energy_value);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setCode('');
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError('网络连接错误，请稍后重试');
    } finally {
      setIsRedeeming(false);
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
            {/* 左侧：扫码充值区 */}
            <div className="w-full md:w-1/2 p-8 lg:p-12 bg-gray-900 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-800">
              <h2 className="text-3xl font-bold text-white mb-2">补充能源</h2>
              <p className="text-gray-400 mb-8 text-center text-sm">微信 / 支付宝扫码支付，获取兑换码</p>
              
              <div className="w-48 h-48 bg-white rounded-xl p-2 mb-8 flex items-center justify-center shadow-lg shadow-purple-500/10">
                <div className="w-full h-full border-4 border-dashed border-gray-200 rounded-lg flex items-center justify-center flex-col">
                   <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                   </svg>
                   <span className="text-xs text-gray-400 font-medium">请在此放置收款码</span>
                </div>
              </div>

              <div className="w-full max-w-xs relative">
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="请输入支付后获取的卡密" 
                  className="w-full bg-gray-800 text-white text-sm rounded-xl py-3 px-4 outline-none border border-gray-700 focus:border-purple-500 transition-colors"
                />
                <button 
                  onClick={handleRedeem}
                  disabled={isRedeeming}
                  className="absolute right-1 top-1 bottom-1 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs font-bold px-4 rounded-lg transition-colors"
                >
                  {isRedeeming ? '兑换中...' : '兑换'}
                </button>
              </div>
              
              {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
              {success && <p className="text-green-400 text-xs mt-3 flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> 充值成功！已为您恢复能源。</p>}
            </div>

            {/* 右侧：套餐介绍 */}
            <div className="w-full md:w-1/2 bg-gray-800/30 p-8 lg:p-12">
              <h3 className="text-xl font-bold text-white mb-6">选择套餐</h3>
              <div className="space-y-4">
                {PRICING_PLANS.map((plan) => (
                  <div 
                    key={plan.id}
                    className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                      plan.popular ? 'bg-gray-800/80 border-purple-500/50 shadow-lg' : 'bg-gray-900/50 border-gray-800'
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
                        <p className="text-sm text-gray-400">包含 {plan.energy} 次使用权</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-white">￥{plan.price}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {plan.features.slice(0, 2).map((feature, i) => (
                        <span key={i} className="text-[10px] px-2 py-1 bg-gray-800 rounded border border-gray-700 text-gray-300">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-xs text-gray-500 leading-relaxed">
                <p>⚠️ 免登录模式下，您的额度保存在当前浏览器中，请勿清除浏览器缓存以免丢失。</p>
                <p className="mt-2">购买后请复制卡密到左侧兑换框激活。</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-white bg-gray-800 rounded-full p-2"
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
