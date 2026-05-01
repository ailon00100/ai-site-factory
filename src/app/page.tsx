'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { Agent, AgentCategory } from '@/types';
import GlobalHeader from '@/components/GlobalHeader';

const CATEGORY_LABELS: Record<string, string> = {
  text: '文本创作',
  vision: '图像生成',
  code: '程序员工具',
  business: '商业职场',
  edu: '教育学习',
  marketing: '营销电商',
  lifestyle: '心理生活',
  multimedia: '多媒体影音',
  pro: '专业咨询',
  game: '游戏科幻',
};

export default function HomePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AgentCategory | 'all'>('all');

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch('/api/agents');
        const data = await res.json();
        
        // 确保 data 是数组，防止非 200 响应导致前端崩溃
        if (Array.isArray(data)) {
          setAgents(data);
        } else {
          console.error('API 返回格式错误:', data);
          setAgents([]);
        }
      } catch (err) {
        console.error('Failed to fetch agents:', err);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, []);

  const filteredAgents = filter === 'all' 
    ? agents 
    : agents.filter(a => a.category === filter);

  return (
    <>
      <GlobalHeader />
      <main className="min-h-screen bg-[#030712] text-white pt-16">
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 px-6 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full" />
          
          <div className="max-w-6xl mx-auto relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent"
          >
            AI Site Factory
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
          >
            10 大赛道，100+ 垂直领域 AI Agent。一键开启您的自动化 AI 矩阵。
          </motion.p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="max-w-6xl mx-auto px-6 mb-12">
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === 'all' ? 'bg-white text-black' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}
          >
            全部赛道
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key as AgentCategory)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === key ? 'bg-white text-black' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Agent Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-gray-900/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredAgents.map((agent) => (
                <motion.div
                  key={agent.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  className="group relative p-6 rounded-2xl bg-gray-900/40 border border-gray-800 hover:border-gray-700 transition-all overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="text-4xl">{agent.icon}</span>
                  </div>
                  
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-xl"
                    style={{ backgroundColor: `${agent.primary_color}20`, color: agent.primary_color }}
                  >
                    {agent.icon}
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">{agent.name}</h3>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-2">{agent.description}</p>
                  
                  <Link 
                    href={`/agent/${agent.subdomain}`}
                    className="inline-flex items-center text-sm font-medium text-white group-hover:translate-x-1 transition-transform"
                  >
                    立即体验
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
    </main>
    </>
  );
}
