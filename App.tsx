
import React, { useState, useEffect, useMemo } from 'react';
import { LogType, BabyLog, FeedingMethod, DiaperStatus, BabyProfile, AdviceLog, BabyTodo } from './types';
import { Header } from './components/Header';
import { LogCard } from './components/LogCard';
import { ActionButtons } from './components/ActionButtons';
import { StatsSection } from './components/StatsSection';
import { AIAdviceSection } from './components/AIAdviceSection';
import { ProfileSetup } from './components/ProfileSetup';
import { TodoSection } from './components/TodoSection';

const STORAGE_KEY_LOGS = 'babysteps_logs_v1';
const STORAGE_KEY_PROFILE = 'babysteps_profile_v1';
const STORAGE_KEY_TODOS = 'babysteps_todos_v1';

export type ViewUnit = 'day' | 'week' | 'month' | 'custom';
export type AppTab = 'timeline' | 'stats' | 'ai' | 'todo';

const App: React.FC = () => {
  const [logs, setLogs] = useState<BabyLog[]>([]);
  const [todos, setTodos] = useState<BabyTodo[]>([]);
  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('timeline');
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Set<LogType>>(new Set(Object.values(LogType)));
  const [viewUnit, setViewUnit] = useState<ViewUnit>('day');
  const [viewAnchorDate, setViewAnchorDate] = useState<Date>(new Date());
  
  // 记录哪些日期分组是展开的
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!localStorage.getItem('pwa_prompt_closed')) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const savedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
    const savedProfile = localStorage.getItem(STORAGE_KEY_PROFILE);
    const savedTodos = localStorage.getItem(STORAGE_KEY_TODOS);
    
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedProfile) setProfile(JSON.parse(savedProfile));
    if (savedTodos) setTodos(JSON.parse(savedTodos));
    
    setIsInitialized(true);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    const checkReminders = () => {
      const now = Date.now();
      let updated = false;
      const newTodos = todos.map(todo => {
        if (!todo.completed && todo.reminderTime && !todo.isNotified && now >= todo.reminderTime) {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("👶 育儿提醒", {
              body: `该完成啦：${todo.text}`,
              icon: "https://cdn-icons-png.flaticon.com/512/3041/3041215.png"
            });
          }
          updated = true;
          return { ...todo, isNotified: true };
        }
        return todo;
      });
      if (updated) setTodos(newTodos);
    };
    const intervalId = setInterval(checkReminders, 30000);
    return () => clearInterval(intervalId);
  }, [todos, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
      localStorage.setItem(STORAGE_KEY_TODOS, JSON.stringify(todos));
    }
  }, [logs, todos, profile, isInitialized]);

  const handleAddLog = (log: BabyLog) => {
    setLogs(prev => [log, ...prev].sort((a, b) => b.timestamp - a.timestamp));
    // 新增记录时自动展开对应日期
    const dateStr = new Date(log.timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });
    setExpandedDates(prev => new Set(prev).add(dateStr));
  };

  const handleDeleteLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const handleAddTodo = (text: string, category: BabyTodo['category'] = 'daily', targetDate?: number, reminderTime?: number) => {
    const newTodo: BabyTodo = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: Date.now(),
      targetDate: targetDate || viewAnchorDate.getTime(),
      reminderTime,
      isNotified: false,
      category
    };
    setTodos(prev => [newTodo, ...prev]);
  };

  const handleToggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const handleSaveProfile = (newProfile: BabyProfile) => {
    setProfile(newProfile);
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(newProfile));
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the PWA installation');
      }
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
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

  const statsLogs = useMemo(() => {
    return logs.filter(log => log.timestamp >= currentRange.startTs && log.timestamp < currentRange.endTs);
  }, [logs, currentRange]);

  const filteredTodos = useMemo(() => {
    return todos.filter(todo => todo.targetDate >= currentRange.startTs && todo.targetDate < currentRange.endTs);
  }, [todos, currentRange]);

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
    
    const result = Object.entries(groups).sort((a, b) => b[1][0].timestamp - a[1][0].timestamp);
    
    // 默认展开最新的2个日期
    if (expandedDates.size === 0 && result.length > 0) {
      setExpandedDates(new Set([result[0][0], result[1]?.[0]].filter(Boolean)));
    }
    
    return result;
  }, [filteredLogs]);

  const toggleDateExpanded = (dateStr: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  };

  const getDaySummary = (dayLogs: BabyLog[]) => {
    let feedingAmount = 0;
    let feedingCount = 0;
    let sleepDuration = 0;
    let diaperCount = 0;
    
    dayLogs.forEach(log => {
      if (log.type === LogType.FEEDING) {
        feedingCount++;
        if (log.amount) feedingAmount += log.amount;
      } else if (log.type === LogType.SLEEP) {
        sleepDuration += log.duration;
      } else if (log.type === LogType.DIAPER) {
        diaperCount++;
      }
    });
    
    return {
      feeding: feedingAmount > 0 ? `${feedingAmount}ml` : `${feedingCount}次`,
      sleep: `${(sleepDuration / 60).toFixed(1)}h`,
      diaper: `${diaperCount}次`
    };
  };

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
    return `${customRange.start} ~ ${customRange.end}`;
  };

  const FilterBar = () => {
    const config = [
      { type: LogType.FEEDING, icon: 'fa-bottle-water', label: '喂养', color: 'bg-orange-400' },
      { type: LogType.SLEEP, icon: 'fa-moon', label: '睡眠', color: 'bg-indigo-400' },
      { type: LogType.DIAPER, icon: 'fa-poop', label: '尿布', color: 'bg-teal-400' },
      { type: LogType.VACCINE, icon: 'fa-syringe', label: '疫苗', color: 'bg-emerald-500' },
      { type: LogType.GROWTH, icon: 'fa-weight-scale', label: '成长', color: 'bg-rose-400' },
      { type: LogType.ADVICE, icon: 'fa-robot', label: '简报', color: 'bg-indigo-600' },
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
        todos={todos}
        onImportData={(importedLogs, importedProfile, importedTodos) => {
          if (importedLogs) setLogs(importedLogs);
          if (importedProfile) setProfile(importedProfile);
          if (importedTodos) setTodos(importedTodos);
          // 清理展开日期以触发重新计算
          setExpandedDates(new Set());
        }}
        isInstallable={!!deferredPrompt}
        onInstall={handleInstallApp}
      />

      <main className="flex-grow container mx-auto px-4 py-4 max-w-2xl overflow-y-auto no-scrollbar pb-32">
        {showInstallBanner && deferredPrompt && (
          <div className="mb-6 animate-fade-in">
            <div className="bg-indigo-600 rounded-[2rem] p-5 shadow-lg shadow-indigo-100 flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                  <i className="fas fa-mobile-screen-button"></i>
                </div>
                <div>
                  <p className="text-xs font-bold">安装 BabySteps 应用</p>
                  <p className="text-[10px] opacity-80">一键添加到桌面，记录更快捷</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => { setShowInstallBanner(false); localStorage.setItem('pwa_prompt_closed', 'true'); }} className="text-[10px] font-bold px-3 py-2">忽略</button>
                <button onClick={handleInstallApp} className="bg-white text-indigo-600 text-[10px] font-bold px-4 py-2 rounded-xl shadow-md active:scale-95 transition-all">立即安装</button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
           <ActionButtons onAddLog={handleAddLog} birthDate={profile.birthDate} onAddTodo={handleAddTodo} currentAnchorDate={viewAnchorDate} />
        </div>

        <div className="flex bg-white rounded-full p-1 mb-6 shadow-sm border border-slate-100 sticky top-0 z-30 overflow-x-auto no-scrollbar">
          {(['timeline', 'todo', 'stats', 'ai'] as const).map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[60px] py-2.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500'}`}
            >
              {tab === 'timeline' ? '时光轴' : tab === 'todo' ? '待办' : tab === 'stats' ? '统计看板' : 'AI 专家'}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-grow bg-slate-100 rounded-lg p-1 mr-3">
              {(['day', 'week', 'month', 'custom'] as ViewUnit[]).map((unit) => (
                <button key={unit} onClick={() => setViewUnit(unit)} className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${viewUnit === unit ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
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

        {activeTab === 'timeline' && (
          <div className="space-y-6 relative">
            {groupedLogs.map(([date, dayLogs], groupIdx) => {
              const summary = getDaySummary(dayLogs);
              const isExpanded = expandedDates.has(date);
              
              return (
                <section key={date} className="relative">
                  {/* Sticky Date Header with Daily Summary Pills */}
                  <div 
                    onClick={() => toggleDateExpanded(date)}
                    className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm py-2 px-1 flex items-center justify-between cursor-pointer group transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]"></div>
                      <h3 className="text-xs font-black text-slate-800 tracking-tight">{date}</h3>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1.5 bg-white/60 border border-slate-100 px-2 py-1 rounded-full shadow-sm scale-90 origin-right transition-all group-hover:bg-white">
                        <div className="flex items-center space-x-1">
                          <i className="fas fa-bottle-water text-[8px] text-orange-400"></i>
                          <span className="text-[9px] font-bold text-slate-500">{summary.feeding}</span>
                        </div>
                        <div className="w-px h-2 bg-slate-200"></div>
                        <div className="flex items-center space-x-1">
                          <i className="fas fa-moon text-[8px] text-indigo-400"></i>
                          <span className="text-[9px] font-bold text-slate-500">{summary.sleep}</span>
                        </div>
                        <div className="w-px h-2 bg-slate-200"></div>
                        <div className="flex items-center space-x-1">
                          <i className="fas fa-poop text-[8px] text-teal-400"></i>
                          <span className="text-[9px] font-bold text-slate-500">{summary.diaper}</span>
                        </div>
                      </div>
                      <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-[9px] text-slate-300 w-4 transition-transform`}></i>
                    </div>
                  </div>

                  {/* Vertical Timeline Line and Log Cards */}
                  {isExpanded && (
                    <div className="ml-1 pl-6 border-l-2 border-indigo-100/50 space-y-4 py-4 animate-fade-in relative">
                      {/* Gradient Line Effect */}
                      <div className="absolute left-[-2px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-indigo-100/0 via-indigo-100 to-indigo-100/0"></div>
                      
                      {dayLogs.map((log, logIdx) => {
                        // Calculate time gap with previous log (if any)
                        const prevLog = dayLogs[logIdx + 1]; // Sort is desc, so +1 is "earlier" in the same day list
                        const timeGapHours = prevLog ? (log.timestamp - prevLog.timestamp) / (1000 * 60 * 60) : 0;
                        
                        return (
                          <div key={log.id} className="relative">
                            {/* Dot indicator on the line */}
                            <div className="absolute left-[-31px] top-6 w-2.5 h-2.5 rounded-full bg-white border-2 border-indigo-400 ring-4 ring-slate-50 z-10"></div>
                            
                            <LogCard log={log} onDelete={() => handleDeleteLog(log.id)} />
                            
                            {/* Time gap indicator */}
                            {timeGapHours >= 4 && (
                              <div className="flex items-center space-x-2 my-2 -ml-2 opacity-30 select-none">
                                <div className="h-px w-4 bg-indigo-200"></div>
                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap">间隔 {timeGapHours.toFixed(1)}h</span>
                                <div className="h-px flex-grow bg-indigo-200"></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
            
            {groupedLogs.length === 0 && (
              <div className="py-24 text-center">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-200 shadow-sm border border-slate-100">
                  <i className="fas fa-calendar-alt text-2xl"></i>
                </div>
                <p className="text-xs text-slate-400 font-medium italic">此时间段暂无时光印记</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'todo' && (
          <TodoSection todos={filteredTodos} onAddTodo={(text, cat) => handleAddTodo(text, cat, viewAnchorDate.getTime())} onToggleTodo={handleToggleTodo} onDeleteTodo={handleDeleteTodo} rangeLabel={getRangeLabel()} />
        )}

        {activeTab === 'stats' && (
          <StatsSection logs={statsLogs} viewUnit={viewUnit} viewAnchorDate={viewAnchorDate} startTs={currentRange.startTs} endTs={currentRange.endTs} />
        )}

        {activeTab === 'ai' && (
          <AIAdviceSection profile={profile} logs={logs} viewUnit={viewUnit} rangeLabel={getRangeLabel()} filteredLogs={filteredLogs} onSaveAdvice={handleAddLog} onDeleteAdvice={handleDeleteLog} />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 flex justify-around py-3 px-6 z-40 safe-pb shadow-[0_-5px_20px_rgba(0,0,0,0.03)] overflow-x-auto no-scrollbar">
        {(['timeline', 'todo', 'stats', 'ai'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex flex-col items-center transition-colors px-4 min-w-[60px] ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400'}`}>
            <i className={`fas ${tab === 'timeline' ? 'fa-list-ul' : tab === 'todo' ? 'fa-clipboard-list' : tab === 'stats' ? 'fa-chart-line' : 'fa-robot'} text-lg`}></i>
            <span className="text-[10px] mt-1 font-bold">{tab === 'timeline' ? '时光轴' : tab === 'todo' ? '待办' : tab === 'stats' ? '统计看板' : 'AI 专家'}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
