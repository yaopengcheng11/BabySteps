
import React, { useState, useEffect, useMemo } from 'react';
import { BabyLog, LogType, FeedingLog, DiaperLog, SupplementLog, FeedingMethod } from '../types';

interface StatusDashboardProps {
  logs: BabyLog[];
}

export const StatusDashboard: React.FC<StatusDashboardProps> = ({ logs }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const latestFeedingsByCategory = useMemo(() => {
    const feedingLogs = logs.filter((l): l is FeedingLog => l.type === LogType.FEEDING);
    
    const getLatest = (method: FeedingMethod) => 
      feedingLogs.filter(l => l.method === method).sort((a, b) => b.timestamp - a.timestamp)[0];

    return [
      { method: FeedingMethod.BREAST, log: getLatest(FeedingMethod.BREAST), shortLabel: '母乳' },
      { method: FeedingMethod.BOTTLE, log: getLatest(FeedingMethod.BOTTLE), shortLabel: '瓶喂' },
      { method: FeedingMethod.FORMULA, log: getLatest(FeedingMethod.FORMULA), shortLabel: '奶粉' }
    ];
  }, [logs]);

  const latestDiaper = useMemo(() => {
    return logs
      .filter((l): l is DiaperLog => l.type === LogType.DIAPER)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
  }, [logs]);

  const latestSupplement = useMemo(() => {
    return logs
      .filter((l): l is SupplementLog => l.type === LogType.SUPPLEMENT)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
  }, [logs]);

  const formatDuration = (timestamp: number) => {
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 0) return "刚刚";
    if (diffMins < 60) return `${diffMins}m前`;
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours < 24 ? `${hours}h${mins > 0 ? mins + 'm' : ''}前` : `${Math.floor(hours/24)}d前`;
  };

  return (
    <div className="flex flex-col space-y-2 mb-6 animate-fade-in">
      {/* 第一行：喂养概览 */}
      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col transition-all active:scale-[0.99]">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-orange-400 flex items-center justify-center text-white shrink-0 shadow-sm">
            <i className="fas fa-bottle-water text-[10px]"></i>
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">喂养概览 (各分类末次)</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {latestFeedingsByCategory.map((item) => (
            <div key={item.method} className={`flex flex-col p-2 rounded-xl ${item.log ? 'bg-orange-50/30 border border-orange-100/50' : 'bg-slate-50 opacity-40'}`}>
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md self-start mb-1 ${item.log ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-400'}`}>
                {item.shortLabel}
              </span>
              {item.log ? (
                <>
                  <span className="text-[11px] font-black text-slate-700 truncate">
                    {formatDuration(item.log.timestamp)}
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[7px] font-bold text-slate-400 truncate">
                      {new Date(item.log.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[7px] font-black text-orange-400">
                      {item.log.amount ? `${item.log.amount}ml` : `${item.log.duration}m`}
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-[10px] font-bold text-slate-300 italic py-1">无记录</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 第二行：尿布和补充剂并列 */}
      <div className="flex space-x-2">
        {/* 尿布看板 */}
        <div className="flex-1 bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col transition-all active:scale-[0.98]">
          <div className="flex items-center space-x-2 mb-1.5">
            <div className="w-5 h-5 rounded-lg bg-teal-400 flex items-center justify-center text-white shrink-0 shadow-sm">
              <i className="fas fa-poop text-[8px]"></i>
            </div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">末次尿布</span>
          </div>
          {latestDiaper ? (
            <div className="flex flex-col">
              <span className="text-[12px] font-black text-teal-600 leading-tight">
                {formatDuration(latestDiaper.timestamp)}
              </span>
              <span className="text-[7px] font-bold text-slate-400">
                {new Date(latestDiaper.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} · {latestDiaper.status}
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-bold text-slate-300 italic">暂无记录</span>
          )}
        </div>

        {/* 补充剂看板 */}
        <div className="flex-1 bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col transition-all active:scale-[0.98]">
          <div className="flex items-center space-x-2 mb-1.5">
            <div className="w-5 h-5 rounded-lg bg-indigo-400 flex items-center justify-center text-white shrink-0 shadow-sm">
              <i className="fas fa-capsules text-[8px]"></i>
            </div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">末次补剂</span>
          </div>
          {latestSupplement ? (
            <div className="flex flex-col">
              <span className="text-[12px] font-black text-indigo-600 leading-tight truncate">
                {formatDuration(latestSupplement.timestamp)}
              </span>
              <span className="text-[7px] font-bold text-slate-400 truncate">
                {latestSupplement.name} {latestSupplement.dosage ? `(${latestSupplement.dosage})` : ''}
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-bold text-slate-300 italic">暂无记录</span>
          )}
        </div>
      </div>
    </div>
  );
};
