
import React, { useState, useEffect, useMemo } from 'react';
import { BabyLog, BabyProfile, LogType, AdviceLog } from '../types';
import { getAIReport } from '../services/geminiService';

interface AIAdviceSectionProps {
  profile: BabyProfile;
  logs: BabyLog[];
  viewUnit: 'day' | 'week' | 'month' | 'custom';
  rangeLabel: string;
  filteredLogs: BabyLog[];
  onSaveAdvice: (log: AdviceLog) => void;
  onDeleteAdvice: (id: string) => void;
}

type ArchiveFilter = 'all' | 'day' | 'week' | 'month';

export const AIAdviceSection: React.FC<AIAdviceSectionProps> = ({ 
  profile, 
  logs, 
  viewUnit, 
  rangeLabel, 
  filteredLogs,
  onSaveAdvice, 
  onDeleteAdvice 
}) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [justSaved, setJustSaved] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('all');
  const [showLimit, setShowLimit] = useState<number>(5);

  const archiveLogs = useMemo(() => {
    return logs
      .filter(l => l.type === LogType.ADVICE)
      .sort((a, b) => b.timestamp - a.timestamp) as AdviceLog[];
  }, [logs]);

  const counts = useMemo(() => ({
    all: archiveLogs.length,
    day: archiveLogs.filter(l => l.reportType === 'day').length,
    week: archiveLogs.filter(l => l.reportType === 'week').length,
    month: archiveLogs.filter(l => l.reportType === 'month').length,
  }), [archiveLogs]);

  const filteredArchives = useMemo(() => {
    if (archiveFilter === 'all') return archiveLogs;
    return archiveLogs.filter(l => l.reportType === archiveFilter);
  }, [archiveLogs, archiveFilter]);

  const displayedArchives = filteredArchives.slice(0, showLimit);

  const typeName = useMemo(() => ({
    day: '今日日报',
    week: '本周周报',
    month: '本月月报',
    custom: '区间简报'
  }[viewUnit]), [viewUnit]);

  const fetchAdvice = async () => {
    setLoading(true);
    setJustSaved(false);
    const logsToAnalyze = filteredLogs.filter(l => l.type !== LogType.ADVICE);
    const result = await getAIReport(profile, logsToAnalyze, viewUnit, rangeLabel);
    setAdvice(result);
    setLoading(false);
  };

  const handleArchive = () => {
    if (!advice || justSaved) return;
    
    const newAdviceLog: AdviceLog = {
      id: Date.now().toString(),
      type: LogType.ADVICE,
      timestamp: Date.now(),
      title: `AI${typeName} - ${rangeLabel}`,
      content: advice,
      reportType: viewUnit
    };

    onSaveAdvice(newAdviceLog);
    setJustSaved(true);
  };

  useEffect(() => {
    setAdvice('');
    setJustSaved(false);
  }, [rangeLabel, viewUnit]);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* 生成器部分 */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl"></div>

        <div className="flex flex-col space-y-1 mb-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <i className={`fas ${viewUnit === 'day' ? 'fa-calendar-day' : viewUnit === 'week' ? 'fa-calendar-week' : 'fa-calendar-alt'} text-sm`}></i>
              </div>
              <h3 className="text-lg font-bold tracking-tight">智能{typeName}</h3>
            </div>
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
          </div>
          <p className="text-[10px] text-white/60 font-medium ml-13">{rangeLabel} 数据分析</p>
        </div>
        
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            </div>
            <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest">专家正在阅读您的时光轴...</p>
          </div>
        ) : advice ? (
          <div className="space-y-5 relative z-10">
            <div className="bg-white/10 backdrop-blur-xl rounded-[1.5rem] p-6 leading-relaxed text-sm font-medium border border-white/10 whitespace-pre-wrap shadow-inner min-h-[100px]">
              {advice}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button onClick={fetchAdvice} className="bg-white/20 backdrop-blur-md text-white font-bold py-4 rounded-2xl hover:bg-white/30 transition-all active:scale-95 flex items-center justify-center space-x-2 border border-white/20">
                <i className="fas fa-sync-alt text-xs"></i>
                <span>重新生成</span>
              </button>
              <button onClick={handleArchive} disabled={justSaved} className={`font-bold py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center space-x-2 shadow-lg ${justSaved ? 'bg-emerald-500 text-white' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}>
                <i className={`fas ${justSaved ? 'fa-check-circle' : 'fa-bookmark'} text-xs`}></i>
                <span>{justSaved ? '已存至存档' : '保存存档'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center relative z-10">
            <div className="mb-4 text-white/40">
              <i className="fas fa-chart-pie text-4xl"></i>
            </div>
            <p className="text-sm text-white/70 mb-6">基于时光轴记录，为您生成阶段性养育建议</p>
            <button onClick={fetchAdvice} className="w-full bg-white text-indigo-600 font-bold py-4 rounded-2xl hover:bg-indigo-50 transition-all active:scale-95 shadow-xl flex items-center justify-center space-x-2">
              <i className="fas fa-magic text-xs"></i>
              <span>生成{typeName}</span>
            </button>
          </div>
        )}
      </div>

      {/* 历史存档区块 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-sm font-bold text-slate-800 flex items-center">
            <i className="fas fa-history text-indigo-400 mr-2"></i>
            简报存档
          </h4>
        </div>

        {/* 存档分类 Tab */}
        <div className="flex bg-slate-100/50 p-1 rounded-2xl overflow-x-auto no-scrollbar space-x-1">
          {(['all', 'day', 'week', 'month'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setArchiveFilter(f); setShowLimit(5); }}
              className={`flex-1 min-w-[60px] py-2 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center space-y-0.5 ${
                archiveFilter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'
              }`}
            >
              <span>{f === 'all' ? '全部' : f === 'day' ? '日报' : f === 'week' ? '周报' : '月报'}</span>
              <span className={`text-[8px] font-medium opacity-60`}>{counts[f]}</span>
            </button>
          ))}
        </div>

        {filteredArchives.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-100 text-center flex flex-col items-center justify-center space-y-3 shadow-sm">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
              <i className="fas fa-folder-open text-xl"></i>
            </div>
            <p className="text-xs text-slate-400 italic">暂无{archiveFilter === 'all' ? '' : archiveFilter === 'day' ? '日报' : archiveFilter === 'week' ? '周报' : '月报'}存档</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedArchives.map((log) => {
              const isExpanded = expandedId === log.id;
              return (
                <div key={log.id} className={`bg-white rounded-2xl border transition-all duration-300 ${isExpanded ? 'shadow-md border-indigo-100 ring-1 ring-indigo-50' : 'shadow-sm border-slate-100'}`}>
                  {/* Compact Summary Header */}
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="flex items-center justify-between p-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        log.reportType === 'day' ? 'bg-orange-50 text-orange-500' : 
                        log.reportType === 'week' ? 'bg-indigo-50 text-indigo-500' : 
                        'bg-teal-50 text-teal-500'
                      }`}>
                        <i className={`fas ${log.reportType === 'day' ? 'fa-calendar-day' : log.reportType === 'week' ? 'fa-calendar-week' : 'fa-calendar-alt'} text-[10px]`}></i>
                      </div>
                      <div className="overflow-hidden">
                        <h5 className="font-bold text-slate-700 text-[11px] truncate">{log.title}</h5>
                        <p className="text-[9px] text-slate-400 font-medium">
                          {new Date(log.timestamp).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteAdvice(log.id); }}
                        className="w-7 h-7 flex items-center justify-center text-slate-200 hover:text-rose-400 transition-colors"
                      >
                        <i className="fas fa-trash-alt text-[9px]"></i>
                      </button>
                      <i className={`fas fa-chevron-down text-[9px] text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 animate-fade-in">
                      <div className="h-px bg-slate-50 mb-3"></div>
                      <div className="bg-slate-50/50 rounded-xl p-4 text-[10px] text-slate-600 whitespace-pre-wrap leading-relaxed border border-slate-100/50">
                        {log.content}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {filteredArchives.length > showLimit && (
              <button 
                onClick={() => setShowLimit(prev => prev + 10)}
                className="w-full py-3 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-white rounded-2xl border border-slate-100 shadow-sm"
              >
                加载更多存档 ({filteredArchives.length - showLimit} 条)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
