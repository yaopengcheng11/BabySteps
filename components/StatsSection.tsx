
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BabyLog, LogType, FeedingMethod } from '../types';
import { ViewUnit } from '../App';

interface StatsSectionProps {
  logs: BabyLog[];
  viewUnit: ViewUnit;
  viewAnchorDate: Date;
  startTs: number;
  endTs: number;
}

export const StatsSection: React.FC<StatsSectionProps> = ({ logs, viewUnit, startTs, endTs }) => {
  // Aggregate data based on the view type
  const chartData = useMemo(() => {
    if (viewUnit === 'day') {
      // Hourly distribution for a single day
      const hoursMap = new Map<number, { hour: string, feeding: number, sleep: number }>();
      for (let i = 0; i < 24; i++) {
        hoursMap.set(i, { hour: `${i}:00`, feeding: 0, sleep: 0 });
      }

      logs.forEach(log => {
        const hour = new Date(log.timestamp).getHours();
        const entry = hoursMap.get(hour)!;
        if (log.type === LogType.FEEDING && log.method !== FeedingMethod.BREAST) {
          entry.feeding += (log.amount || 0);
        } else if (log.type === LogType.SLEEP) {
          // Approximate sleep distribution: if it spans hours, it's complex, 
          // but for simple charting we use the start hour.
          entry.sleep += parseFloat((log.duration / 60).toFixed(1));
        }
      });
      return Array.from(hoursMap.values());
    } else {
      // Daily aggregation for weeks, months, or custom ranges
      const dailyMap = new Map<string, { label: string, feeding: number, sleep: number }>();
      
      // Calculate how many days to show
      const diffDays = Math.max(1, Math.ceil((endTs - startTs) / (1000 * 60 * 60 * 24)));
      
      for (let i = 0; i < diffDays; i++) {
        const d = new Date(startTs);
        d.setDate(d.getDate() + i);
        const dateStr = d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
        dailyMap.set(dateStr, { label: dateStr, feeding: 0, sleep: 0 });
      }

      logs.forEach(log => {
        const dateStr = new Date(log.timestamp).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
        if (dailyMap.has(dateStr)) {
          const entry = dailyMap.get(dateStr)!;
          if (log.type === LogType.FEEDING && log.method !== FeedingMethod.BREAST) {
            entry.feeding += (log.amount || 0);
          } else if (log.type === LogType.SLEEP) {
            entry.sleep += parseFloat((log.duration / 60).toFixed(1));
          }
        }
      });
      return Array.from(dailyMap.values());
    }
  }, [logs, viewUnit, startTs, endTs]);

  const hasData = logs.length > 0;

  // Calculate totals for summary
  const totals = useMemo(() => {
    return logs.reduce((acc, log) => {
      if (log.type === LogType.FEEDING && log.method !== FeedingMethod.BREAST) {
        acc.feeding += (log.amount || 0);
      } else if (log.type === LogType.SLEEP) {
        acc.sleep += log.duration;
      }
      return acc;
    }, { feeding: 0, sleep: 0 });
  }, [logs]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <i className="fas fa-chart-line text-indigo-500 mr-2"></i>
            所选区间数据看板
          </h3>
          <div className="flex items-center space-x-4 text-[10px] font-medium uppercase tracking-wider text-slate-400">
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-400 mr-1"></span> 奶量</span>
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-indigo-400 mr-1"></span> 睡眠</span>
          </div>
        </div>

        <div className="h-80 w-full">
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
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey={viewUnit === 'day' ? 'hour' : 'label'} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#fb923c' }}
                  orientation="left"
                />
                <YAxis 
                  yAxisId="right"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#818cf8' }}
                  orientation="right"
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px' }} />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="feeding" 
                  name="奶量 (ml)"
                  stroke="#fb923c" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorFeeding)" 
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="sleep" 
                  name="睡眠 (h)"
                  stroke="#818cf8" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSleep)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic">
              <i className="fas fa-chart-area text-3xl mb-2 opacity-10"></i>
              所选时段暂无喂养或睡眠记录
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
          <p className="text-[10px] text-slate-400 uppercase mb-1">区间总奶量</p>
          <p className="text-xl font-bold text-orange-500">
            {totals.feeding} <span className="text-xs font-normal">ml</span>
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
          <p className="text-[10px] text-slate-400 uppercase mb-1">区间总睡眠</p>
          <p className="text-xl font-bold text-indigo-500">
            {parseFloat((totals.sleep / 60).toFixed(1))} <span className="text-xs font-normal">h</span>
          </p>
        </div>
      </div>

      <div className="bg-indigo-50/50 rounded-2xl p-4 text-xs text-indigo-700 flex items-start space-x-2 border border-indigo-100">
        <i className="fas fa-info-circle mt-0.5"></i>
        <p>数据已根据当前时光轴选择的时间段进行同步更新。日视图展示 24 小时分布，周/月视图展示每日趋势。</p>
      </div>
    </div>
  );
};
