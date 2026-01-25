
import React, { useState, useEffect, useMemo } from 'react';
import { LogType, FeedingMethod, DiaperStatus, BabyLog, GrowthCategory } from '../types';

interface ActionButtonsProps {
  onAddLog: (log: BabyLog) => void;
  birthDate: string;
}

const ReferenceTip = React.memo(({ icon, label, children }: React.PropsWithChildren<{ icon: string, label: string }>) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-[11px] font-bold text-indigo-500 bg-indigo-50/50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
      >
        <i className={`fas ${icon}`}></i>
        <span>{label}参考标准</span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-[9px]`}></i>
      </button>
      {isOpen && (
        <div className="mt-2 bg-slate-50 rounded-xl p-3 text-[11px] text-slate-500 leading-relaxed border border-slate-100 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
});

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onAddLog, birthDate }) => {
  const [activeForm, setActiveForm] = useState<LogType | null>(null);

  // Form states
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

  // Growth specific states
  const [growthEventName, setGrowthEventName] = useState('');
  const [growthCategory, setGrowthCategory] = useState<GrowthCategory>(GrowthCategory.MILESTONE);
  const [growthWeight, setGrowthWeight] = useState<string>('');
  const [growthHeight, setGrowthHeight] = useState<string>('');

  const ageInMonths = useMemo(() => {
    const today = new Date();
    const birth = new Date(birthDate);
    let months = (today.getFullYear() - birth.getFullYear()) * 12;
    months -= birth.getMonth();
    months += today.getMonth();
    if (today.getDate() < birth.getDate()) months--;
    return Math.max(0, months);
  }, [birthDate]);

  const ageLabel = useMemo(() => {
    if (ageInMonths < 1) return "0-1月";
    if (ageInMonths < 3) return "1-3月";
    if (ageInMonths < 6) return "3-6月";
    if (ageInMonths < 12) return "6-12月";
    return "1岁+";
  }, [ageInMonths]);

  useEffect(() => {
    if (activeForm && !showCustomTime) {
      const now = new Date();
      setSelectedTime(new Date(now.getTime() - timeOffset * 60000));
    }
  }, [timeOffset, activeForm, showCustomTime]);

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

  const handleAddLog = (type: LogType) => {
    const baseData = {
      id: Date.now().toString(),
      timestamp: selectedTime.getTime(),
      note: note.trim() || undefined,
    };

    switch (type) {
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
        if (!growthEventName.trim() && !growthWeight && !growthHeight) { alert('请输入事件名称或身体指标'); return; }
        onAddLog({ 
          ...baseData, 
          type: LogType.GROWTH, 
          eventName: growthEventName.trim() || (growthWeight || growthHeight ? "定期体检" : "成长瞬间"), 
          category: growthCategory,
          weight: growthWeight ? parseFloat(growthWeight) : undefined,
          height: growthHeight ? parseFloat(growthHeight) : undefined
        } as any);
        break;
      default:
        break;
    }
    resetForms();
  };

  const CompactTimePicker = () => (
    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] font-bold text-slate-500">发生时间</span>
        <div className="flex items-center space-x-2">
          <span className="text-indigo-600 font-bold text-sm">{selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <button onClick={() => setShowCustomTime(!showCustomTime)} className="text-[10px] text-slate-400 underline">{showCustomTime ? '返回滑动' : '自定义'}</button>
        </div>
      </div>
      {!showCustomTime ? (
        <div className="space-y-3">
          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
            {[0, 15, 30, 60, 120, 180].map(offset => (
              <button key={offset} onClick={() => setTimeOffset(offset)} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${timeOffset === offset ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}>{offset === 0 ? '现在' : `${offset >= 60 ? offset/60 + 'h' : offset + 'm'}前`}</button>
            ))}
          </div>
          <input type="range" min="0" max="720" step="1" value={timeOffset} onChange={(e) => setTimeOffset(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
        </div>
      ) : (
        <input type="datetime-local" value={new Date(selectedTime.getTime() - selectedTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16)} onChange={(e) => { const d = new Date(e.target.value); setSelectedTime(d); setTimeOffset(Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000))); }} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none" />
      )}
    </div>
  );

  const feedingTips = useMemo(() => (
    <ul className="list-disc list-inside space-y-1">
      {ageInMonths < 1 && <><li>奶量：60-90ml / 次</li><li>频率：每 2-3 小时一次</li></>}
      {ageInMonths >= 1 && ageInMonths < 3 && <><li>奶量：120-150ml / 次</li><li>频率：每 3-4 小时一次</li></>}
      {ageInMonths >= 3 && ageInMonths < 6 && <><li>奶量：180-210ml / 次</li><li>每日约 5-6 次</li></>}
      {ageInMonths >= 6 && <><li>辅食配合：每日 2-3 次辅食</li><li>奶量维持：约 600-800ml</li></>}
    </ul>
  ), [ageInMonths]);

  const ActionBtn = ({ type, icon, label, color }: { type: LogType, icon: string, label: string, color: string }) => (
    <button onClick={() => setActiveForm(type)} className="flex flex-col items-center group">
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-white mb-1.5 shadow-lg transform active:scale-90 transition-all`}>
        <i className={`fas ${icon} text-xl`}></i>
      </div>
      <span className="text-[11px] font-bold text-slate-500">{label}</span>
    </button>
  );

  const getThemeColor = () => {
    switch (activeForm) {
      case LogType.FEEDING: return 'bg-orange-400';
      case LogType.SLEEP: return 'bg-indigo-400';
      case LogType.DIAPER: return 'bg-teal-400';
      case LogType.VACCINE: return 'bg-emerald-500';
      case LogType.GROWTH: return 'bg-rose-400';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-5 gap-2 px-1">
        <ActionBtn type={LogType.FEEDING} icon="fa-bottle-water" label="喂养" color="bg-orange-400" />
        <ActionBtn type={LogType.SLEEP} icon="fa-moon" label="睡眠" color="bg-indigo-400" />
        <ActionBtn type={LogType.DIAPER} icon="fa-poop" label="尿布" color="bg-teal-400" />
        <ActionBtn type={LogType.VACCINE} icon="fa-syringe" label="疫苗" color="bg-emerald-500" />
        <ActionBtn type={LogType.GROWTH} icon="fa-star" label="成长" color="bg-rose-400" />
      </div>

      {activeForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
          <div className="bg-white rounded-t-[2.5rem] md:rounded-[2rem] w-full max-w-md p-6 shadow-2xl animate-slide-up overflow-hidden flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <span className={`w-2 h-6 rounded-full mr-2 ${getThemeColor()}`}></span>
                记录{activeForm === LogType.FEEDING ? '喂养' : activeForm === LogType.SLEEP ? '睡眠' : activeForm === LogType.DIAPER ? '尿布' : activeForm === LogType.VACCINE ? '疫苗' : '成长瞬间'}
              </h3>
              <button onClick={resetForms} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-400"><i className="fas fa-times"></i></button>
            </div>

            <div className="flex-grow overflow-y-auto no-scrollbar space-y-4 pb-2">
              <CompactTimePicker />

              {activeForm === LogType.FEEDING && (
                <>
                  <ReferenceTip icon="fa-lightbulb" label={`${ageLabel}喂养`}>{feedingTips}</ReferenceTip>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.values(FeedingMethod).map(m => (
                      <button key={m} onClick={() => setFeedingMethod(m)} className={`py-2 rounded-xl border text-[10px] font-bold transition-all ${feedingMethod === m ? 'bg-orange-400 border-orange-400 text-white' : 'bg-white border-slate-100 text-slate-500'}`}>{m}</button>
                    ))}
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex justify-between mb-2"><span className="text-[11px] font-bold text-slate-500">{feedingMethod === FeedingMethod.BREAST ? '时长' : '奶量'}</span><span className="text-orange-500 font-bold text-sm">{feedingMethod === FeedingMethod.BREAST ? `${feedingDuration} min` : `${feedingAmount} ml`}</span></div>
                    <input type="range" min={feedingMethod === FeedingMethod.BREAST ? "1" : "10"} max={feedingMethod === FeedingMethod.BREAST ? "60" : "300"} step={feedingMethod === FeedingMethod.BREAST ? "1" : "10"} value={feedingMethod === FeedingMethod.BREAST ? feedingDuration : feedingAmount} onChange={(e) => feedingMethod === FeedingMethod.BREAST ? setFeedingDuration(parseInt(e.target.value)) : setFeedingAmount(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-400" />
                  </div>
                </>
              )}

              {activeForm === LogType.SLEEP && (
                <>
                  <ReferenceTip icon="fa-bed" label={`${ageLabel}睡眠`}>每日推荐睡眠 {ageInMonths < 6 ? '14-16' : '12-14'} 小时，注意仰卧安全。</ReferenceTip>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex justify-between mb-2"><span className="text-[11px] font-bold text-slate-500">时长</span><span className="text-indigo-500 font-bold text-sm">{Math.floor(sleepDuration/60)}h {sleepDuration%60}m</span></div>
                    <input type="range" min="5" max="600" step="5" value={sleepDuration} onChange={(e) => setSleepDuration(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-400" />
                  </div>
                </>
              )}

              {activeForm === LogType.DIAPER && (
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(DiaperStatus).map(s => (
                    <button key={s} onClick={() => setDiaperStatus(s)} className={`py-4 rounded-xl border text-xs font-bold transition-all ${diaperStatus === s ? 'bg-teal-400 border-teal-400 text-white shadow-sm' : 'bg-white border-slate-100 text-slate-500'}`}>{s}</button>
                  ))}
                </div>
              )}

              {activeForm === LogType.GROWTH && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {cat: GrowthCategory.MILESTONE, icon: 'fa-trophy', label: '里程碑'},
                      {cat: GrowthCategory.SKILL, icon: 'fa-wand-magic-sparkles', label: '新技能'},
                      {cat: GrowthCategory.HEALTH, icon: 'fa-heart-pulse', label: '健康'},
                    ].map(c => (
                      <button key={c.cat} onClick={() => setGrowthCategory(c.cat)} className={`flex flex-col items-center py-3 rounded-xl border transition-all ${growthCategory === c.cat ? 'bg-rose-400 border-rose-400 text-white shadow-sm' : 'bg-white border-slate-100 text-slate-400'}`}>
                        <i className={`fas ${c.icon} mb-1 text-xs`}></i>
                        <span className="text-[10px] font-bold">{c.label}</span>
                      </button>
                    ))}
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">事件名称</label>
                    <input type="text" value={growthEventName} onChange={(e) => setGrowthEventName(e.target.value)} placeholder="如：第一次翻身、长第一颗牙..." className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-rose-300 transition-all" />
                    <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
                      {['第一次笑', '抬头稳了', '会坐了', '会爬了', '叫爸爸', '叫妈妈', '身高体重测量'].map(tag => (
                        <button key={tag} onClick={() => setGrowthEventName(tag)} className="flex-shrink-0 px-3 py-1 bg-slate-100 text-[10px] text-slate-500 rounded-full border border-slate-200">+{tag}</button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-1">体重 (kg)</label>
                      <input type="number" step="0.1" value={growthWeight} onChange={(e) => setGrowthWeight(e.target.value)} placeholder="可选" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-rose-300" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-1">身高 (cm)</label>
                      <input type="number" step="0.1" value={growthHeight} onChange={(e) => setGrowthHeight(e.target.value)} placeholder="可选" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-rose-300" />
                    </div>
                  </div>
                </div>
              )}

              {activeForm === LogType.VACCINE && (
                <div className="space-y-4">
                  <input type="text" value={vaccineName} onChange={(e) => setVaccineName(e.target.value)} placeholder="疫苗名称（如：五联疫苗）" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-emerald-300" />
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">预约下次</label>
                    <input type="date" value={nextDoseDate} onChange={(e) => setNextDoseDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs outline-none" />
                  </div>
                </div>
              )}

              <div className="relative">
                <i className="fas fa-pen-nib absolute left-3 top-3 text-slate-300 text-xs"></i>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="添加备注或记录此刻心情..." rows={1} className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-3 text-xs outline-none focus:ring-1 focus:ring-indigo-300 resize-none min-h-[46px]" />
              </div>
            </div>

            <button onClick={() => handleAddLog(activeForm)} className={`w-full py-4 rounded-2xl text-white font-bold shadow-lg transition-all active:scale-95 mt-2 ${getThemeColor()}`}>保存记录</button>
          </div>
        </div>
      )}
    </div>
  );
};
