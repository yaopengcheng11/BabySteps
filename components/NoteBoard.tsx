
import React, { useMemo } from 'react';
import { BabyLog, LogType, NoteLog } from '../types';

interface NoteBoardProps {
  logs: BabyLog[];
  rangeLabel: string;
  onDelete: (id: string) => void;
}

export const NoteBoard: React.FC<NoteBoardProps> = ({ logs, rangeLabel, onDelete }) => {
  const noteLogs = useMemo(() => {
    return logs
      .filter((log): log is NoteLog => log.type === LogType.NOTE)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [logs]);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-black text-slate-800 flex items-center">
          <i className="fas fa-sticky-note text-amber-400 mr-2.5"></i>
          成长便签
        </h3>
        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
          共 {noteLogs.length} 篇
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {noteLogs.length > 0 ? (
          noteLogs.map((log) => {
            const dateObj = new Date(log.timestamp);
            const timeStr = dateObj.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            const dateStr = dateObj.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
            
            return (
              <div 
                key={log.id} 
                className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group relative"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{timeStr}</span>
                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">{dateStr}</span>
                  </div>
                  <button 
                    onClick={() => onDelete(log.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-200 hover:text-rose-400 transition-all active:scale-90"
                  >
                    <i className="fas fa-trash-alt text-[10px]"></i>
                  </button>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-3 top-0 bottom-0 w-1 bg-amber-100 rounded-full opacity-50"></div>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap pl-3">
                    {log.content}
                  </p>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                    <i className="fas fa-feather-pointed text-[10px]"></i>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-24 text-center bg-white rounded-[2.5rem] border border-slate-100 border-dashed">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
              <i className="fas fa-pen-nib text-3xl"></i>
            </div>
            <p className="text-xs text-slate-400 font-medium italic mb-1">在这个时间段内没有记录任何便签</p>
            <p className="text-[10px] text-slate-300">点击上方的“便签”图标开始记录宝宝的精彩瞬间吧</p>
          </div>
        )}
      </div>
    </div>
  );
};
