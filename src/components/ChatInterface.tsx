'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Loader2, RefreshCw, Paperclip, ImageIcon, Link, FileText, Code, Sparkles } from 'lucide-react';
import type { Agent, ChatMessage } from '@/types';
import PricingModal from './PricingModal';
import { useEnergy } from '@/lib/useEnergy';

interface ChatInterfaceProps {
  agent: Agent;
  fullWidth?: boolean;
  initialMessage?: string;
}

export default function ChatInterface({ agent, fullWidth = false, initialMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { energy, deductEnergy } = useEnergy();

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // 处理初始消息 (例如来自 AnalystInterface 的联动)
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      setInput(initialMessage);
    }
  }, [initialMessage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !selectedFile) || isTyping) return;

    // 检查余额
    if (energy <= 0) {
      setIsPricingOpen(true);
      return;
    }

    const userMessage = input.trim();
    const currentPreview = filePreview;

    // 清空输入
    setInput('');
    setSelectedFile(null);
    setFilePreview(null);
    setIsTyping(true);

    // 添加用户消息到列表
    const newUserMsg: ChatMessage = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, newUserMsg]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          image: currentPreview,
          subdomain: agent.subdomain,
          history: messages.slice(-6),
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader found');

      const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMsg]);

      const decoder = new TextDecoder();
      let done = false;
      let accumulatedContent = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        
        const lines = chunkValue.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '');
            if (dataStr === '[DONE]') break;
            try {
              const data = JSON.parse(dataStr);
              const content = data.choices?.[0]?.delta?.content || '';
              accumulatedContent += content;
              setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1].content = accumulatedContent;
                return newMsgs;
              });
            } catch (e) {}
          } else {
            accumulatedContent += chunkValue;
            setMessages(prev => {
              const newMsgs = [...prev];
              newMsgs[newMsgs.length - 1].content = accumulatedContent;
              return newMsgs;
            });
          }
        }
      }

      await deductEnergy(agent.credit_per_use || 1);

    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，我现在遇到了一点技术问题，请稍后再试。' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const actionButtons = useMemo(() => {
    const base = [
      { id: 'image', label: '上传图片', icon: <ImageIcon size={14} />, type: 'file', accept: 'image/*' },
      { id: 'file', label: '上传文档', icon: <FileText size={14} />, type: 'file', accept: '.pdf,.doc,.docx,.txt' },
    ];
    if (agent.category === 'code') {
      base.unshift({ id: 'debug', label: '帮我找 Bug', icon: <Code size={14} />, type: 'text', accept: '' });
    }
    return base;
  }, [agent.category]);

  const handleActionClick = (btn: any) => {
    if (btn.type === 'file') {
      fileInputRef.current?.click();
    } else {
      setInput(btn.label);
      inputRef.current?.focus();
    }
  };

  return (
    <div className={`flex-1 flex flex-col w-full px-4 relative ${fullWidth ? '' : 'max-w-4xl mx-auto'}`}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-8 space-y-6 scrollbar-hide pb-48">
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

      <div className="absolute bottom-0 left-0 right-0 py-6 px-4 bg-gradient-to-t from-black via-black to-transparent">
        <div className="max-w-4xl mx-auto w-full space-y-4">
          {/* Suggested Prompts */}
          {messages.length === 0 && agent.suggested_prompts && (
            <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700">
              {agent.suggested_prompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 hover:border-blue-500/20 text-blue-400 text-xs transition-all flex items-center gap-1.5 group"
                >
                  <Sparkles size={12} className="group-hover:rotate-12 transition-transform" />
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {actionButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleActionClick(btn)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900/80 border border-gray-700/50 hover:bg-gray-800 hover:border-gray-600 text-gray-400 text-xs font-medium transition-all backdrop-blur-sm"
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept={actionButtons.find(b => b.id === 'image')?.accept || '*/*'}
          />

          <form onSubmit={handleSubmit} className="relative shadow-2xl flex flex-col gap-2">
            <AnimatePresence>
              {(selectedFile || filePreview) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl w-fit absolute -top-12 left-0"
                >
                  {filePreview ? (
                    <img src={filePreview} alt="Preview" className="w-6 h-6 rounded object-cover" />
                  ) : (
                    <Paperclip size={14} className="text-blue-400" />
                  )}
                  <span className="text-xs text-gray-300 truncate max-w-[200px] font-medium">
                    {selectedFile?.name || '图片已就绪'}
                  </span>
                  <button 
                    type="button"
                    onClick={() => { setSelectedFile(null); setFilePreview(null); }} 
                    className="ml-2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300"
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
                placeholder="输入您的问题..."
                className="w-full bg-gray-900/90 backdrop-blur-md border border-gray-700/50 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:border-blue-500 transition-all text-sm shadow-inner"
              />
              <button
                type="submit"
                disabled={(!input.trim() && !selectedFile) || isTyping}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center disabled:opacity-50 transition-all shadow-lg"
              >
                <Send size={18} className="text-white" />
              </button>
            </div>
          </form>
        </div>
      </div>
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
    </div>
  );
}
