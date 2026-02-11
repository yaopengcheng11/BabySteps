
import React, { useState } from 'react';
import { User } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // 模拟后端请求延迟
    setTimeout(() => {
      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email: email,
        username: isLogin ? (email.split('@')[0]) : username
      };
      
      // 在实际部署时，这里应调用 API 验证或创建用户
      onLogin(mockUser);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl shadow-indigo-100 flex items-center justify-center text-indigo-500 mx-auto mb-6 transform -rotate-6">
            <i className="fas fa-baby text-4xl"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">乐心小宝</h1>
          <p className="text-slate-400 mt-2 font-medium">记录成长点滴，AI 守护健康</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl border border-white shadow-indigo-100">
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              登 录
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${!isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              注 册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">用户昵称</label>
                <div className="relative">
                  <i className="fas fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="给起个好听的名字"
                    className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-indigo-100 transition-all outline-none font-bold text-slate-700"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">电子邮箱</label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-indigo-100 transition-all outline-none font-bold text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">安全密码</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-indigo-100 transition-all outline-none font-bold text-slate-700"
                />
              </div>
            </div>

            {isLogin && (
              <div className="text-right">
                <button type="button" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-600 transition-colors">忘记密码？</button>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-500 text-white font-black py-5 rounded-[2rem] hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <i className={`fas ${isLogin ? 'fa-sign-in-alt' : 'fa-user-plus'} text-sm`}></i>
                  <span>{isLogin ? '立即登录' : '创建账号'}</span>
                </>
              )}
            </button>
          </form>

          <p className="text-[10px] text-center text-slate-400 mt-8 font-medium px-4">
            注册即代表您同意我们的 <span className="text-indigo-400 font-bold">用户协议</span> 和 <span className="text-indigo-400 font-bold">隐私条款</span>
          </p>
        </div>
      </div>
    </div>
  );
};
