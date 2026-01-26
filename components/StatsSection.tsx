
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BabyLog, LogType, FeedingMethod, DiaperStatus } from '../types';
import { ViewUnit } from '../App';

interface StatsSectionProps {
  logs: BabyLog[];
  viewUnit: ViewUnit;
  viewAnchorDate: Date;
  startTs: number;
  endTs: number;
}

type SeriesKey = 'feeding' | 'sleep' | 'wet' | 'dirty';

export const StatsSection: React.FC<StatsSectionProps> = ({ logs, viewUnit, startTs, endTs }) => {
  // 控制图表项的显示隐藏
  const [activeSeries, setActiveSeries] = useState<Set<SeriesKey>>(new Set(['feeding', 'sleep', 'wet', 'dirty']));

  const toggleSeries = (key: SeriesKey) => {
    setActiveSeries(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // 处理图表数据
  const chartData = useMemo(() => {
    if (viewUnit === 'day') {
      const hoursMap = new Map<number, { hour: string, feeding: number, sleep: number, wet: number, dirty: number }>();
      for (let i = 0; i < 24; i++) {
        hoursMap.set(i, { hour: `${i}:00`, feeding: 0, sleep: 0, wet: 0, dirty: 0 });
      }

      logs.forEach(log => {
        const hour = new Date(log.timestamp).getHours();
        const entry = hoursMap.get(hour)!;
        if (log.type === LogType.FEEDING && log.method !== FeedingMethod.BREAST) {
          entry.feeding += (log.amount || 0);
        } else if (log.type === LogType.SLEEP) {
          entry.sleep += parseFloat((log.duration / 60).toFixed(1));
        } else if (log.type === LogType.DIAPER) {
          if (log.status === DiaperStatus.WET || log.status === DiaperStatus.BOTH) entry.wet += 1;
          if (log.status === DiaperStatus.DIRTY || log.status === DiaperStatus.BOTH) entry.dirty += 1;
        }
      });
      return Array.from(hoursMap.values());
    } else {
      const dailyMap = new Map<string, { label: string, feeding: number, sleep: number, wet: number, dirty: number }>();
      const diffDays = Math.max(1, Math.ceil((endTs - startTs) / (1000 * 60 * 60 * 24)));
      
      for (let i = 0; i < diffDays; i++) {
        const d = new Date(startTs);
        d.setDate(d.getDate() + i);
        const dateStr = d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
        dailyMap.set(dateStr, { label: dateStr, feeding: 0, sleep: 0, wet: 0, dirty: 0 });
      }

      logs.forEach(log => {
        const dateStr = new Date(log.timestamp).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
        if (dailyMap.has(dateStr)) {
          const entry = dailyMap.get(dateStr)!;
          if (log.type === LogType.FEEDING && log.method !== FeedingMethod.BREAST) {
            entry.feeding += (log.amount || 0);
          } else if (log.type === LogType.SLEEP) {
            entry.sleep += parseFloat((log.duration / 60).toFixed(1));
          } else if (log.type === LogType.DIAPER) {
            if (log.status === DiaperStatus.WET || log.status === DiaperStatus.BOTH) entry.wet += 1;
            if (log.status === DiaperStatus.DIRTY || log.status === DiaperStatus.BOTH) entry.dirty += 1;
          }
        }
      });
      return Array.from(dailyMap.values());
    }
  }, [logs, viewUnit, startTs, endTs]);

  // 数据明细处理
  const details = useMemo(() => {
    const feedingLogs = logs.filter(l => l.type === LogType.FEEDING).sort((a, b) => a.timestamp - b.timestamp);
    const diaperLogs = logs.filter(l => l.type === LogType.DIAPER).sort((a, b) => a.timestamp - b.timestamp);
    
    const diaperStats = diaperLogs.reduce((acc, log) => {
      if (log.type === LogType.DIAPER) {
        if (log.status === DiaperStatus.WET) acc.wet++;
        else if (log.status === DiaperStatus.DIRTY) acc.dirty++;
        else if (log.status === DiaperStatus.BOTH) { acc.wet++; acc.dirty++; }
      }
      return acc;
    }, { wet: 0, dirty: 0 });

    const totalFeedingAmount = feedingLogs.reduce((acc, l) => {
        if (l.type === LogType.FEEDING && l.method !== FeedingMethod.BREAST) return acc + (l.amount || 0);
        return acc;
    }, 0);

    const totalSleepMinutes = logs.filter(l => l.type === LogType.SLEEP).reduce((acc, l) => {
        if (l.type === LogType.SLEEP) return acc + l.duration;
        return acc;
    }, 0);

    return { feedingLogs, diaperLogs, diaperStats, totalFeedingAmount, totalSleepMinutes };
  }, [logs]);

  const hasData = logs.length > 0;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* 核心数据卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center text-orange-400 mb-2">
                <i className="fas fa-bottle-water text-xs"></i>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">喂养量</p>
            <div className="flex items-baseline space-x-0.5">
                <span className="text-lg font-black text-slate-800">{details.totalFeedingAmount}</span>
                <span className="text-[8px] text-slate-400 font-bold">ml</span>
            </div>
            <p className="text-[8px] text-slate-400 mt-1">{details.feedingLogs.length} 次</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-400 mb-2">
                <i className="fas fa-moon text-xs"></i>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">睡眠时长</p>
            <div className="flex items-baseline space-x-0.5">
                <span className="text-lg font-black text-slate-800">{parseFloat((details.totalSleepMinutes / 60).toFixed(1))}</span>
                <span className="text-[8px] text-slate-400 font-bold">h</span>
            </div>
            <p className="text-[8px] text-slate-400 mt-1">{Math.round(details.totalSleepMinutes/60)} 小时</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center text-teal-400 mb-2">
                <i className="fas fa-poop text-xs"></i>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">排泄次数</p>
            <div className="flex flex-col">
              <span className="text-lg font-black text-slate-800">{details.diaperStats.wet + details.diaperStats.dirty}</span>
              <div className="flex space-x-2 justify-center mt-1">
                <span className="text-[8px] text-blue-500 font-bold">尿 {details.diaperStats.wet}</span>
                <span className="text-[8px] text-yellow-600 font-bold">便 {details.diaperStats.dirty}</span>
              </div>
            </div>
        </div>
      </div>

      {/* 趋势看板卡片 */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-800 tracking-tight">趋势看板</h3>
          </div>
          
          {/* 可交互图例：支持显示隐藏 */}
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'feeding', label: '奶量', color: 'bg-orange-400', icon: 'fa-bottle-water' },
              { key: 'sleep', label: '睡眠', color: 'bg-indigo-400', icon: 'fa-moon' },
              { key: 'wet', label: '尿尿', color: 'bg-blue-400', icon: 'fa-tint' },
              { key: 'dirty', label: '便便', color: 'bg-yellow-500', icon: 'fa-poop' },
            ].map(item => (
              <button 
                key={item.key}
                onClick={() => toggleSeries(item.key as SeriesKey)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border transition-all ${
                  activeSeries.has(item.key as SeriesKey) 
                  ? 'bg-slate-50 border-slate-200 text-slate-700' 
                  : 'opacity-40 grayscale border-transparent text-slate-400'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${item.color}`}></span>
                <span className="text-[9px] font-black">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 w-full">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFeeding" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDirty" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey={viewUnit === 'day' ? 'hour' : 'label'} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px' }}
                />
                {activeSeries.has('feeding') && (
                  <Area 
                    type="monotone" 
                    dataKey="feeding" 
                    stroke="#fb923c" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorFeeding)" 
                  />
                )}
                {activeSeries.has('sleep') && (
                  <Area 
                    type="monotone" 
                    dataKey="sleep" 
                    stroke="#818cf8" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorSleep)" 
                  />
                )}
                {activeSeries.has('wet') && (
                  <Area 
                    type="stepAfter" 
                    dataKey="wet" 
                    stroke="#60a5fa" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorWet)" 
                  />
                )}
                {activeSeries.has('dirty') && (
                  <Area 
                    type="stepAfter" 
                    dataKey="dirty" 
                    stroke="#eab308" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorDirty)" 
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 text-[10px] italic">
              暂无历史波动数据
            </div>
          )}
        </div>
      </div>

      {/* 喂养明细列表 */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-black text-slate-800 flex items-center">
                <i className="fas fa-utensils text-orange-400 mr-2.5"></i>
                喂养时刻表
            </h3>
            <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">共 {details.feedingLogs.length} 次记录</span>
        </div>
        
        {details.feedingLogs.length > 0 ? (
            <div className="space-y-3">
                {details.feedingLogs.map((log, idx) => {
                    const logDate = new Date(log.timestamp);
                    const timeStr = logDate.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'});
                    const dateStr = logDate.toLocaleDateString('zh-CN', {month: '2-digit', day: '2-digit'});
                    
                    return (
                        <div key={log.id} className="flex items-center justify-between bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                            <div className="flex items-center space-x-4">
                                <div className="text-[10px] font-black text-slate-300 w-4">{idx + 1}</div>
                                <div>
                                    <p className="text-xs font-black text-slate-700">{log.type === LogType.FEEDING ? log.method : ''}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                        {dateStr} {timeStr}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-orange-500">
                                    {log.type === LogType.FEEDING && log.method === FeedingMethod.BREAST 
                                        ? `${log.duration} min` 
                                        : log.type === LogType.FEEDING ? `${log.amount} ml` : ''}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <p className="text-center py-8 text-[11px] text-slate-300 italic">该时间段暂未记录任何喂养信息</p>
        )}
      </div>

      {/* 排泄足迹列表 */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-black text-slate-800 flex items-center">
                <i className="fas fa-poop text-teal-400 mr-2.5"></i>
                排泄足迹
            </h3>
            <div className="flex space-x-2">
                <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">尿尿 {details.diaperStats.wet}</span>
                <span className="text-[9px] font-black text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">便便 {details.diaperStats.dirty}</span>
            </div>
        </div>

        {details.diaperLogs.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
                {details.diaperLogs.map((log) => {
                    const logDate = new Date(log.timestamp);
                    const timeStr = logDate.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'});
                    const dateStr = logDate.toLocaleDateString('zh-CN', {month: '2-digit', day: '2-digit'});
                    
                    return (
                        <div key={log.id} className="flex items-center space-x-3 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/50">
                            <div className={`w-2 h-2 rounded-full ${
                                log.type === LogType.DIAPER && log.status === DiaperStatus.WET ? 'bg-blue-400' : 
                                log.type === LogType.DIAPER && log.status === DiaperStatus.DIRTY ? 'bg-yellow-400' : 'bg-teal-400'
                            }`}></div>
                            <div>
                                <p className="text-[11px] font-black text-slate-700">{log.type === LogType.DIAPER ? log.status : ''}</p>
                                <p className="text-[9px] font-bold text-slate-400">
                                    {dateStr} {timeStr}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <p className="text-center py-8 text-[11px] text-slate-300 italic">该时间段排泄记录为空</p>
        )}
      </div>
    </div>
  );
};
