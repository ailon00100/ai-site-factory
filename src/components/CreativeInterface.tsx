'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, User, Bot, Loader2, Image as ImageIcon, 
  Settings2, Download, RefreshCw, Layers, 
  Maximize2, Share2, Palette, Zap, Sparkles,
  Copy, Check, Play
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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { energy, deductEnergy } = useEnergy();

  const [settings, setSettings] = useState({
    ratio: '1:1',
    style: 'realistic',
    quality: 'high',
    guidance: 7.5
  });

  const handleGenerate = async (overridePrompt?: string) => {
    const activePrompt = overridePrompt || prompt;
    if (!activePrompt.trim() || isGenerating) return;
    
    const cost = agent.credit_per_use || 5;
    if (energy < cost) {
      setIsPricingOpen(true);
      return;
    }

    setIsGenerating(true);
    setResultImage(null);
    if (overridePrompt) setPrompt(overridePrompt);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${activePrompt} (Style: ${settings.style}, Ratio: ${settings.ratio})`,
          subdomain: agent.subdomain,
          options: settings 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          setResultImage(data.url);
          await deductEnergy(cost);
        } else {
          throw new Error('未获取到图片地址');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '生成失败');
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : '未知错误';
      alert(`生成失败: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadImage = async () => {
    if (!resultImage) return;
    try {
      const response = await fetch(resultImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${agent.subdomain}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('下载失败:', err);
    }
  };

  return (
    <div className="flex h-full bg-[#030712] overflow-hidden">
      <div className="w-80 border-r border-gray-800 bg-gray-900/30 p-6 flex flex-col gap-8 overflow-y-auto scrollbar-hide">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-white text-sm font-bold tracking-tight uppercase">
            <Settings2 size={16} className="text-blue-500" />
            <span>创作实验室</span>
          </div>
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">画布比例</label>
              <div className="grid grid-cols-3 gap-2">
                {['1:1', '4:3', '16:9'].map(r => (
                  <button
                    key={r}
                    onClick={() => setSettings({...settings, ratio: r})}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      settings.ratio === r 
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                      : 'border-gray-800 bg-gray-900/50 text-gray-500 hover:border-gray-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">艺术风格</label>
              <select 
                value={settings.style}
                onChange={(e) => setSettings({...settings, style: e.target.value})}
                className="w-full bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="realistic">写实摄影</option>
                <option value="anime">二次元动漫</option>
                <option value="cyberpunk">赛博朋克</option>
                <option value="oil">经典油画</option>
                <option value="3d">3D 建模渲染</option>
                <option value="sketch">素描手绘</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-auto pt-6 border-t border-gray-800/50">
          <div className="flex items-center justify-between mb-5 px-1">
            <span className="text-xs text-gray-500 font-medium">预计消耗</span>
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-black text-white">{agent.credit_per_use || 5}</span>
            </div>
          </div>
          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Palette size={20} />}
            {isGenerating ? 'AI 正在全力构思...' : '开始魔法创作'}
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_center,rgba(30,58,138,0.05)_0%,transparent_100%)]">
        <div className="flex-1 p-8 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {!resultImage && !isGenerating ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-center space-y-6 max-w-sm"
              >
                <div className="w-24 h-24 bg-gray-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-5xl border border-gray-800 shadow-2xl shadow-blue-500/10 rotate-3">
                  {agent.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white tracking-tight">开启您的视觉创意</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">在下方描述您的想象，AI 将瞬间为您捕捉那一抹灵感之光。</p>
                </div>
              </motion.div>
            ) : isGenerating ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="relative"
              >
                <div className="w-[500px] aspect-square bg-gray-900 border border-gray-800 rounded-[2rem] flex flex-col items-center justify-center gap-8 overflow-hidden relative shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 via-transparent to-indigo-600/5 animate-pulse" />
                  <Loader2 size={48} className="animate-spin text-blue-500 opacity-80" />
                  <div className="text-center space-y-3 relative z-10 px-12">
                    <p className="text-blue-400 font-bold tracking-widest uppercase text-xs animate-bounce">AI 深度渲染中</p>
                    <p className="text-gray-500 text-xs italic line-clamp-2">"{prompt}"</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                className="relative group max-h-full p-4"
              >
                <div className="relative overflow-hidden rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-gray-800/50">
                  <img 
                    src={resultImage!} 
                    alt="Generated" 
                    className="max-h-[65vh] w-auto object-contain bg-gray-900 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8 gap-4">
                    <button 
                      onClick={downloadImage}
                      className="flex-1 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
                    >
                      <Download size={16} /> 保存到本地
                    </button>
                    <button className="p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all">
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="p-8 bg-gradient-to-t from-black via-black/80 to-transparent space-y-6">
          {/* 灵感推荐 */}
          {agent.suggested_prompts && agent.suggested_prompts.length > 0 && (
            <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
              {agent.suggested_prompts.map((p, i) => (
                <div 
                  key={i}
                  className="group relative flex items-center gap-2 bg-gray-900/50 hover:bg-blue-500/10 border border-gray-800 hover:border-blue-500/50 rounded-xl px-4 py-2 transition-all cursor-pointer overflow-hidden"
                >
                  <button 
                    onClick={() => handleGenerate(p)}
                    className="text-xs text-gray-400 group-hover:text-blue-400 font-medium whitespace-nowrap"
                  >
                    {p}
                  </button>
                  <div className="flex items-center gap-1 ml-1 pl-2 border-l border-gray-800 group-hover:border-blue-500/30">
                    <button 
                      onClick={() => handleCopy(p, i)}
                      className="text-gray-600 hover:text-white transition-colors p-1"
                      title="复制提示词"
                    >
                      {copiedIndex === i ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                    <button 
                      onClick={() => handleGenerate(p)}
                      className="text-gray-600 hover:text-blue-400 transition-colors p-1"
                      title="立即生成"
                    >
                      <Play size={12} className="fill-current" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：一个在赛博朋克城市屋顶沉思的宇航员..."
              className="relative w-full bg-gray-900/90 border border-gray-800 rounded-2xl p-6 pr-24 focus:outline-none focus:border-blue-500/50 transition-all text-sm min-h-[120px] max-h-[200px] resize-none text-gray-200 placeholder:text-gray-600 shadow-inner"
            />
          </div>
        </div>
      </div>
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
    </div>
  );
}
