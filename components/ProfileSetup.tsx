
import React, { useState } from 'react';
import { BabyProfile } from '../types';

interface ProfileSetupProps {
  onSave: (profile: BabyProfile) => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onSave }) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState(new Date().toISOString().split('T')[0]);
  const [gender, setGender] = useState<'boy' | 'girl'>('boy');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSave({ name, birthDate, gender });
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 md:p-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500 mx-auto mb-4">
            <i className="fas fa-baby-carriage text-4xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">欢迎来到 BabySteps</h1>
          <p className="text-slate-500 mt-2">让我们先创建一个宝宝档案</p>
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

          <button 
            type="submit"
            className="w-full bg-indigo-500 text-white font-bold py-5 rounded-3xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100 mt-4 active:scale-95"
          >
            开启记录之旅
          </button>
        </form>
      </div>
    </div>
  );
};
