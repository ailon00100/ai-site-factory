'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    
    setLoading(true);
    setError('');

    // 为了实现免邮箱注册，我们给普通的用户名在后台自动拼接一个虚拟域名
    const authEmail = `${username.trim()}@aifactory.local`;

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: authEmail,
          password,
        });
        if (signUpError) throw signUpError;
        // Supabase default auto-confirms or sends email depending on settings.
        // Assuming auto-confirm for this demo.
        onSuccess();
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });
        if (signInError) throw signInError;
        onSuccess();
      }
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('账号或密码错误');
      } else if (err.message?.includes('User already registered')) {
        setError('该账号已被注册，请直接登录');
      } else {
        setError(err.message || '认证失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              {isSignUp ? '创建云端账号' : '登录云端账号'}
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              {isSignUp ? '注册即可将本地体验额度永久同步至云端' : '欢迎回来，登录以同步您的云端能源'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">用户名/账号</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-gray-800 text-white text-sm rounded-xl py-3 px-4 outline-none border border-gray-700 focus:border-blue-500 transition-colors"
                  placeholder="输入一个好记的账号"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">密码</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-gray-800 text-white text-sm rounded-xl py-3 px-4 outline-none border border-gray-700 focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-bold transition-opacity flex justify-center items-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSignUp ? '注册并同步数据' : '立即登录'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                {isSignUp ? '已有账号？点击登录' : '没有账号？点击注册'}
              </button>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-white bg-gray-800 rounded-full p-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
