
import React, { useState, useEffect } from 'react';
import { BabyLog, BabyProfile } from '../types';
import { getDailyAdvice } from '../services/geminiService';

interface AIAdviceSectionProps {
  profile: BabyProfile;
  logs: BabyLog[];
}

export const AIAdviceSection: React.FC<AIAdviceSectionProps> = ({ profile, logs }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAdvice = async () => {
    setLoading(true);
    const result = await getDailyAdvice(profile, logs);
    setAdvice(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchAdvice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
            <i className="fas fa-sparkles"></i>
          </div>
          <h3 className="text-xl font-bold">AI 育儿专家建议</h3>
        </div>
        
        {loading ? (
          <div className="py-10 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
            <p className="text-white/70 text-sm italic">正在分析宝宝的记录，请稍等...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 leading-relaxed text-sm">
              {advice || "暂时没有收到建议，请尝试刷新。"}
            </div>
            <button 
              onClick={fetchAdvice}
              className="w-full bg-white text-indigo-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              刷新智能分析
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <h4 className="font-bold text-slate-800 mb-4">为什么信任我们的建议？</h4>
        <ul className="space-y-3">
          <li className="flex items-start space-x-3 text-sm text-slate-600">
            <i className="fas fa-check-circle text-indigo-500 mt-1"></i>
            <span>基于 ${profile.name} 最近的喂养、睡眠和排泄趋势。</span>
          </li>
          <li className="flex items-start space-x-3 text-sm text-slate-600">
            <i className="fas fa-check-circle text-indigo-500 mt-1"></i>
            <span>结合世界卫生组织（WHO）的育儿标准进行计算。</span>
          </li>
          <li className="flex items-start space-x-3 text-sm text-slate-600">
            <i className="fas fa-exclamation-triangle text-amber-500 mt-1"></i>
            <span>免责声明：AI 建议仅供参考，不作为医疗诊断依据。如有身体不适请及时就医。</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
