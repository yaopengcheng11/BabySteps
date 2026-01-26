
import React, { useState } from 'react';
import { BabyLog, LogType, FeedingMethod, GrowthCategory } from '../types';

interface LogCardProps {
  log: BabyLog;
  onDelete: () => void;
}

export const LogCard: React.FC<LogCardProps> = ({ log, onDelete }) => {
  const [isAdviceExpanded, setIsAdviceExpanded] = useState(false);

  const getIcon = () => {
    switch (log.type) {
      case LogType.FEEDING: return { i: 'fa-bottle-water', c: 'bg-orange-100 text-orange-600', b: 'border-orange-100' };
      case LogType.SLEEP: return { i: 'fa-moon', c: 'bg-indigo-100 text-indigo-600', b: 'border-indigo-100' };
      case LogType.DIAPER: return { i: 'fa-poop', c: 'bg-teal-100 text-teal-600', b: 'border-teal-100' };
      case LogType.VACCINE: return { i: 'fa-syringe', c: 'bg-emerald-100 text-emerald-600', b: 'border-emerald-100' };
      case LogType.GROWTH: 
        const isMilestone = log.category === GrowthCategory.MILESTONE || log.category === GrowthCategory.SKILL;
        return { 
          i: isMilestone ? 'fa-star' : 'fa-weight-scale', 
          c: isMilestone ? 'bg-rose-100 text-rose-600' : 'bg-rose-50 text-rose-500',
          b: 'border-rose-100'
        };
      case LogType.ADVICE: return { i: 'fa-robot', c: 'bg-indigo-600 text-white shadow-indigo-100', b: 'border-indigo-200' };
      default: return { i: 'fa-info-circle', c: 'bg-slate-100 text-slate-600', b: 'border-slate-100' };
    }
  };

  const { i, c, b } = getIcon();
  const dateObj = new Date(log.timestamp);
  const timeStr = dateObj.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const dateShortStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

  return (
    <div className={`bg-white rounded-[1.25rem] p-3.5 flex flex-col space-y-2 border ${b} shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all group relative animate-fade-in`}>
      <div className="flex items-start space-x-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${c}`}>
          <i className={`fas ${i} text-sm`}></i>
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex flex-col min-w-0 pr-4">
              <h4 className="font-black text-slate-800 text-[13px] leading-tight truncate">
                {log.type === LogType.FEEDING && `喂养: ${log.method}`}
                {log.type === LogType.SLEEP && '开始睡觉'}
                {log.type === LogType.DIAPER && `换尿布: ${log.status}`}
                {log.type === LogType.VACCINE && `疫苗接种`}
                {log.type === LogType.ADVICE && log.title}
                {log.type === LogType.GROWTH && (
                  <span className="flex items-center truncate">
                    {log.eventName}
                    <span className="ml-1.5 text-[7px] bg-rose-50 text-rose-400 px-1 py-0.5 rounded-md border border-rose-100 font-black uppercase shrink-0">
                      {log.category}
                    </span>
                  </span>
                )}
              </h4>
              <span className="text-[9px] font-black text-slate-300 mt-0.5 flex items-center space-x-1 uppercase tracking-tighter">
                <span>{timeStr}</span>
                <span className="opacity-40">/</span>
                <span className="text-slate-400">{dateShortStr}</span>
              </span>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 transition-all focus:opacity-100 -mr-1 -mt-1"
              aria-label="删除记录"
            >
              <i className="fas fa-trash-alt text-[9px]"></i>
            </button>
          </div>

          <div className="mt-1.5">
            <div className="text-slate-600 font-bold text-[11px] leading-snug">
              {log.type === LogType.FEEDING && (
                log.method === FeedingMethod.BREAST 
                  ? `${log.duration} 分钟` 
                  : <span className="text-orange-500 font-black">{log.amount} ml</span>
              )}
              {log.type === LogType.SLEEP && `${Math.floor(log.duration / 60)}h ${log.duration % 60}m`}
              {log.type === LogType.DIAPER && `状态：${log.status}`}
              {log.type === LogType.ADVICE && (
                <div className="space-y-2">
                  <div className={`bg-indigo-50/40 rounded-xl p-3 text-[10px] leading-relaxed text-indigo-700/80 border border-indigo-100/30 italic ${!isAdviceExpanded ? 'line-clamp-2' : ''}`}>
                    {log.content}
                  </div>
                  <button 
                    onClick={() => setIsAdviceExpanded(!isAdviceExpanded)}
                    className="text-[9px] text-indigo-500 font-black flex items-center space-x-1"
                  >
                    <span>{isAdviceExpanded ? '收起详情' : '阅读全文'}</span>
                    <i className={`fas fa-chevron-${isAdviceExpanded ? 'up' : 'down'} text-[7px]`}></i>
                  </button>
                </div>
              )}
              {log.type === LogType.VACCINE && (
                <div className="space-y-1">
                  <div className="text-emerald-600 font-black">{log.vaccineName}</div>
                  {log.nextDoseDate && (
                    <div className="text-[9px] text-slate-400 flex items-center">
                      <i className="fas fa-calendar-check mr-1 text-emerald-400"></i>
                      预约下次：{log.nextDoseDate}
                    </div>
                  )}
                </div>
              )}
              {log.type === LogType.GROWTH && (
                <div className="flex flex-wrap gap-1.5">
                  {log.weight && (
                    <div className="flex items-center bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-black text-slate-700">{log.weight}<small className="font-medium ml-0.5 opacity-50">kg</small></span>
                    </div>
                  )}
                  {log.height && (
                    <div className="flex items-center bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-black text-slate-700">{log.height}<small className="font-medium ml-0.5 opacity-50">cm</small></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {log.note && (
        <div className="pl-12 pt-1 border-t border-slate-50 mt-1">
          <div className="bg-slate-50/60 rounded-xl p-2.5 text-[9px] text-slate-400 leading-relaxed italic border border-slate-100/40">
            {log.note}
          </div>
        </div>
      )}
    </div>
  );
};
