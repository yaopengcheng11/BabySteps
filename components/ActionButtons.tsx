
import React, { useState, useEffect, useMemo } from 'react';
import { LogType, FeedingMethod, DiaperStatus, BabyLog, GrowthCategory } from '../types';

interface ActionButtonsProps {
  onAddLog: (log: BabyLog) => void;
  birthDate: string;
  currentAnchorDate: Date;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onAddLog, birthDate, currentAnchorDate }) => {
  const [activeForm, setActiveForm] = useState<LogType | null>(null);

  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [timeOffset, setTimeOffset] = useState<number>(0); 
  const [showCustomTime, setShowCustomTime] = useState(false);
  
  const [feedingAmount, setFeedingAmount] = useState(120);
  const [feedingDuration, setFeedingDuration] = useState(20);
  const [feedingMethod, setFeedingMethod] = useState(FeedingMethod.BOTTLE);
  const [sleepDuration, setSleepDuration] = useState(30);
  const [diaperStatus, setDiaperStatus] = useState(DiaperStatus.WET);
  const [vaccineName, setVaccineName] = useState('');
  const [nextDoseDate, setNextDoseDate] = useState('');
  const [note, setNote] = useState('');

  const [growthEventName, setGrowthEventName] = useState('');
  const [growthCategory, setGrowthCategory] = useState<GrowthCategory>(GrowthCategory.MILESTONE);
  const [growthWeight, setGrowthWeight] = useState<string>('');
  const [growthHeight, setGrowthHeight] = useState<string>('');

  useEffect(() => {
    if (!activeForm) return;

    const isToday = currentAnchorDate.toDateString() === new Date().toDateString();

    if (!showCustomTime) {
      const baseDate = isToday ? new Date() : new Date(currentAnchorDate);
      if (isToday) {
        setSelectedTime(new Date(Date.now() - timeOffset * 60000));
      } else {
        baseDate.setHours(new Date().getHours(), new Date().getMinutes() - timeOffset, 0, 0);
        setSelectedTime(baseDate);
      }
    }
  }, [timeOffset, activeForm, showCustomTime, currentAnchorDate]);

  const resetForms = () => {
    setActiveForm(null);
    setTimeOffset(0);
    setShowCustomTime(false);
    setNote('');
    setVaccineName('');
    setNextDoseDate('');
    setGrowthEventName('');
    setGrowthWeight('');
    setGrowthHeight('');
    setGrowthCategory(GrowthCategory.MILESTONE);
  };

  const handleSave = () => {
    const baseData = {
      id: Date.now().toString(),
      timestamp: selectedTime.getTime(),
      note: note.trim() || undefined,
    };

    switch (activeForm) {
      case LogType.FEEDING:
        onAddLog({ ...baseData, type: LogType.FEEDING, method: feedingMethod, amount: feedingMethod === FeedingMethod.BREAST ? undefined : feedingAmount, duration: feedingMethod === FeedingMethod.BREAST ? feedingDuration : undefined } as any);
        break;
      case LogType.SLEEP:
        onAddLog({ ...baseData, type: LogType.SLEEP, duration: sleepDuration, endTime: selectedTime.getTime() + sleepDuration * 60000 } as any);
        break;
      case LogType.DIAPER:
        onAddLog({ ...baseData, type: LogType.DIAPER, status: diaperStatus } as any);
        break;
      case LogType.VACCINE:
        if (!vaccineName.trim()) { alert('请输入疫苗名称'); return; }
        onAddLog({ ...baseData, type: LogType.VACCINE, vaccineName: vaccineName.trim(), nextDoseDate: nextDoseDate || undefined } as any);
        break;
      case LogType.GROWTH:
        if (!growthEventName.trim() && !growthWeight && !growthHeight) { alert('请输入事件或指标'); return; }
        onAddLog({ ...baseData, type: LogType.GROWTH, eventName: growthEventName.trim() || "成长记录", category: growthCategory, weight: growthWeight ? parseFloat(growthWeight) : undefined, height: growthHeight ? parseFloat(growthHeight) : undefined } as any);
        break;
      case LogType.NOTE:
        if (!note.trim()) { alert('请输入便签内容'); return; }
        onAddLog({ ...baseData, type: LogType.NOTE, content: note.trim() } as any);
        break;
      default: break;
    }
    resetForms();
  };

  const CompactTimePicker = () => {
    const formattedDate = `${selectedTime.getMonth() + 1}/${selectedTime.getDate()} ${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
    
    return (
      <div className="bg-white rounded-3xl p-4 border border-slate-100 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[13px] font-bold text-slate-800">记录时间</span>
          <div className="flex items-center space-x-2">
            <span className="text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full">{formattedDate}</span>
            <button onClick={() => setShowCustomTime(!showCustomTime)} className="text-[11px] text-slate-400 font-medium">{showCustomTime ? '返回滑动' : '自定义'}</button>
          </div>
        </div>
        {!showCustomTime ? (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {[0, 15, 30, 60, 120, 240].map(offset => (
                <button key={offset} onClick={() => setTimeOffset(offset)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-[11px] font-bold border transition-all ${timeOffset === offset ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-500'}`}>
                  {offset === 0 ? '现在' : `${offset >= 60 ? offset/60 + 'h前' : offset + 'm前'}`}
                </button>
              ))}
            </div>
            <input type="range" min="0" max="480" step="1" value={timeOffset} onChange={(e) => setTimeOffset(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
          </div>
        ) : (
          <input type="datetime-local" value={new Date(selectedTime.getTime() - selectedTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16)} onChange={(e) => setSelectedTime(new Date(e.target.value))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-bold text-indigo-700 outline-none" />
        )}
      </div>
    );
  };

  const ActionBtn = ({ type, icon, label, color }: { type: LogType, icon: string, label: string, color: string }) => (
    <button onClick={() => setActiveForm(type)} className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-slate-50 transition-colors">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white mb-2 shadow-lg shadow-slate-100 transform active:scale-90 transition-all`}>
        <i className={`fas ${icon} text-lg`}></i>
      </div>
      <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{label}</span>
    </button>
  );

  const getThemeColor = () => {
    switch (activeForm) {
      case LogType.FEEDING: return 'bg-orange-400';
      case LogType.SLEEP: return 'bg-indigo-400';
      case LogType.DIAPER: return 'bg-teal-400';
      case LogType.VACCINE: return 'bg-emerald-500';
      case LogType.GROWTH: return 'bg-rose-400';
      case LogType.NOTE: return 'bg-amber-400';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-y-4 gap-x-2">
        <ActionBtn type={LogType.FEEDING} icon="fa-bottle-water" label="喂养" color="bg-orange-400" />
        <ActionBtn type={LogType.SLEEP} icon="fa-moon" label="睡眠" color="bg-indigo-400" />
        <ActionBtn type={LogType.DIAPER} icon="fa-poop" label="尿布" color="bg-teal-400" />
        <ActionBtn type={LogType.VACCINE} icon="fa-syringe" label="疫苗" color="bg-emerald-500" />
        <ActionBtn type={LogType.GROWTH} icon="fa-star" label="成长" color="bg-rose-400" />
        <ActionBtn type={LogType.NOTE} icon="fa-note-sticky" label="便签" color="bg-amber-400" />
      </div>

      {activeForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center overflow-hidden">
          <div className="bg-white rounded-t-[2.5rem] md:rounded-[2rem] w-full max-w-md p-6 shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800">记录 {
                activeForm === LogType.DIAPER ? '尿布' :
                activeForm === LogType.VACCINE ? '疫苗' :
                activeForm === LogType.GROWTH ? '成长' : activeForm
              }</h3>
              <button onClick={resetForms} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-300"><i className="fas fa-times"></i></button>
            </div>
            <div className="flex-grow overflow-y-auto no-scrollbar space-y-5 pb-6 px-1">
              <CompactTimePicker />
              
              {activeForm === LogType.FEEDING && (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.values(FeedingMethod).map(m => (
                      <button key={m} onClick={() => setFeedingMethod(m)} className={`py-3 rounded-xl border text-[11px] font-bold ${feedingMethod === m ? 'bg-orange-400 border-orange-400 text-white' : 'bg-white border-slate-100 text-slate-500'}`}>{m}</button>
                    ))}
                  </div>
                  <div className="bg-slate-50 p-4 rounded-3xl border">
                    <div className="flex justify-between items-end mb-3"><span className="text-[12px] font-bold text-slate-500">{feedingMethod === FeedingMethod.BREAST ? '时长' : '奶量'}</span><span className="text-orange-500 font-black text-lg">{feedingMethod === FeedingMethod.BREAST ? `${feedingDuration} min` : `${feedingAmount} ml`}</span></div>
                    <input type="range" min={feedingMethod === FeedingMethod.BREAST ? "1" : "10"} max={feedingMethod === FeedingMethod.BREAST ? "60" : "300"} value={feedingMethod === FeedingMethod.BREAST ? feedingDuration : feedingAmount} onChange={(e) => feedingMethod === FeedingMethod.BREAST ? setFeedingDuration(parseInt(e.target.value)) : setFeedingAmount(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none accent-orange-400" />
                  </div>
                </>
              )}

              {activeForm === LogType.DIAPER && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(DiaperStatus).map(s => (
                      <button 
                        key={s} 
                        onClick={() => setDiaperStatus(s)} 
                        className={`py-4 rounded-2xl border text-[11px] font-bold transition-all ${diaperStatus === s ? 'bg-teal-400 border-teal-400 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeForm === LogType.VACCINE && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-wider">疫苗名称</label>
                    <input 
                      type="text" 
                      value={vaccineName} 
                      onChange={(e) => setVaccineName(e.target.value)} 
                      placeholder="例如：乙肝疫苗、卡介苗..." 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-wider">下次接种预约 (可选)</label>
                    <input 
                      type="date" 
                      value={nextDoseDate} 
                      onChange={(e) => setNextDoseDate(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                  </div>
                </div>
              )}

              {activeForm === LogType.GROWTH && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-wider">发生了什么？</label>
                    <input 
                      type="text" 
                      value={growthEventName} 
                      onChange={(e) => setGrowthEventName(e.target.value)} 
                      placeholder="例如：第一次翻身、长了第一颗牙..." 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-100 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-wider">记录类型</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.values(GrowthCategory).map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => setGrowthCategory(cat)} 
                          className={`py-3 rounded-xl border text-[10px] font-bold transition-all ${growthCategory === cat ? 'bg-rose-400 border-rose-400 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-wider">体重 (kg)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={growthWeight} 
                        onChange={(e) => setGrowthWeight(e.target.value)} 
                        placeholder="0.00" 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-wider">身高 (cm)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={growthHeight} 
                        onChange={(e) => setGrowthHeight(e.target.value)} 
                        placeholder="0.0" 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeForm === LogType.NOTE && (
                <textarea 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  placeholder="记录宝宝的小趣事..." 
                  rows={4} 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-200 transition-all resize-none" 
                />
              )}
              
              {(activeForm !== LogType.NOTE && activeForm !== LogType.GROWTH) && (
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-wider">备注</label>
                  <textarea 
                    value={note} 
                    onChange={(e) => setNote(e.target.value)} 
                    placeholder="添加更多细节..." 
                    rows={2} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none resize-none" 
                  />
                </div>
              )}
            </div>
            <button onClick={handleSave} className={`w-full py-5 rounded-[2rem] text-white font-black shadow-xl active:scale-95 transition-all ${getThemeColor()}`}>
              确认保存
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
