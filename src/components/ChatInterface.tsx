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
}

// 动态生成操作按钮
const getActionButtons = (category: string) => {
  const defaultButtons = [
    { id: 'image', icon: <ImageIcon size={14} />, label: '上传图片' },
    { id: 'url', icon: <Link size={14} />, label: '分析网址' }
  ];

  if (category.includes('法律') || category.includes('咨询')) {
    return [{ id: 'doc', icon: <FileText size={14} />, label: '审查合同 (PDF/Doc)' }, ...defaultButtons];
  }
  if (category.includes('编程') || category.includes('技术') || category.includes('代码')) {
    return [{ id: 'code', icon: <Code size={14} />, label: '审查代码 (Zip/File)' }, ...defaultButtons];
  }
  return [{ id: 'file', icon: <Paperclip size={14} />, label: '上传附件' }, ...defaultButtons];
};

export default function ChatInterface({ agent }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // 引入本地额度引擎
  const { energy, deductEnergy } = useEnergy();
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  const actionButtons = getActionButtons(agent.category || '');

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleActionClick = (label: string) => {
    if (label === '分析网址') {
      setInput('请详细分析这个网页的核心内容和价值点：https://');
      // 延迟一下确保状态更新后再 focus
      setTimeout(() => {
        inputRef.current?.focus();
        // 将光标移动到最后
        const length = inputRef.current?.value.length || 0;
        inputRef.current?.setSelectionRange(length, length);
      }, 50);
    } else {
      // 唤起真实的文件选择器
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // 如果用户只选了文件还没打字，我们可以自动给个提示
      if (!input) {
        const isImage = file.name.match(/\.(png|jpg|jpeg)$/i);
        setInput(`请帮我分析这份${isImage ? '图片' : '文件'}：`);
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || isTyping) return;

    // 额度检查拦截器
    if (energy <= 0) {
      setIsPricingOpen(true);
      return;
    }

    // 组合用户消息和附件标记
    let userMessage = input.trim();
    let base64Image = undefined;

    if (selectedFile) {
      if (selectedFile.type.startsWith('image/')) {
        base64Image = await fileToBase64(selectedFile);
        userMessage = `[上传了图片: ${selectedFile.name}]\n${userMessage || '请分析这张图片'}`;
      } else {
        userMessage = `[附件: ${selectedFile.name}]\n${userMessage}`;
      }
    }

    setInput('');
    setSelectedFile(null);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          image: base64Image,
          subdomain: agent.subdomain,
          history: messages.slice(-6)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || '发送失败，请稍后重试';
        const errorDetails = errorData.details ? ` (${errorData.details})` : '';
        
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `❌ 错误: ${errorMessage}${errorDetails}` }
        ]);
        setIsTyping(false);
        return;
      }

      // 请求成功，执行本地扣费
      deductEnergy(1);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const json = JSON.parse(data);
              const content = json.choices[0]?.delta?.content || '';
              if (content) {
                assistantMessage += content;
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  return [
                    ...prev.slice(0, -1),
                    { ...last, content: assistantMessage }
                  ];
                });
              }
            } catch (e) {
              // 忽略解析失败的块
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，我现在无法响应。请检查网络或稍后再试。' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 relative">
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
