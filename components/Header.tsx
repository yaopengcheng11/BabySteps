
import React, { useState, useRef, useEffect } from 'react';
import { BabyProfile, BabyLog } from '../types';

interface HeaderProps {
  profile: BabyProfile;
  onEditProfile: () => void;
  logs: BabyLog[];
  onImportData: (logs: BabyLog[], profile: BabyProfile) => void;
  isInstallable: boolean;
  onInstall: () => void;
}

const STORAGE_KEY_LAST_EXPORT = 'babysteps_last_export_v1';

interface PendingImport {
  logs: BabyLog[];
  profile: BabyProfile;
  importTime: string;
  logCount: number;
  babyName: string;
}

export const Header: React.FC<HeaderProps> = ({ profile, onEditProfile, logs, onImportData, isInstallable, onInstall }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LAST_EXPORT);
    if (saved) setLastExport(saved);
  }, []);

  const getAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const diffTime = Math.abs(today.getTime() - birth.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} 天`;
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    return `${months} 个月 ${days} 天`;
  };

  const generateBackupData = () => {
    const now = new Date();
    return {
      version: '1.4',
      exportDate: now.toISOString(),
      profile,
      logs
    };
  };

  const handleExport = () => {
    const now = new Date();
    const data = generateBackupData();
    const timestamp = now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '') + '_' + 
    now.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/:/g, '');

    const fileName = `BabySteps_Backup_${profile.name}_${timestamp}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const exportTimeString = now.toLocaleString('zh-CN');
    setLastExport(exportTimeString);
    localStorage.setItem(STORAGE_KEY_LAST_EXPORT, exportTimeString);
    setShowSettings(false);
  };

  const handleImportClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.profile && json.logs) {
          setPendingImport({
            logs: json.logs,
            profile: json.profile,
            importTime: new Date(json.exportDate || Date.now()).toLocaleString('zh-CN'),
            logCount: json.logs.length,
            babyName: json.profile.name
          });
        } else {
          alert('无效的备份文件：缺少核心数据。');
        }
      } catch (error) {
        alert('解析备份文件失败，请确保文件格式正确。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmImport = () => {
    if (pendingImport) {
      onImportData(pendingImport.logs, pendingImport.profile);
      setPendingImport(null);
      setShowSettings(false);
      setTimeout(() => alert('全量数据恢复成功！'), 100);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm ${profile.gender === 'boy' ? 'bg-blue-400' : 'bg-pink-400'}`}>
              <i className={`fas fa-baby text-xl`}></i>
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-tight">{profile.name}</h1>
              <p className="text-[10px] text-slate-500 font-medium">已出生 {getAge(profile.birthDate)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-indigo-500 transition-all active:scale-90"
            >
              <i className="fas fa-cog"></i>
            </button>
          </div>
        </div>
      </header>

      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-slide-up flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">系统与备份</h3>
              <button onClick={() => { setShowSettings(false); }} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-400">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto no-scrollbar space-y-4 pr-1">
              <button 
                onClick={() => { onEditProfile(); setShowSettings(false); }}
                className="w-full flex items-center p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 mr-4 shadow-sm group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <i className="fas fa-user-edit"></i>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-700">修改宝宝资料</p>
                  <p className="text-[10px] text-slate-400">更新姓名、生日或性别</p>
                </div>
              </button>

              <div className="bg-indigo-50/40 rounded-3xl p-5 border border-indigo-100/50">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-indigo-500 text-white rounded-lg flex items-center justify-center">
                    <i className="fas fa-cloud-arrow-up text-[10px]"></i>
                  </div>
                  <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">备份专家</h4>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
                  数据存储于您的浏览器本地。为了防止丢失，建议您定期导出备份：
                </p>
                
                <button 
                  onClick={handleExport}
                  className="w-full flex items-center justify-center space-x-2 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all text-slate-600"
                >
                  <i className="fas fa-download text-sm"></i>
                  <span className="text-xs font-black">导出备份文件 (.json)</span>
                </button>
              </div>

              <div className="p-4 border border-slate-100 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-bold text-slate-400">数据恢复</span>
                  <span className="text-[9px] font-bold text-indigo-400">当前 {logs.length} 项记录</span>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-colors border border-dashed border-slate-300"
                >
                  <i className="fas fa-file-import text-xs"></i>
                  <span className="text-[11px] font-bold">导入本地备份文件</span>
                </button>
              </div>

              {lastExport && (
                <div className="bg-emerald-50 rounded-xl p-3 flex items-center space-x-3">
                  <i className="fas fa-check-circle text-emerald-500 text-xs"></i>
                  <p className="text-[9px] text-emerald-700 font-bold italic">最近一次成功导出: {lastExport}</p>
                </div>
              )}
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json" 
              onChange={handleImportClick} 
            />
          </div>
        </div>
      )}

      {pendingImport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center mb-4">
                <i className="fas fa-file-import text-2xl"></i>
            </div>
            <h3 className="text-lg font-bold mb-2">确认恢复备份？</h3>
            <div className="bg-slate-50 rounded-2xl p-4 w-full mb-6 text-left space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold">宝宝姓名</span>
                <span className="text-xs font-black text-slate-700">{pendingImport.babyName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold">备份日期</span>
                <span className="text-[10px] font-black text-indigo-500">{pendingImport.importTime}</span>
              </div>
              <div className="h-px bg-slate-200/50 my-1"></div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold">包含记录</span>
                <span className="text-xs font-black text-slate-700">{pendingImport.logCount} 条</span>
              </div>
            </div>
            <p className="text-[10px] text-rose-400 mb-6 font-bold leading-relaxed px-4">
              ⚠️ 注意：导入将完全覆盖当前设备上的所有数据！
            </p>
            <div className="grid grid-cols-2 gap-3 w-full">
              <button onClick={() => setPendingImport(null)} className="py-4 rounded-2xl bg-slate-100 text-slate-500 font-bold text-xs active:scale-95 transition-all">取消</button>
              <button onClick={confirmImport} className="py-4 rounded-2xl bg-indigo-500 text-white font-bold text-xs active:scale-95 transition-all shadow-lg shadow-indigo-100">确认恢复</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
