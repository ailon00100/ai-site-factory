'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, User, Bot, Loader2, Image as ImageIcon, 
  Settings2, Download, RefreshCw, Layers, 
  Maximize2, Share2, Palette, Zap
} from 'lucide-react';
import type { Agent } from '@/types';
import PricingModal from './PricingModal';
import { useEnergy } from '@/lib/useEnergy';

interface CreativeInterfaceProps {
  agent: Agent;
}

export default function CreativeInterface({ agent }: CreativeInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const { energy, deductEnergy } = useEnergy();

  // 创意参数状态
  const [settings, setSettings] = useState({
    ratio: '1:1',
    style: 'realistic',
    quality: 'high',
    guidance: 7.5
  });

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    if (energy <= 0) {
      setIsPricingOpen(true);
      return;
    }

    setIsGenerating(true);
    // 模拟生成过程
    try {
      // 这里未来对接真正的图片生成 API
      // 目前调用 /api/chat 模拟响应
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `生成一张${settings.style}风格的图片，描述为：${prompt}`,
          subdomain: agent.subdomain,
        }),
      });

      if (response.ok) {
        deductEnergy(agent.credit_per_use || 5);
        // 演示用：设置一个随机图片
        setResultImage(`https://picsum.photos/seed/${Math.random()}/800/800`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-full bg-[#030712] overflow-hidden">
      {/* 左侧参数面板 */}
      <div className="w-80 border-r border-gray-800 bg-gray-900/30 p-6 flex flex-col gap-8 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
            <Settings2 size={16} />
            <span>生成参数</span>
          </div>
          
          {/* 比例选择 */}
          <div className="space-y-3">
            <label className="text-xs text-gray-500 uppercase tracking-wider">画面比例</label>
            <div className="grid grid-cols-3 gap-2">
              {['1:1', '4:3', '16:9'].map(r => (
                <button
                  key={r}
                  onClick={() => setSettings({...settings, ratio: r})}
                  className={`py-2 rounded-lg border text-xs transition-all ${
                    settings.ratio === r 
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                    : 'border-gray-800 bg-gray-800/50 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 风格选择 */}
          <div className="space-y-3">
            <label className="text-xs text-gray-500 uppercase tracking-wider">艺术风格</label>
            <select 
              value={settings.style}
              onChange={(e) => setSettings({...settings, style: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
            >
              <option value="realistic">写实摄影</option>
              <option value="anime">二次元动漫</option>
              <option value="cyberpunk">赛博朋克</option>
              <option value="oil">油画质感</option>
              <option value="3d">3D 渲染</option>
            </select>
          </div>

          {/* 提示词引导强度 */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-xs text-gray-500 uppercase tracking-wider">引导强度 (CFG)</label>
              <span className="text-xs text-blue-400">{settings.guidance}</span>
            </div>
            <input 
              type="range" min="1" max="20" step="0.5"
              value={settings.guidance}
              onChange={(e) => setSettings({...settings, guidance: parseFloat(e.target.value)})}
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-gray-500">消耗额度</span>
            <span className="text-sm font-bold text-white">{agent.credit_per_use || 5} ⚡</span>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
            {isGenerating ? '正在创作中...' : '立即生成'}
          </button>
        </div>
      </div>

      {/* 右侧主画布区域 */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 p-8 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {!resultImage && !isGenerating ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center space-y-4 max-w-sm"
              >
                <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl border border-gray-800">
                  {agent.icon}
                </div>
                <h3 className="text-xl font-bold text-white">开始您的创意之旅</h3>
                <p className="text-gray-500 text-sm">在下方输入您的灵感描述，AI 将瞬间为您呈现精美的视觉作品。</p>
              </motion.div>
            ) : isGenerating ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="relative group"
              >
                <div className="w-[500px] aspect-square bg-gray-900 border border-gray-800 rounded-2xl flex flex-col items-center justify-center gap-6 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent animate-pulse" />
                  <Loader2 size={40} className="animate-spin text-blue-500 relative z-10" />
                  <div className="text-center relative z-10">
                    <p className="text-blue-400 font-medium animate-pulse">AI 正在构思画面...</p>
                    <p className="text-gray-500 text-xs mt-2 italic">"{prompt.slice(0, 30)}..."</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="relative group max-h-full"
              >
                <img 
                  src={resultImage!} 
                  alt="Generated" 
                  className="rounded-2xl shadow-2xl border border-gray-800 max-h-[70vh] object-contain bg-gray-900"
                />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-black/80"><Download size={18} /></button>
                  <button className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-black/80"><Maximize2 size={18} /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 底部输入框 */}
        <div className="p-6 bg-gradient-to-t from-black to-transparent">
          <div className="max-w-3xl mx-auto relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述您想要生成的画面细节、光影、构图..."
              className="w-full bg-gray-900/80 border border-gray-700 rounded-2xl p-5 pr-16 focus:outline-none focus:border-blue-500 transition-all text-sm min-h-[100px] resize-none shadow-2xl"
            />
            <div className="absolute bottom-4 right-4 text-xs text-gray-500 flex items-center gap-4">
              <span>{prompt.length}/500</span>
              <button 
                onClick={() => setPrompt('')}
                className="hover:text-white transition-colors"
              >
                清空
              </button>
            </div>
          </div>
        </div>
      </div>

      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
    </div>
  );
}
