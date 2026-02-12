
import React, { useState, useRef, useEffect } from 'react';
import { BabyProfile, BabyLog } from '../types';

interface ProfileSetupProps {
  initialData?: BabyProfile;
  onSave: (profile: BabyProfile) => void;
  onImport: (logs: BabyLog[], profile: BabyProfile) => void;
  onCancel?: () => void;
}

interface PendingImport {
  logs: BabyLog[];
  profile: BabyProfile;
  importTime: string;
  logCount: number;
  babyName: string;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ initialData, onSave, onImport, onCancel }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [birthDate, setBirthDate] = useState(initialData?.birthDate || new Date().toISOString().split('T')[0]);
  const [gender, setGender] = useState<'boy' | 'girl'>(initialData?.gender || 'boy');
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSave({ name, birthDate, gender });
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
      onImport(pendingImport.logs, pendingImport.profile);
      setPendingImport(null);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-6 relative">
      {onCancel && (
        <button 
          onClick={onCancel}
          className="absolute top-8 left-8 w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-500 shadow-lg active:scale-90 transition-all z-10"
          aria-label="返回"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
      )}

      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 md:p-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500 mx-auto mb-4">
            <i className="fas fa-baby-carriage text-4xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{initialData ? '编辑宝宝档案' : '欢迎来到 BabySteps'}</h1>
          <p className="text-slate-500 mt-2">{initialData ? '随时更新宝宝的基础资料' : '让我们先创建一个宝宝档案'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">宝宝姓名</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：小明"
              className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-400 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">出生日期</label>
            <input 
              type="date" 
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-400 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">性别</label>
            <div className="flex space-x-4">
              <button 
                type="button"
                onClick={() => setGender('boy')}
                className={`flex-1 py-4 rounded-2xl border-2 flex items-center justify-center transition-all ${gender === 'boy' ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400'}`}
              >
                <i className="fas fa-mars mr-2"></i> 男孩
              </button>
              <button 
                type="button"
                onClick={() => setGender('girl')}
                className={`flex-1 py-4 rounded-2xl border-2 flex items-center justify-center transition-all ${gender === 'girl' ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-slate-100 text-slate-400'}`}
              >
                <i className="fas fa-venus mr-2"></i> 女孩
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <button 
              type="submit"
              className="w-full bg-indigo-500 text-white font-bold py-5 rounded-3xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100 active:scale-95"
            >
              {initialData ? '保存修改' : '开启记录之旅'}
            </button>
            
            {!initialData && (
              <>
                <div className="flex items-center space-x-2">
                    <div className="h-px bg-slate-100 flex-grow"></div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">已有数据？</span>
                    <div className="h-px bg-slate-100 flex-grow"></div>
                </div>

                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-white border-2 border-indigo-50 text-indigo-500 font-bold py-4 rounded-3xl hover:bg-indigo-50 transition-all active:scale-95 flex items-center justify-center space-x-2"
                >
                  <i className="fas fa-file-import text-xs"></i>
                  <span>从备份恢复</span>
                </button>
              </>
            )}
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".json" 
            onChange={handleImportClick} 
          />
        </form>
      </div>

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
            <div className="grid grid-cols-2 gap-3 w-full">
              <button onClick={() => setPendingImport(null)} className="py-4 rounded-2xl bg-slate-100 text-slate-500 font-bold text-xs active:scale-95 transition-all">取消</button>
              <button onClick={confirmImport} className="py-4 rounded-2xl bg-indigo-500 text-white font-bold text-xs active:scale-95 transition-all shadow-lg shadow-indigo-100">确认恢复</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
