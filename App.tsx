
import React, { useState, useEffect, useMemo } from 'react';
import { LogType, BabyLog, FeedingMethod, DiaperStatus, BabyProfile } from './types';
import { Header } from './components/Header';
import { LogCard } from './components/LogCard';
import { ActionButtons } from './components/ActionButtons';
import { StatsSection } from './components/StatsSection';
import { AIAdviceSection } from './components/AIAdviceSection';
import { ProfileSetup } from './components/ProfileSetup';

const STORAGE_KEY_LOGS = 'babysteps_logs_v1';
const STORAGE_KEY_PROFILE = 'babysteps_profile_v1';

const PWAInstallPrompt = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const hasClosed = localStorage.getItem('pwa_prompt_closed');
    
    if (!isStandalone && !hasClosed) {
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-28 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-indigo-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
            <i className="fas fa-download"></i>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">安装 BabySteps 到桌面</p>
            <p className="text-[10px] text-slate-500">像原生 App 一样快捷记录</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => {
              setShow(false);
              localStorage.setItem('pwa_prompt_closed', 'true');
            }}
            className="text-[10px] font-bold text-slate-400 px-2 py-1"
          >
            忽略
          </button>
          <div className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-3 py-1.5 rounded-lg">
            点击浏览器菜单"添加到主屏幕"
          </div>
        </div>
      </div>
    </div>
  );
};

export type ViewUnit = 'day' | 'week' | 'month' | 'custom';

const App: React.FC = () => {
  const [logs, setLogs] = useState<BabyLog[]>([]);
  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'stats' | 'ai'>('timeline');
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Set<LogType>>(new Set(Object.values(LogType)));
  const [viewUnit, setViewUnit] = useState<ViewUnit>('day');
  const [viewAnchorDate, setViewAnchorDate] = useState<Date>(new Date());
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const savedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
    const savedProfile = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedProfile) setProfile(JSON.parse(savedProfile));
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    }
  }, [logs, isInitialized]);

  const handleAddLog = (log: BabyLog) => {
    setLogs(prev => [log, ...prev].sort((a, b) => b.timestamp - a.timestamp));
  };

  const handleDeleteLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const handleSaveProfile = (newProfile: BabyProfile) => {
    setProfile(newProfile);
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(newProfile));
  };

  const toggleFilter = (type: LogType) => {
    setSelectedFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const currentRange = useMemo(() => {
    let startTs = 0;
    let endTs = Infinity;
    const startOfAnchor = new Date(viewAnchorDate);
    startOfAnchor.setHours(0, 0, 0, 0);

    if (viewUnit === 'day') {
      startTs = startOfAnchor.getTime();
      const endOfDay = new Date(startOfAnchor);
      endOfDay.setDate(endOfDay.getDate() + 1);
      endTs = endOfDay.getTime();
    } else if (viewUnit === 'week') {
      const day = startOfAnchor.getDay();
      const diff = startOfAnchor.getDate() - day;
      const startOfWeek = new Date(startOfAnchor.setDate(diff));
      startTs = startOfWeek.getTime();
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      endTs = endOfWeek.getTime();
    } else if (viewUnit === 'month') {
      const startOfMonth = new Date(startOfAnchor.getFullYear(), startOfAnchor.getMonth(), 1);
      startTs = startOfMonth.getTime();
      const endOfMonth = new Date(startOfAnchor.getFullYear(), startOfAnchor.getMonth() + 1, 1);
      endTs = endOfMonth.getTime();
    } else if (viewUnit === 'custom') {
      startTs = new Date(customRange.start).setHours(0, 0, 0, 0);
      endTs = new Date(customRange.end).setHours(23, 59, 59, 999);
    }
    return { startTs, endTs };
  }, [viewUnit, viewAnchorDate, customRange]);

  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => log.timestamp >= currentRange.startTs && log.timestamp < currentRange.endTs)
      .filter(log => selectedFilters.has(log.type));
  }, [logs, currentRange, selectedFilters]);

  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: BabyLog[] } = {};
    filteredLogs.forEach(log => {
      const dateStr = new Date(log.timestamp).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(log);
    });
    return Object.entries(groups).sort((a, b) => b[1][0].timestamp - a[1][0].timestamp);
  }, [filteredLogs]);

  const navigateTime = (direction: number) => {
    const newDate = new Date(viewAnchorDate);
    if (viewUnit === 'day') newDate.setDate(newDate.getDate() + direction);
    if (viewUnit === 'week') newDate.setDate(newDate.getDate() + (direction * 7));
    if (viewUnit === 'month') newDate.setMonth(newDate.getMonth() + direction);
    setViewAnchorDate(newDate);
  };

  const goToToday = () => {
    setViewAnchorDate(new Date());
    setViewUnit('day');
  };

  const getRangeLabel = () => {
    if (viewUnit === 'day') return viewAnchorDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    if (viewUnit === 'week') {
      const day = viewAnchorDate.getDay();
      const diff = viewAnchorDate.getDate() - day;
      const start = new Date(viewAnchorDate.getFullYear(), viewAnchorDate.getMonth(), diff);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })} - ${end.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}`;
    }
    if (viewUnit === 'month') return viewAnchorDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
    return '自定义区间';
  };

  const FilterBar = () => {
    const config = [
      { type: LogType.FEEDING, icon: 'fa-bottle-water', label: '喂养', color: 'bg-orange-400' },
      { type: LogType.SLEEP, icon: 'fa-moon', label: '睡眠', color: 'bg-indigo-400' },
      { type: LogType.DIAPER, icon: 'fa-poop', label: '尿布', color: 'bg-teal-400' },
      { type: LogType.VACCINE, icon: 'fa-syringe', label: '疫苗', color: 'bg-emerald-500' },
      { type: LogType.GROWTH, icon: 'fa-weight-scale', label: '成长', color: 'bg-rose-400' },
    ];
    return (
      <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1 pt-1">
        {config.map(item => {
          const isActive = selectedFilters.has(item.type);
          return (
            <button
              key={item.type}
              onClick={() => toggleFilter(item.type)}
              className={`flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 ${
                isActive ? `${item.color} border-transparent text-white shadow-md` : 'bg-white border-slate-100 text-slate-400'
              }`}
            >
              <i className={`fas ${item.icon} text-[10px]`}></i>
              <span className="text-[10px] font-bold whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  if (!isInitialized) return null;
  if (!profile) return <ProfileSetup onSave={handleSaveProfile} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Header 
        profile={profile} 
        onEditProfile={() => setProfile(null)} 
        logs={logs}
        onImportData={(importedLogs, importedProfile) => {
          if (importedLogs) setLogs(importedLogs);
          if (importedProfile) setProfile(importedProfile);
        }}
      />

      <main className="flex-grow container mx-auto px-4 py-4 max-w-2xl overflow-y-auto no-scrollbar pb-32">
        <div className="mb-6 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
           <ActionButtons onAddLog={handleAddLog} birthDate={profile.birthDate} />
        </div>

        <div className="flex bg-white rounded-full p-1 mb-6 shadow-sm border border-slate-100 sticky top-0 z-30">
          {(['timeline', 'stats', 'ai'] as const).map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all ${activeTab === tab ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500'}`}
            >
              {tab === 'timeline' ? '时光轴' : tab === 'stats' ? '看板' : 'AI 专家'}
            </button>
          ))}
        </div>

        {(activeTab === 'timeline' || activeTab === 'stats') && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-grow bg-slate-100 rounded-lg p-1 mr-3">
                  {(['day', 'week', 'month', 'custom'] as ViewUnit[]).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => setViewUnit(unit)}
                      className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${viewUnit === unit ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      {unit === 'day' ? '日' : unit === 'week' ? '周' : unit === 'month' ? '月' : '选'}
                    </button>
                  ))}
                </div>
                <button onClick={goToToday} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold">今日</button>
              </div>

              {viewUnit !== 'custom' ? (
                <div className="flex items-center justify-between px-2 bg-slate-50/50 rounded-xl py-1">
                  <button onClick={() => navigateTime(-1)} className="p-2 text-slate-400"><i className="fas fa-chevron-left"></i></button>
                  <div className="text-xs font-bold text-slate-700">{getRangeLabel()}</div>
                  <button onClick={() => navigateTime(1)} className="p-2 text-slate-400"><i className="fas fa-chevron-right"></i></button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <input type="date" value={customRange.start} onChange={(e) => setCustomRange({...customRange, start: e.target.value})} className="flex-1 bg-slate-50 border-none text-[10px] p-2 rounded-lg outline-none ring-1 ring-slate-200" />
                  <input type="date" value={customRange.end} onChange={(e) => setCustomRange({...customRange, end: e.target.value})} className="flex-1 bg-slate-50 border-none text-[10px] p-2 rounded-lg outline-none ring-1 ring-slate-200" />
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="pt-2 border-t border-slate-50">
                  <FilterBar />
                </div>
              )}
            </div>

            {activeTab === 'timeline' ? (
              <div className="space-y-6">
                {groupedLogs.map(([date, dayLogs]) => (
                  <section key={date}>
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border border-indigo-50 text-indigo-600 text-[10px] font-bold mb-4 shadow-sm">{date}</div>
                    <div className="ml-2 pl-4 border-l-2 border-slate-100 space-y-4">
                      {dayLogs.map(log => <LogCard key={log.id} log={log} onDelete={() => handleDeleteLog(log.id)} />)}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <StatsSection logs={filteredLogs} viewUnit={viewUnit} viewAnchorDate={viewAnchorDate} startTs={currentRange.startTs} endTs={currentRange.endTs} />
            )}
          </div>
        )}
        {activeTab === 'ai' && <AIAdviceSection profile={profile} logs={logs} />}
      </main>

      <PWAInstallPrompt />

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 flex justify-around py-3 px-6 z-40 safe-pb shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
        {(['timeline', 'stats', 'ai'] as const).map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)} 
            className={`flex flex-col items-center transition-colors px-4 ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <i className={`fas ${tab === 'timeline' ? 'fa-list-ul' : tab === 'stats' ? 'fa-chart-line' : 'fa-robot'} text-lg`}></i>
            <span className="text-[10px] mt-1 font-bold">{tab === 'timeline' ? '时光轴' : tab === 'stats' ? '看板' : 'AI 专家'}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
