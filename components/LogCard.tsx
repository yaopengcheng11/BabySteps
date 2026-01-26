
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
          c: isMilestone ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-rose-50 text-rose-500',
          b: 'border-rose-100'
        };
      case LogType.ADVICE: return { i: 'fa-robot', c: 'bg-indigo-600 text-white shadow-indigo-100', b: 'border-indigo-200' };
      default: return { i: 'fa-info-circle', c: 'bg-slate-100 text-slate-600', b: 'border-slate-100' };
    }
  };

  const { i, c, b } = getIcon();
  const dateObj = new Date(log.timestamp);
  const timeStr = dateObj.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`bg-white rounded-2xl p-4 flex flex-col space-y-3 border ${b} shadow-sm hover:shadow-md transition-all group relative animate-fade-in`}>
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${c}`}>
          <i className={`fas ${i} text-lg`}></i>
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <h4 className="font-bold text-slate-800 leading-snug">
                {log.type === LogType.FEEDING && `喂养: ${log.method}`}
                {log.type === LogType.SLEEP && '睡眠记录'}
                {log.type === LogType.DIAPER && `换尿布: ${log.status}`}
                {log.type === LogType.VACCINE && `疫苗接种`}
                {log.type === LogType.ADVICE && log.title}
                {log.type === LogType.GROWTH && (
                  <span className="flex items-center">
                    {log.eventName}
                    <span className="ml-2 text-[8px] bg-rose-50 text-rose-400 px-1.5 py-0.5 rounded-full border border-rose-100 font-bold uppercase tracking-wider">
                      {log.category}
                    </span>
                  </span>
                )}
              </h4>
              <span className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">
                {timeStr}
              </span>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all focus:opacity-100"
              aria-label="删除记录"
            >
              <i className="fas fa-trash-alt text-xs"></i>
            </button>
          </div>

          <div className="mt-2 text-sm">
            <div className="text-slate-600 font-medium">
              {log.type === LogType.FEEDING && (
                log.method === FeedingMethod.BREAST 
                  ? `${log.duration} 分钟` 
                  : `${log.amount} ml`
              )}
              {log.type === LogType.SLEEP && `${Math.floor(log.duration / 60)}h ${log.duration % 60}m`}
              {log.type === LogType.DIAPER && `状态：${log.status}`}
              {log.type === LogType.ADVICE && (
                <div className="space-y-2">
                  <div className={`bg-indigo-50/50 rounded-xl p-3 text-[11px] leading-relaxed text-indigo-700/80 border border-indigo-100/50 italic ${!isAdviceExpanded ? 'line-clamp-3' : ''}`}>
                    {log.content}
                  </div>
                  <button 
                    onClick={() => setIsAdviceExpanded(!isAdviceExpanded)}
                    className="text-[10px] text-indigo-500 font-bold flex items-center space-x-1"
                  >
                    <span>{isAdviceExpanded ? '收起详情' : '阅读全文'}</span>
                    <i className={`fas fa-chevron-${isAdviceExpanded ? 'up' : 'down'} text-[8px]`}></i>
                  </button>
                </div>
              )}
              {log.type === LogType.VACCINE && (
                <div className="space-y-1">
                  <div className="text-emerald-600 font-bold">{log.vaccineName}</div>
                  {log.nextDoseDate && (
                    <div className="text-[10px] text-slate-400 flex items-center">
                      <i className="fas fa-calendar-check mr-1 text-emerald-500"></i>
                      预约下次：{log.nextDoseDate}
                    </div>
                  )}
                </div>
              )}
              {log.type === LogType.GROWTH && (
                <div className="flex flex-wrap gap-3">
                  {log.weight && (
                    <div className="flex items-center bg-slate-50 px-2 py-1 rounded-lg">
                      <i className="fas fa-weight-scale text-[10px] text-slate-300 mr-1.5"></i>
                      <span className="text-xs font-bold text-slate-700">{log.weight} <small className="font-normal text-[9px] text-slate-400">kg</small></span>
                    </div>
                  )}
                  {log.height && (
                    <div className="flex items-center bg-slate-50 px-2 py-1 rounded-lg">
                      <i className="fas fa-ruler-vertical text-[10px] text-slate-300 mr-1.5"></i>
                      <span className="text-xs font-bold text-slate-700">{log.height} <small className="font-normal text-[9px] text-slate-400">cm</small></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {log.note && (
        <div className="pl-16 pt-2 border-t border-slate-50">
          <div className="bg-slate-50/80 rounded-xl p-3 text-xs text-slate-500 leading-relaxed italic relative border border-slate-100">
            <i className="fas fa-quote-left absolute -left-1 -top-1.5 text-[10px] text-slate-200"></i>
            {log.note}
          </div>
        </div>
      )}
    </div>
  );
};
