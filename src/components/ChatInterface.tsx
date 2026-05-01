'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Loader2, RefreshCw, Paperclip, ImageIcon, Link, FileText, Code } from 'lucide-react';
import type { Agent } from '@/types';
import PricingModal from './PricingModal';
import { useEnergy } from '@/lib/useEnergy';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  agent: Agent;
  fullWidth?: boolean;
}

// ... (getActionButtons logic)

export default function ChatInterface({ agent, fullWidth = false }: ChatInterfaceProps) {
  // ... (states)

  return (
    <div className={`flex-1 flex flex-col w-full px-4 relative ${fullWidth ? '' : 'max-w-4xl mx-auto'}`}>
      {/* 消息列表 */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-8 space-y-6 scrollbar-hide pb-32"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <div className="text-6xl mb-2">{agent.icon}</div>
            <h2 className="text-xl font-medium">我是 {agent.name}</h2>
            <p className="max-w-xs text-sm">您可以问我任何关于 {agent.category} 的问题，我将为您提供专业的解答。</p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-800'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-900 border border-gray-800'
              }`}>
                {msg.content || (isTyping && i === messages.length - 1 ? '...' : '')}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && messages[messages.length - 1]?.content === '' && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center animate-pulse">
              <Bot size={16} />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-2 flex items-center">
              <Loader2 size={16} className="animate-spin text-gray-500" />
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="absolute bottom-0 left-0 right-0 py-6 px-4 bg-gradient-to-t from-black via-black to-transparent border-t border-gray-800/0">
        <div className="max-w-4xl mx-auto w-full">
          {/* 动态附件按钮栏 */}
          <div className="flex flex-wrap gap-2 mb-3">
            {actionButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleActionClick(btn.label)}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900/80 border border-gray-700/50 hover:bg-gray-800 hover:border-gray-600 hover:text-white text-gray-400 text-xs font-medium transition-all backdrop-blur-sm"
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>

          {/* 隐藏的文件选择器 */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
          />

          <form onSubmit={handleSubmit} className="relative shadow-2xl flex flex-col gap-2">
            {/* 选中文件的展示模块 */}
            <AnimatePresence>
              {selectedFile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl w-fit absolute -top-12 left-0"
                >
                  <Paperclip size={14} className="text-blue-400" />
                  <span className="text-xs text-gray-300 truncate max-w-[200px] font-medium">
                    {selectedFile.name}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setSelectedFile(null)} 
                    className="ml-2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
                  >
                    &times;
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedFile ? "输入您对附件的分析要求..." : "输入您的问题..."}
                className="w-full bg-gray-900/90 backdrop-blur-md border border-gray-700/50 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:border-blue-500 focus:bg-gray-900 transition-all text-sm shadow-inner"
              />
              <button
                type="submit"
                disabled={(!input.trim() && !selectedFile) || isTyping}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg"
              >
                <Send size={18} className="text-white" />
              </button>
            </div>
          </form>
          <p className="text-[10px] text-center text-gray-600 mt-3 font-medium">
            AI 可能会生成不准确的信息。由 <span className="text-gray-500">AI Site Factory</span> 提供技术支持。
          </p>
        </div>
      </div>

      {/* 变现弹窗拦截器 */}
      <PricingModal 
        isOpen={isPricingOpen} 
        onClose={() => setIsPricingOpen(false)} 
      />
    </div>
  );
}
