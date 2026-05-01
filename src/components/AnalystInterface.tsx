'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileSearch, Code, ShieldAlert, CheckCircle2, 
  FileText, Upload, ChevronRight, AlertTriangle,
  Terminal, Search, Copy, Download
} from 'lucide-react';
import type { Agent } from '@/types';
import ChatInterface from './ChatInterface';

interface AnalystInterfaceProps {
  agent: Agent;
}

export default function AnalystInterface({ agent }: AnalystInterfaceProps) {
  const [selectedFile, setSelectedFile] = useState<{name: string, content: string} | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // 模拟审计结果
  const [findings, setFindings] = useState<{type: 'risk' | 'info' | 'success', msg: string}[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile({
        name: file.name,
        content: `// 模拟文件内容: ${file.name}\n// 这里将展示文件的真实预览...\n\nfunction analyze() {\n  console.log("正在准备审计环境...");\n}`
      });
      
      // 触发自动审计模拟
      setIsAnalyzing(true);
      setTimeout(() => {
        setFindings([
          { type: 'risk', msg: '检测到 2 处潜在的安全漏洞' },
          { type: 'info', msg: '代码符合行业最佳实践准则' },
          { type: 'success', msg: '性能优化建议已准备就绪' }
        ]);
        setIsAnalyzing(false);
      }, 2000);
    }
  };

  return (
    <div className="flex h-full bg-[#030712]">
      {/* 左侧：源码/预览区 */}
      <div className="flex-1 flex flex-col border-r border-gray-800">
        <div className="h-12 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <Terminal size={14} />
            <span>{selectedFile ? selectedFile.name : '等待上传分析对象...'}</span>
          </div>
          <div className="flex gap-2">
            <button className="p-1.5 hover:bg-gray-800 rounded text-gray-500"><Copy size={14} /></button>
            <button className="p-1.5 hover:bg-gray-800 rounded text-gray-500"><Download size={14} /></button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto bg-[#0d1117] p-6 font-mono text-sm relative">
          {!selectedFile ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-3xl mb-2">
                {agent.icon}
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">准备开始分析</h4>
                <p className="text-gray-500 text-xs max-w-[240px]">请上传需要 {agent.name} 审查的代码、合同或数据文件</p>
              </div>
              <label className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-2">
                <Upload size={14} />
                上传目标文件
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          ) : (
            <pre className="text-gray-300 leading-relaxed">
              <code>{selectedFile.content}</code>
            </pre>
          )}
        </div>

        {/* 审计概览条 */}
        <div className="h-16 border-t border-gray-800 bg-gray-900/30 flex items-center px-6 gap-8">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-xs font-medium text-gray-300">{isAnalyzing ? '正在进行深度扫描...' : '状态：就绪'}</span>
          </div>
          {findings.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {f.type === 'risk' && <AlertTriangle size={14} className="text-red-400" />}
              {f.type === 'info' && <FileSearch size={14} className="text-blue-400" />}
              {f.type === 'success' && <CheckCircle2 size={14} className="text-green-400" />}
              <span className="text-gray-400">{f.msg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧：交互式对话区 */}
      <div className="w-[450px] flex flex-col bg-black/20">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-widest">
            <ShieldAlert size={14} className="text-blue-500" />
            AI 分析报告 & 咨询
          </h3>
          <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gray-400 uppercase">Live</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatInterface agent={agent} fullWidth={true} />
        </div>
      </div>
    </div>
  );
}
