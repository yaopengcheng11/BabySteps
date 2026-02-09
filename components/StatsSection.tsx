
import React, { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { BabyLog, LogType, FeedingMethod, DiaperStatus, FeedingLog } from '../types';
import { ViewUnit } from '../App';

interface StatsSectionProps {
  logs: BabyLog[];
  viewUnit: ViewUnit;
  viewAnchorDate: Date;
  startTs: number;
  endTs: number;
}

const CustomTooltip = ({ active, payload, label, unitMap = {} }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-100 animate-fade-in">
        <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-[10px] font-bold text-slate-600">{entry.name}</span>
              </div>
              <span className="text-[11px] font-black text-slate-800">
                {entry.value}{unitMap[entry.dataKey] || entry.unit || ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const StatsSection: React.FC<StatsSectionProps> = ({ logs, viewUnit, startTs, endTs }) => {
  const chartData = useMemo(() => {
    const dataMap = new Map<string, { label: string, bottleMl: number, breastMin: number, wet: number, dirty: number }>();
    
    if (viewUnit === 'day') {
      for (let i = 0; i < 24; i++) {
        const key = `${i}:00`;
        dataMap.set(key, { label: key, bottleMl: 0, breastMin: 0, wet: 0, dirty: 0 });
      }
    } else {
      const diffDays = Math.max(1, Math.ceil((endTs - startTs) / (1000 * 60 * 60 * 24)));
      for (let i = 0; i < diffDays; i++) {
        const d = new Date(startTs);
        d.setDate(d.getDate() + i);
        const key = d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
        dataMap.set(key, { label: key, bottleMl: 0, breastMin: 0, wet: 0, dirty: 0 });
      }
    }

    logs.forEach(log => {
      const date = new Date(log.timestamp);
      const key = viewUnit === 'day' 
        ? `${date.getHours()}:00` 
        : date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
      
      const entry = dataMap.get(key);
      if (!entry) return;

      if (log.type === LogType.FEEDING) {
        if (log.method === FeedingMethod.BREAST) {
          entry.breastMin += (log.duration || 0);
        } else {
          entry.bottleMl += (log.amount || 0);
        }
      } else if (log.type === LogType.DIAPER) {
        if (log.status === DiaperStatus.WET || log.status === DiaperStatus.BOTH) entry.wet += 1;
        if (log.status === DiaperStatus.DIRTY || log.status === DiaperStatus.BOTH) entry.dirty += 1;
      }
    });

    return Array.from(dataMap.values());
  }, [logs, viewUnit, startTs, endTs]);

  const details = useMemo(() => {
    const feedingLogs = logs.filter((l): l is FeedingLog => l.type === LogType.FEEDING).sort((a, b) => a.timestamp - b.timestamp);
    const diaperLogs = logs.filter(l => l.type === LogType.DIAPER).sort((a, b) => a.timestamp - b.timestamp);
    
    const diaperStats = diaperLogs.reduce((acc, log) => {
      if (log.type === LogType.DIAPER) {
        if (log.status === DiaperStatus.WET) acc.wet++;
        else if (log.status === DiaperStatus.DIRTY) acc.dirty++;
        else if (log.status === DiaperStatus.BOTH) { acc.wet++; acc.dirty++; }
      }
      return acc;
    }, { wet: 0, dirty: 0 });

    const totalFormulaAmount = feedingLogs.reduce((acc, l) => {
        if (l.type === LogType.FEEDING && (l.method === FeedingMethod.FORMULA || l.method === FeedingMethod.BOTTLE) && l.amount) return acc + l.amount;
        return acc;
    }, 0);

    const totalBreastDuration = feedingLogs.reduce((acc, l) => {
        if (l.type === LogType.FEEDING && l.method === FeedingMethod.BREAST && l.duration) return acc + l.duration;
        return acc;
    }, 0);

    const counts = {
      breast: feedingLogs.filter(l => l.method === FeedingMethod.BREAST).length,
      bottle: feedingLogs.filter(l => l.method === FeedingMethod.FORMULA || l.method === FeedingMethod.BOTTLE).length,
    };

    return { feedingLogs, diaperLogs, diaperStats, totalFormulaAmount, totalBreastDuration, counts };
  }, [logs]);

  const renderFeedingMethod = (method: FeedingMethod) => {
    switch (method) {
      case FeedingMethod.BREAST:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-rose-50 text-rose-500 text-[10px] font-black border border-rose-100 shadow-sm">
            <i className="fas fa-heart text-[8px] mr-1.5"></i>直接母乳
          </span>
        );
      case FeedingMethod.FORMULA:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-orange-50 text-orange-500 text-[10px] font-black border border-orange-100 shadow-sm">
            <i className="fas fa-cow text-[8px] mr-1.5"></i>配方奶粉
          </span>
        );
      case FeedingMethod.BOTTLE:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-indigo-50 text-indigo-500 text-[10px] font-black border border-indigo-100 shadow-sm">
            <i className="fas fa-bottle-water text-[8px] mr-1.5"></i>瓶喂母乳
          </span>
        );
      case FeedingMethod.SOLID:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-50 text-emerald-500 text-[10px] font-black border border-emerald-100 shadow-sm">
            <i className="fas fa-apple-whole text-[8px] mr-1.5"></i>辅食
          </span>
        );
      default:
        return <span className="text-xs font-black text-slate-700">{method}</span>;
    }
  };

  const chartTheme = {
    xAxis: { axisLine: false, tickLine: false, tick: { fontSize: 10, fill: '#cbd5e1', fontWeight: 800 }, minTickGap: 30 },
    yAxis: { axisLine: false, tickLine: false, tick: { fontSize: 10, fill: '#cbd5e1', fontWeight: 800 } },
    grid: { strokeDasharray: "5 5", vertical: false, stroke: "#f8fafc" },
    margin: { top: 10, right: 10, left: -25, bottom: 0 }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* 核心概览卡片 - 精简为 2x2 或 1x3 布局 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-9 h-9 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-3 shadow-inner">
              <i className="fas fa-heart text-sm"></i>
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-tighter">母乳时长</p>
          <div className="flex items-baseline justify-center">
              <span className="text-xl font-black text-slate-800">{details.totalBreastDuration}</span>
              <span className="text-[9px] text-slate-400 font-bold ml-0.5">min</span>
          </div>
          <p className="text-[9px] text-slate-300 mt-1 font-bold">{details.counts.breast} 次</p>
        </div>

        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-9 h-9 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mb-3 shadow-inner">
              <i className="fas fa-bottle-water text-sm"></i>
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-tighter">奶瓶总量</p>
          <div className="flex items-baseline justify-center">
              <span className="text-xl font-black text-slate-800">{details.totalFormulaAmount}</span>
              <span className="text-[9px] text-slate-400 font-bold ml-0.5">ml</span>
          </div>
          <p className="text-[9px] text-slate-300 mt-1 font-bold">{details.counts.bottle} 次</p>
        </div>

        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-9 h-9 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-400 mb-3 shadow-inner">
              <i className="fas fa-poop text-sm"></i>
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-tighter">尿尿记录</p>
          <div className="flex items-baseline justify-center">
              <span className="text-xl font-black text-slate-800">{details.diaperStats.wet}</span>
              <span className="text-[9px] text-slate-400 font-bold ml-0.5">次</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-9 h-9 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-3 shadow-inner">
              <i className="fas fa-poo text-sm"></i>
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-tighter">便便记录</p>
          <div className="flex items-baseline justify-center">
              <span className="text-xl font-black text-slate-800">{details.diaperStats.dirty}</span>
              <span className="text-[9px] text-slate-400 font-bold ml-0.5">次</span>
          </div>
        </div>
      </div>

      {/* 喂养趋势图 */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex justify-between items-center mb-6 px-1">
          <h3 className="text-sm font-black text-slate-800 flex items-center tracking-tight">
            <i className="fas fa-bottle-water text-orange-400 mr-2.5"></i>
            喂养深度趋势
          </h3>
          <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100 uppercase tracking-widest">Feeding</span>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={chartTheme.margin}>
              <defs>
                <linearGradient id="colorBottle" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#fb923c" stopOpacity={0.1}/><stop offset="95%" stopColor="#fb923c" stopOpacity={0}/></linearGradient>
                <linearGradient id="colorBreast" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid {...chartTheme.grid} />
              <XAxis dataKey="label" {...chartTheme.xAxis} />
              <YAxis {...chartTheme.yAxis} />
              <Tooltip content={<CustomTooltip unitMap={{bottleMl: 'ml', breastMin: 'min'}} />} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
              <Area name="瓶喂 (ml)" type="monotone" dataKey="bottleMl" stroke="#fb923c" strokeWidth={3} fillOpacity={1} fill="url(#colorBottle)" animationDuration={1000} />
              <Area name="母乳 (min)" type="monotone" dataKey="breastMin" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorBreast)" animationDuration={1200} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 排泄对比图 */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex justify-between items-center mb-6 px-1">
          <h3 className="text-sm font-black text-slate-800 flex items-center tracking-tight">
            <i className="fas fa-poop text-teal-400 mr-2.5"></i>
            排泄频率对比
          </h3>
          <span className="text-[9px] font-black text-teal-500 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100 uppercase tracking-widest">Diaper</span>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={chartTheme.margin}>
              <CartesianGrid {...chartTheme.grid} />
              <XAxis dataKey="label" {...chartTheme.xAxis} />
              <YAxis {...chartTheme.yAxis} allowDecimals={false} />
              <Tooltip content={<CustomTooltip unitMap={{wet: '次', dirty: '次'}} />} />
              <Legend verticalAlign="top" height={36} iconType="square" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
              <Bar name="尿尿" dataKey="wet" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={10} />
              <Bar name="便便" dataKey="dirty" fill="#eab308" radius={[4, 4, 0, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 喂养时刻表 */}
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
                    const isBreast = log.method === FeedingMethod.BREAST;
                    
                    return (
                        <div key={log.id} className="flex items-center justify-between bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-sm transition-all group">
                            <div className="flex items-center space-x-4">
                                <div className="text-[10px] font-black text-slate-300 w-4 group-hover:text-indigo-300">{idx + 1}</div>
                                <div>
                                    <div className="mb-1.5">
                                      {renderFeedingMethod(log.method)}
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                        {dateStr} <span className="text-slate-500 font-black">{timeStr}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-sm font-black ${isBreast ? 'text-rose-500' : 'text-orange-500'}`}>
                                    {isBreast 
                                        ? `${log.duration} min` 
                                        : `${log.amount} ml`}
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
    </div>
  );
};
