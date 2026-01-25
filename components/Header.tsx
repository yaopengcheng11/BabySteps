
import React, { useState, useRef, useEffect } from 'react';
import { BabyProfile, BabyLog } from '../types';

interface HeaderProps {
  profile: BabyProfile;
  onEditProfile: () => void;
  logs: BabyLog[];
  onImportData: (logs: BabyLog[], profile: BabyProfile) => void;
}

const STORAGE_KEY_LAST_EXPORT = 'babysteps_last_export_v1';

interface PendingImport {
  logs: BabyLog[];
  profile: BabyProfile;
  importTime: string;
  currentTime: string | null;
  isOlder: boolean;
}

export const Header: React.FC<HeaderProps> = ({ profile, onEditProfile, logs, onImportData }) => {
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
      version: '1.0',
      exportDate: now.toISOString(),
      profile,
      logs
    };
    
    const timestamp = now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '') + '_' + 
    now.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/:/g, '');

    const fileName = `BabySteps_${profile.name}_${timestamp}.json`;
    
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
        if (json.logs && json.profile) {
          const importLastLogTs = json.logs.length > 0 
            ? Math.max(...json.logs.map((l: any) => l.timestamp))
            : new Date(json.exportDate || 0).getTime();

          const currentLastLogTs = logs.length > 0 
            ? Math.max(...logs.map((l: any) => l.timestamp))
            : null;

          setPendingImport({
            logs: json.logs,
            profile: json.profile,
            importTime: new Date(importLastLogTs).toLocaleString('zh-CN'),
            currentTime: currentLastLogTs ? new Date(currentLastLogTs).toLocaleString('zh-CN') : null,
            isOlder: currentLastLogTs !== null && importLastLogTs < currentLastLogTs
          });
        } else {
          alert('无效的备份文件格式。');
        }
      } catch (error) {
        alert('解析文件失败。');
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
      // Small delay for UI smoothness
      setTimeout(() => alert('数据恢复成功！'), 100);
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
          <button 
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-indigo-500 transition-all active:scale-90"
          >
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">系统设置</h3>
              <button onClick={() => setShowSettings(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-400">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => {
                  onEditProfile();
                  setShowSettings(false);
                }}
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

              <div className="border-t border-slate-100 my-2 pt-4">
                <div className="flex justify-between items-center mb-3 ml-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">数据安全</p>
                  {lastExport && (
                    <span className="text-[9px] text-indigo-400 font-medium">上次备份: {lastExport.split(' ')[0]}</span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleExport}
                    className="flex flex-col items-center p-4 bg-indigo-50/50 rounded-2xl hover:bg-indigo-100 transition-colors text-indigo-600 border border-indigo-100/50"
                  >
                    <i className="fas fa-file-export text-xl mb-2"></i>
                    <span className="text-[11px] font-bold">导出 JSON</span>
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center p-4 bg-emerald-50 rounded-2xl hover:bg-emerald-100 transition-colors text-emerald-600 border border-emerald-100/50"
                  >
                    <i className="fas fa-file-import text-xl mb-2"></i>
                    <span className="text-[11px] font-bold">导入恢复</span>
                  </button>
                </div>
                
                {lastExport && (
                  <p className="text-[9px] text-slate-400 mt-2 ml-1 text-center italic">
                    最近一次导出时间：{lastExport}
                  </p>
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

            <div className="mt-8 text-center">
              <div className="inline-flex items-center px-3 py-1 bg-slate-50 rounded-full text-[9px] text-slate-400">
                <i className="fas fa-shield-halved mr-1.5 text-indigo-300"></i>
                数据存储在您的手机本地
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Import Verification Modal */}
      {pendingImport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl overflow-hidden relative">
            {pendingImport.isOlder && (
              <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-400"></div>
            )}
            
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${pendingImport.isOlder ? 'bg-amber-100 text-amber-500 animate-pulse' : 'bg-indigo-100 text-indigo-500'}`}>
                <i className={`fas ${pendingImport.isOlder ? 'fa-exclamation-triangle' : 'fa-file-import'} text-2xl`}></i>
              </div>
              
              <h3 className={`text-lg font-bold mb-2 ${pendingImport.isOlder ? 'text-amber-700' : 'text-slate-800'}`}>
                {pendingImport.isOlder ? '发现版本冲突！' : '确认恢复数据？'}
              </h3>
              
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                {pendingImport.isOlder 
                  ? '您正在导入一份较旧的备份。如果继续，当前手机内较新的记录将被删除。' 
                  : '此操作将使用备份文件替换当前手机内的所有记录。'}
              </p>

              <div className="w-full bg-slate-50 rounded-2xl p-4 mb-8 space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-bold uppercase">备份记录至</span>
                  <span className="text-slate-700 font-bold">{pendingImport.importTime}</span>
                </div>
                {pendingImport.currentTime && (
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-bold uppercase">当前手机至</span>
                    <span className={`font-bold ${pendingImport.isOlder ? 'text-amber-600' : 'text-slate-700'}`}>
                      {pendingImport.currentTime}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-bold uppercase">宝宝姓名</span>
                  <span className="text-indigo-600 font-bold">{pendingImport.profile.name}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <button 
                  onClick={() => setPendingImport(null)}
                  className="py-4 rounded-2xl bg-slate-100 text-slate-500 font-bold text-xs hover:bg-slate-200 transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={confirmImport}
                  className={`py-4 rounded-2xl text-white font-bold text-xs shadow-lg transition-all active:scale-95 ${pendingImport.isOlder ? 'bg-amber-500' : 'bg-indigo-500'}`}
                >
                  确认并覆盖
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
