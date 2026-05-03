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
  const [initialChatMessage, setInitialChatMessage] = useState<string>('');
  
  // 模拟审计结果
  const [findings, setFindings] = useState<{type: 'risk' | 'info' | 'success', msg: string}[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSelectedFile({
        name: file.name,
        content: content || ''
      });
      
      // 触发分析状态
      setIsAnalyzing(true);
      
      // 构建给 AI 的初始指令
      const prompt = `我已经上传了名为 "${file.name}" 的文件，请根据其内容进行详细分析。内容预览如下：\n\n\`\`\`\n${content.slice(0, 1000)}${content.length > 1000 ? '...' : ''}\n\`\`\``;
      setInitialChatMessage(prompt);

      setTimeout(() => {
        const isCode = file.name.match(/\.(js|ts|py|go|java|cpp|html|css)$/i);
        setFindings([
          { type: 'info', msg: `已成功解析 ${file.name} (${(file.size / 1024).toFixed(1)} KB)` },
          { type: isCode ? 'success' : 'info', msg: isCode ? '检测到源代码结构，已准备好进行逻辑审计' : '文本内容已载入，准备进行风险分析' },
          { type: 'risk', msg: '等待用户发起详细咨询指令' }
        ]);
        setIsAnalyzing(false);
      }, 1500);
    };

    if (file.type.startsWith('text/') || 
        file.name.match(/\.(js|ts|tsx|py|go|java|cpp|c|h|cs|php|rb|sql|json|md|txt|yml|yaml|xml)$/i)) {
      reader.readAsText(file);
    } else {
      const msg = `[二进制文件预览暂不支持]\n文件名: ${file.name}\n文件大小: ${(file.size / 1024).toFixed(1)} KB\n类型: ${file.type || '未知'}`;
      setSelectedFile({
        name: file.name,
        content: msg + `\n\n建议直接在右侧咨询 AI 关于该文件的分析建议。`
      });
      setInitialChatMessage(`我已经上传了文件 "${file.name}"，这是一个二进制文件，请根据文件名和类型提供分析建议。`);
      setFindings([{ type: 'risk', msg: '暂不支持直接预览此类文件内容' }]);
    }
  };

  const handleCopy = () => {
    if (selectedFile?.content) {
      navigator.clipboard.writeText(selectedFile.content);
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
            <button 
              onClick={handleCopy}
              className="p-1.5 hover:bg-gray-800 rounded text-gray-500 transition-colors"
              title="复制内容"
            >
              <Copy size={14} />
            </button>
            <button className="p-1.5 hover:bg-gray-800 rounded text-gray-500 transition-colors" title="下载文件">
              <Download size={14} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto bg-[#0d1117] p-6 font-mono text-sm relative">
          {!selectedFile ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-3xl mb-2 shadow-2xl">
                {agent.icon}
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">准备开始分析</h4>
                <p className="text-gray-500 text-xs max-w-[240px]">请上传需要 {agent.name} 审查的代码、合同或数据文件</p>
              </div>
              <label className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95">
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
        <div className="h-16 border-t border-gray-800 bg-gray-900/30 flex items-center px-6 gap-8 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-xs font-medium text-gray-300">{isAnalyzing ? '正在进行深度扫描...' : '状态：就绪'}</span>
          </div>
          {findings.map((f, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-xs flex-shrink-0"
            >
              {f.type === 'risk' && <AlertTriangle size={14} className="text-red-400" />}
              {f.type === 'info' && <FileSearch size={14} className="text-blue-400" />}
              {f.type === 'success' && <CheckCircle2 size={14} className="text-green-400" />}
              <span className="text-gray-400">{f.msg}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 右侧：交互式对话区 */}
      <div className="w-[450px] flex flex-col bg-black/20">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/20">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-widest">
            <ShieldAlert size={14} className="text-blue-500" />
            AI 分析报告 & 咨询
          </h3>
          <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gray-400 uppercase font-bold animate-pulse">Live</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatInterface 
            agent={agent} 
            fullWidth={true} 
            initialMessage={initialChatMessage}
          />
        </div>
      </div>
    </div>
  );
}
