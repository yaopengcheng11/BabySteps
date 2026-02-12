import React, { useState, useEffect, useMemo } from 'react';
import { LogType, BabyLog, BabyProfile, User } from './types';
import { api } from './services/api'; // ✅ 引入 API
import { Header } from './components/Header';
import { ActionButtons } from './components/ActionButtons';
import { StatsSection } from './components/StatsSection';
import { AIAdviceSection } from './components/AIAdviceSection';
import { ProfileSetup } from './components/ProfileSetup';
import { NoteBoard } from './components/NoteBoard';
import { StatusDashboard } from './components/StatusDashboard';
import { AuthScreen } from './components/AuthScreen';

// 移除旧的 STORAGE KEYS，不再需要了

export type ViewUnit = 'day' | 'week' | 'month' | 'custom';
export type AppTab = 'timeline' | 'notes' | 'stats' | 'ai';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<BabyLog[]>([]);
  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('timeline');
  const [isLoading, setIsLoading] = useState(true); // ✅ 新增 Loading 状态

  // 视图状态
  const [viewUnit, setViewUnit] = useState<ViewUnit>('day');
  const [viewAnchorDate, setViewAnchorDate] = useState<Date>(new Date());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [editingLog, setEditingLog] = useState<BabyLog | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Set<LogType>>(new Set(Object.values(LogType)));

  // PWA 相关
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());

  // ✅ 1. 初始化：检查 Token 并拉取数据
  useEffect(() => {
    const initApp = async () => {
      const token = localStorage.getItem('token');
      const savedUserStr = localStorage.getItem('babysteps_user_cache'); // 仅用于缓存用户名

      if (token && savedUserStr) {
        setCurrentUser(JSON.parse(savedUserStr));
        try {
          // 并行加载资料和日志
          const [fetchedProfile, fetchedLogs] = await Promise.all([
            api.getProfile(),
            api.getLogs()
          ]);
          if (fetchedProfile) setProfile(fetchedProfile);
          if (fetchedLogs) setLogs(fetchedLogs);
        } catch (e) {
          console.error('Session expired or network error', e);
          // 如果出错（比如 Token 过期），可以选择登出
          // handleLogout(); 
        }
      }
      setIsLoading(false);
    };

    initApp();

    // PWA Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!localStorage.getItem('pwa_prompt_closed')) setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // ✅ 2. 登录逻辑
  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('babysteps_user_cache', JSON.stringify(user));

    // 登录成功后，立刻去服务器拉取数据
    setIsLoading(true);
    try {
      const p = await api.getProfile();
      if (p) setProfile(p);
      const l = await api.getLogs();
      if (l) setLogs(l);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ 3. 登出逻辑
  const handleLogout = () => {
    setCurrentUser(null);
    setLogs([]);
    setProfile(null);
    localStorage.removeItem('token');
    localStorage.removeItem('babysteps_user_cache');
  };

  // ✅ 4. 添加日志 (保存到数据库)
  const handleAddLog = async (log: BabyLog) => {
    try {
      // 乐观更新：先在界面上显示出来，感觉很快
      const tempId = 'temp-' + Date.now();
      const tempLog = { ...log, id: tempId, userId: currentUser?.id };
      setLogs(prev => [tempLog, ...prev].sort((a, b) => b.timestamp - a.timestamp));

      // 发送给后端
      const savedLog = await api.addLog(log);

      // 用后端返回的真实数据（包含真实 ID）替换临时数据
      setLogs(prev => prev.map(l => l.id === tempId ? savedLog : l));

      // 展开对应日期
      const d = new Date(log.timestamp);
      if (isValidDate(d)) {
        const dateStr = d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
        setExpandedDates(prev => new Set(prev).add(dateStr));
      }
    } catch (e) {
      alert('保存失败，请检查网络');
      // 回滚
      setLogs(prev => prev.filter(l => !l.id.toString().startsWith('temp-')));
    }
  };

  // ✅ 5. 更新日志 (暂时只更新本地，如果后端没写 update 接口)
  const handleUpdateLog = (updatedLog: BabyLog) => {
    // TODO: 可以在 server.js 添加 app.put('/api/logs/:id') 接口
    setLogs(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l).sort((a, b) => b.timestamp - a.timestamp));
    setEditingLog(null);
  };

  // ✅ 6. 删除日志 (同步数据库)
  const handleDeleteLog = async (id: string) => {
    if (!window.confirm('确定要删除这条记录吗？')) return;
    try {
      await api.deleteLog(id);
      setLogs(prev => prev.filter(l => l.id !== id));
    } catch (e) {
      alert('删除失败');
    }
  };

  // ✅ 7. 保存宝宝资料 (同步数据库)
  const handleSaveProfile = async (newProfile: BabyProfile) => {
    try {
      await api.saveProfile(newProfile);
      setProfile({ ...newProfile, userId: currentUser?.id });
      setIsEditingProfile(false);
    } catch (e) {
      alert('保存资料失败');
    }
  };

  // 辅助功能保持不变
  const handleImportData = () => { alert("网络版暂时不支持导入功能"); };
  const handleInstallApp = async () => { /* ...PWA install logic... */ };
  const toggleFilter = (type: LogType) => {
    setSelectedFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) { if (next.size > 1) next.delete(type); }
      else { next.add(type); }
      return next;
    });
  };

  // --- 计算逻辑 (useMemo) ---
  const currentRange = useMemo(() => {
    let startTs = 0, endTs = Infinity;
    const validAnchor = isValidDate(viewAnchorDate) ? viewAnchorDate : new Date();
    const startOfAnchor = new Date(validAnchor); startOfAnchor.setHours(0, 0, 0, 0);

    if (viewUnit === 'day') {
      startTs = startOfAnchor.getTime();
      const endOfDay = new Date(startOfAnchor); endOfDay.setDate(endOfDay.getDate() + 1); endTs = endOfDay.getTime();
    } else if (viewUnit === 'week') {
      const day = startOfAnchor.getDay(); const diff = startOfAnchor.getDate() - day;
      const startOfWeek = new Date(startOfAnchor.setDate(diff)); startTs = startOfWeek.getTime();
      const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(endOfWeek.getDate() + 7); endTs = endOfWeek.getTime();
    } else if (viewUnit === 'month') {
      const startOfMonth = new Date(startOfAnchor.getFullYear(), startOfAnchor.getMonth(), 1); startTs = startOfMonth.getTime();
      const endOfMonth = new Date(startOfAnchor.getFullYear(), startOfAnchor.getMonth() + 1, 1); endTs = endOfMonth.getTime();
    } else if (viewUnit === 'custom') {
      const s = customRange.start ? new Date(customRange.start) : null;
      const e = customRange.end ? new Date(customRange.end) : null;
      startTs = (s && isValidDate(s)) ? s.setHours(0, 0, 0, 0) : 0;
      endTs = (e && isValidDate(e)) ? e.setHours(23, 59, 59, 999) : Infinity;
    }
    return { startTs, endTs };
  }, [viewUnit, viewAnchorDate, customRange]);

  // AI 报告锚点
  const reportAnchorDate = useMemo(() => {
    if (viewUnit === 'custom' && customRange.end) return new Date(customRange.end);
    if (viewUnit === 'week' || viewUnit === 'month') return new Date(currentRange.endTs - 1000);
    return viewAnchorDate;
  }, [viewUnit, viewAnchorDate, customRange.end, currentRange.endTs]);

  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => log.timestamp >= currentRange.startTs && log.timestamp < currentRange.endTs)
      .filter(log => selectedFilters.has(log.type));
  }, [logs, currentRange, selectedFilters]);

  const statsLogs = useMemo(() => logs.filter(log => log.timestamp >= currentRange.startTs && log.timestamp < currentRange.endTs), [logs, currentRange]);

  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: BabyLog[] } = {};
    filteredLogs.forEach(log => {
      const d = new Date(log.timestamp);
      if (!isValidDate(d)) return;
      const dateStr = d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(log);
    });
    const result = Object.entries(groups).sort((a, b) => b[1][0].timestamp - a[1][0].timestamp);
    if (expandedDates.size === 0 && result.length > 0) setExpandedDates(new Set([result[0][0]]));
    return result;
  }, [filteredLogs]);

  // UI 组件部分
  const navigateTime = (dir: number) => {
    if (!isValidDate(viewAnchorDate)) return;
    const d = new Date(viewAnchorDate);
    if (viewUnit === 'day') d.setDate(d.getDate() + dir);
    if (viewUnit === 'week') d.setDate(d.getDate() + dir * 7);
    if (viewUnit === 'month') d.setMonth(d.getMonth() + dir);
    setViewAnchorDate(d);
  };
  const getRangeLabel = () => {
    if (!isValidDate(viewAnchorDate)) return '...';
    if (viewUnit === 'day') return viewAnchorDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
    return viewAnchorDate.toLocaleDateString('zh-CN', { month: 'long' }); // 简化版
  };

  // 渲染逻辑
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-400">加载数据中...</div>;
  if (!currentUser) return <AuthScreen onLogin={handleLogin} />;

  if (!profile || isEditingProfile) {
    return (
      <ProfileSetup
        initialData={profile || undefined}
        onSave={handleSaveProfile}
        onImport={handleImportData}
        onCancel={profile ? () => setIsEditingProfile(false) : undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Header
        profile={profile}
        onEditProfile={() => setIsEditingProfile(true)}
        onLogout={handleLogout}
        logs={logs}
        onImportData={handleImportData}
        isInstallable={!!deferredPrompt}
        onInstall={handleInstallApp}
      />

      <main className="flex-grow container mx-auto px-4 py-4 max-w-2xl overflow-y-auto no-scrollbar pb-32">
        <StatusDashboard logs={logs} />

        <div className="mb-4 bg-white rounded-3xl p-3 shadow-sm border border-slate-100">
          <ActionButtons
            onAddLog={handleAddLog}
            onUpdateLog={handleUpdateLog}
            editingLog={editingLog}
            onCloseEdit={() => setEditingLog(null)}
            birthDate={profile.birthDate}
            currentAnchorDate={isValidDate(viewAnchorDate) ? viewAnchorDate : new Date()}
          />
        </div>

        {/* Tab 切换 */}
        <div className="flex bg-white rounded-full p-1 mb-6 shadow-sm border border-slate-100 sticky top-0 z-30 overflow-x-auto no-scrollbar">
          {(['timeline', 'notes', 'stats', 'ai'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[60px] py-2.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500'}`}
            >
              {tab === 'timeline' ? '时光轴' : tab === 'notes' ? '便签' : tab === 'stats' ? '统计' : 'AI'}
            </button>
          ))}
        </div>

        {/* 视图控制 (日/周/月) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-grow bg-slate-100 rounded-lg p-1 mr-3">
              {(['day', 'week', 'month', 'custom'] as ViewUnit[]).map(unit => (
                <button key={unit} onClick={() => setViewUnit(unit)} className={`flex-1 py-1.5 rounded-md text-[10px] ${viewUnit === unit ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                  {unit === 'day' ? '日' : unit === 'week' ? '周' : unit === 'month' ? '月' : '选'}
                </button>
              ))}
            </div>
            <button onClick={() => { setViewAnchorDate(new Date()); setViewUnit('day'); }} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold">今日</button>
          </div>
          {viewUnit !== 'custom' && (
            <div className="flex items-center justify-between px-2 bg-slate-50/50 rounded-xl py-1">
              <button onClick={() => navigateTime(-1)}><i className="fas fa-chevron-left text-slate-400"></i></button>
              <div className="text-xs font-bold text-slate-700">{getRangeLabel()}</div>
              <button onClick={() => navigateTime(1)}><i className="fas fa-chevron-right text-slate-400"></i></button>
            </div>
          )}
          {activeTab === 'timeline' && (
            <div className="pt-2 border-t border-slate-50 flex space-x-2 overflow-x-auto pb-1">
              {/* 这里放你原来的 FilterBar 代码，因为篇幅原因省略，逻辑不变 */}
              {Object.values(LogType).map(type => (
                <button key={type} onClick={() => toggleFilter(type)} className={`px-3 py-1 rounded-full text-[10px] border ${selectedFilters.has(type) ? 'bg-indigo-100 border-indigo-200 text-indigo-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 内容区域 */}
        {activeTab === 'timeline' && (
          <div className="space-y-6 relative">
            {groupedLogs.map(([date, dayLogs]) => (
              <div key={date}>
                <div className="sticky top-0 z-20 bg-slate-50/95 py-2 px-1 font-bold text-xs text-slate-800">{date}</div>
                <div className="ml-2 border-l-2 border-indigo-100 pl-4 space-y-4 py-2">
                  {dayLogs.map(log => (
                    <LogCard
                      key={log.id}
                      log={log}
                      onDelete={() => handleDeleteLog(log.id)}
                      onEdit={() => setEditingLog(log)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {groupedLogs.length === 0 && <div className="text-center text-slate-400 text-xs py-10">暂无记录</div>}
          </div>
        )}

        {activeTab === 'notes' && <NoteBoard logs={statsLogs} rangeLabel={getRangeLabel()} onDelete={handleDeleteLog} />}
        {activeTab === 'stats' && <StatsSection logs={statsLogs} viewUnit={viewUnit} viewAnchorDate={viewAnchorDate} startTs={currentRange.startTs} endTs={currentRange.endTs} />}
        {activeTab === 'ai' && (
          <AIAdviceSection
            profile={profile}
            logs={logs}
            viewUnit={viewUnit}
            rangeLabel={getRangeLabel()}
            viewAnchorDate={reportAnchorDate}
            filteredLogs={filteredLogs}
            onSaveAdvice={handleAddLog}
            onDeleteAdvice={handleDeleteLog}
          />
        )}
      </main>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 flex justify-around py-3 px-6 z-40">
        {(['timeline', 'notes', 'stats', 'ai'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex flex-col items-center ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400'}`}>
            <i className={`fas ${tab === 'timeline' ? 'fa-list-ul' : tab === 'notes' ? 'fa-sticky-note' : tab === 'stats' ? 'fa-chart-line' : 'fa-robot'} text-lg`}></i>
            <span className="text-[10px] mt-1 font-bold">{tab === 'timeline' ? '时光' : tab === 'notes' ? '便签' : tab === 'stats' ? '统计' : 'AI'}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;