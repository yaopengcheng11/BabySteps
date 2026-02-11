
import React, { useState, useRef, useEffect } from 'react';
import { BabyProfile, BabyLog } from '../types';

interface HeaderProps {
  profile: BabyProfile;
  onEditProfile: () => void;
  onLogout: () => void;
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

export const Header: React.FC<HeaderProps> = ({ profile, onEditProfile, onLogout, logs, onImportData, isInstallable, onInstall }) => {
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

  const handleExport = () => {
    const now = new Date();
    const data = {
      version: '1.5',
      exportDate: now.toISOString(),
      profile,
      logs
    };
    const timestamp = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '') + '_' + 
    now.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' }).replace(/:/g, '');

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
        }
      } catch (error) {
        alert('解析备份文件失败。');
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
              <h3 className="text-lg font-bold text-slate-800">设置与账号</h3>
              <button onClick={() => setShowSettings(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-400">
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
                <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center">
                  <i className="fas fa-shield-halved mr-2"></i> 数据安全
                </h4>
                <button 
                  onClick={handleExport}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all text-slate-600 text-xs font-bold mb-3"
                >
                  <i className="fas fa-download text-xs"></i>
                  <span>导出备份 (.json)</span>
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-slate-50 text-slate-500 rounded-xl border border-dashed border-slate-300 text-xs font-bold"
                >
                  <i className="fas fa-file-import text-xs"></i>
                  <span>导入备份文件</span>
                </button>
              </div>

              <div className="h-px bg-slate-100 my-2"></div>

              <button 
                onClick={() => { onLogout(); setShowSettings(false); }}
                className="w-full flex items-center p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-colors group"
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-400 mr-4 shadow-sm group-hover:bg-rose-500 group-hover:text-white transition-all">
                  <i className="fas fa-sign-out-alt"></i>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">退出登录</p>
                  <p className="text-[10px] opacity-60">安全退出当前账号</p>
                </div>
              </button>
            </div>

            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportClick} />
          </div>
        </div>
      )}

      {pendingImport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl text-center">
            <h3 className="text-lg font-bold mb-6">确认恢复备份？</h3>
            <div className="bg-slate-50 rounded-2xl p-4 w-full mb-6 text-left space-y-2">
              <div className="flex justify-between items-center text-[10px] text-slate-400"><span>宝宝姓名</span><span className="font-black text-slate-700">{pendingImport.babyName}</span></div>
              <div className="flex justify-between items-center text-[10px] text-slate-400"><span>包含记录</span><span className="font-black text-slate-700">{pendingImport.logCount} 条</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPendingImport(null)} className="py-4 rounded-2xl bg-slate-100 text-slate-500 font-bold text-xs">取消</button>
              <button onClick={confirmImport} className="py-4 rounded-2xl bg-indigo-500 text-white font-bold text-xs shadow-lg">确认恢复</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
